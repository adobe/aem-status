/**
 * Historical Monthly Uptime Calculator
 *
 * Computes per-month uptime percentages for AEM Edge Delivery Services
 * based on incident data. Reuses the same downtime calculation logic
 * as slo-calculator.js: downtime = duration × errorRate.
 */

import { parseIncidentTimestamp } from './slo-calculator.js';

/** Service start: June 2023 */
const SERVICE_START_YEAR = 2023;
const SERVICE_START_MONTH = 5; // 0-indexed (June)

/**
 * Get the number of minutes in a given month.
 * @param {number} year
 * @param {number} month - 0-indexed (0 = January)
 * @returns {number}
 */
function minutesInMonth(year, month) {
  return (Date.UTC(year, month + 1, 1) - Date.UTC(year, month, 1)) / 60000;
}

/**
 * Generate a month key string for grouping.
 * @param {Date} date
 * @returns {string} e.g. "2024-03"
 */
function monthKey(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Compute median errorRate for each impact level from incidents that have errorRate data.
 * Returns an object like { none: 0.001, minor: 0.00927, major: 0.0833, critical: 0.1666 }
 */
function computeMedianErrorRates(incidents) {
  const byImpact = {};
  incidents.forEach((inc) => {
    const rate = parseFloat(inc.errorRate);
    if (rate > 0 && inc.impact) {
      if (!byImpact[inc.impact]) byImpact[inc.impact] = [];
      byImpact[inc.impact].push(rate);
    }
  });

  const medians = {};
  Object.entries(byImpact).forEach(([impact, rates]) => {
    rates.sort((a, b) => a - b);
    const mid = Math.floor(rates.length / 2);
    medians[impact] = rates.length % 2 === 0
      ? (rates[mid - 1] + rates[mid]) / 2
      : rates[mid];
  });

  // For impact levels with no data, use fallbacks based on available data
  if (!medians.critical) medians.critical = (medians.major || 0.0833) * 2;
  if (!medians.major) medians.major = 0.0833;
  if (!medians.minor) medians.minor = 0.01;
  if (!medians.none) medians.none = 0.001;

  return medians;
}

/**
 * Compute monthly uptime from an array of incidents.
 *
 * @param {Array} incidents - Raw incident objects from incidents/index.json
 * @returns {Array<Object>} Sorted array (oldest first) of monthly records:
 *   { month (1-12), year, key ("YYYY-MM"),
 *     delivery: uptimePercentage, publishing: uptimePercentage,
 *     incidents: [filtered incident refs for that month] }
 */
export function computeMonthlyUptime(incidents) {
  const services = ['delivery', 'publishing'];

  // --- 1. Enrich incidents with missing fields, then parse & filter ---
  const impactRates = computeMedianErrorRates(incidents);

  const enriched = incidents
    .map((incident) => {
      const entry = { ...incident };

      // Skip maintenance
      if (incident.impact === 'maintenance') return null;

      // Infer impactedService from name if missing
      if (!entry.impactedService) {
        const name = (incident.name || '').toLowerCase();
        const isPublishing = /publish|authoring|code sync|sidekick|admin/.test(name);
        const isDelivery = /delivery|page delivery|error rate|rum|image/.test(name);
        if (isPublishing && !isDelivery) entry.impactedService = 'publishing';
        else if (isDelivery && !isPublishing) entry.impactedService = 'delivery';
        else entry.impactedService = 'both';
      }

      // Infer errorRate from impact if missing or 0
      if (!entry.errorRate || parseFloat(entry.errorRate) === 0) {
        entry.errorRate = String(impactRates[incident.impact] || 0.01);
      }

      return entry;
    })
    .filter(Boolean);

  // Expand "both" entries into two entries (one per service)
  const expanded = [];
  enriched.forEach((inc) => {
    if (inc.impactedService === 'both') {
      expanded.push({ ...inc, impactedService: 'delivery' });
      expanded.push({ ...inc, impactedService: 'publishing' });
    } else {
      expanded.push(inc);
    }
  });

  const parsed = expanded
    .map((incident) => ({
      startTime: parseIncidentTimestamp(incident.startTime),
      endTime: parseIncidentTimestamp(incident.endTime),
      impactedService: incident.impactedService,
      errorRate: parseFloat(incident.errorRate) || 0,
      code: incident.code,
      name: incident.name,
    }))
    .filter(({
      startTime, endTime, impactedService, errorRate,
    }) => startTime && endTime && impactedService && errorRate > 0);

  // --- 2. Build full month list from service start to now, clamping incidents ---
  const now = new Date();
  const results = [];

  let year = SERVICE_START_YEAR;
  let month = SERVICE_START_MONTH;

  while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const totalMins = minutesInMonth(year, month);
    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 1));
    const entry = { month: month + 1, year, key };

    const downtimeByService = {};
    const monthIncidents = [];
    services.forEach((s) => { downtimeByService[s] = 0; });

    parsed.forEach(({
      startTime, endTime, impactedService, errorRate, code, name,
    }) => {
      // Check if incident overlaps this month
      if (endTime <= monthStart || startTime >= monthEnd) return;
      const overlapStart = Math.max(startTime.getTime(), monthStart.getTime());
      const overlapEnd = Math.min(endTime.getTime(), monthEnd.getTime());
      if (overlapEnd <= overlapStart) return;
      const overlapMins = (overlapEnd - overlapStart) / 60000;
      const downtimeMins = overlapMins * errorRate;
      downtimeByService[impactedService] = (downtimeByService[impactedService] || 0) + downtimeMins;
      monthIncidents.push({
        code, name, impactedService, errorRate, durationMins: overlapMins, downtimeMins,
      });
    });

    services.forEach((service) => {
      const downtime = downtimeByService[service] || 0;
      const uptimeMins = totalMins - downtime;
      entry[service] = Math.min(uptimeMins / totalMins, 1);
    });

    entry.incidents = monthIncidents;
    results.push(entry);

    // advance
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }

  return results;
}


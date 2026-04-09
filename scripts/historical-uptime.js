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
  // Day 0 of next month = last day of this month
  const days = new Date(year, month + 1, 0).getDate();
  return days * 24 * 60;
}

/**
 * Generate a month key string for grouping.
 * @param {Date} date
 * @returns {string} e.g. "2024-03"
 */
function monthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
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
  const impactRates = { critical: 1.0, major: 0.5, minor: 0.1, none: 0.01 };

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

  // --- 2. Build downtime map keyed by "YYYY-MM" + service ---
  // downtimeMap["2024-03"]["delivery"] = total downtime minutes
  const downtimeMap = {};
  const incidentMap = {};

  parsed.forEach(({
    startTime, endTime, impactedService, errorRate, code, name,
  }) => {
    const key = monthKey(startTime);
    const durationMins = (endTime.getTime() - startTime.getTime()) / 60000;
    const downtimeMins = durationMins * errorRate;

    if (!downtimeMap[key]) {
      downtimeMap[key] = {};
      services.forEach((s) => { downtimeMap[key][s] = 0; });
    }
    downtimeMap[key][impactedService] = (downtimeMap[key][impactedService] || 0) + downtimeMins;

    if (!incidentMap[key]) incidentMap[key] = [];
    incidentMap[key].push({ code, name, impactedService, errorRate, durationMins, downtimeMins });
  });

  // --- 3. Build full month list from service start to now ---
  const now = new Date();
  const results = [];

  let year = SERVICE_START_YEAR;
  let month = SERVICE_START_MONTH;

  while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const totalMins = minutesInMonth(year, month);
    const entry = { month: month + 1, year, key };

    services.forEach((service) => {
      const downtime = (downtimeMap[key] && downtimeMap[key][service]) || 0;
      const uptimeMins = totalMins - downtime;
      entry[service] = uptimeMins / totalMins;
    });

    entry.incidents = incidentMap[key] || [];
    results.push(entry);

    // advance
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }

  return results;
}


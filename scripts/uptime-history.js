import { parseIncidentTimestamp } from './slo-calculator.js';

const SLA_TARGETS = {
  delivery: 0.9999,
  publishing: 0.999,
};

const START_YEAR = 2023;
const START_MONTH = 5; // June 2023 (0-indexed)

// Scale range: we map uptime from SCALE_MIN..100% to 0..100% of bar height
const SCALE_MIN = 95;

/**
 * Compute monthly uptime from raw incident data.
 * This is a fallback if scripts/historical-uptime.js is not yet available.
 */
function computeMonthlyUptime(incidents) {
  const now = new Date();
  const months = [];

  // Build list of months from June 2023 to now
  for (let y = START_YEAR; ; y++) {
    const startM = y === START_YEAR ? START_MONTH : 0;
    for (let m = startM; m < 12; m++) {
      if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) break;
      months.push({ year: y, month: m });
    }
    if (y >= now.getFullYear()) break;
  }

  // Parse incidents once
  const parsed = incidents
    .map((inc) => ({
      startTime: parseIncidentTimestamp(inc.startTime),
      endTime: parseIncidentTimestamp(inc.endTime),
      impactedService: inc.impactedService,
      errorRate: parseFloat(inc.errorRate) || 0,
    }))
    .filter((i) => i.startTime && i.endTime && i.impactedService && i.errorRate);

  return months.map(({ year, month }) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);
    const totalMins = (monthEnd - monthStart) / 60000;

    const services = {};
    Object.keys(SLA_TARGETS).forEach((svc) => {
      services[svc] = { downtimeMins: 0, incidentCount: 0, incidents: [] };
    });

    parsed.forEach((inc) => {
      if (!services[inc.impactedService]) return;
      // Check if incident overlaps this month
      if (inc.endTime <= monthStart || inc.startTime >= monthEnd) return;
      const overlapStart = Math.max(inc.startTime.getTime(), monthStart.getTime());
      const overlapEnd = Math.min(inc.endTime.getTime(), monthEnd.getTime());
      const overlapMins = (overlapEnd - overlapStart) / 60000;
      const downtimeMins = overlapMins * inc.errorRate;
      services[inc.impactedService].downtimeMins += downtimeMins;
      services[inc.impactedService].incidentCount += 1;
      services[inc.impactedService].incidents.push(inc);
    });

    const entry = { year, month };
    Object.entries(services).forEach(([svc, data]) => {
      const uptime = (totalMins - data.downtimeMins) / totalMins;
      entry[svc] = {
        uptime: Math.min(uptime, 1) * 100,
        incidentCount: data.incidentCount,
        downtimeMins: Math.round(data.downtimeMins * 100) / 100,
      };
    });
    return entry;
  });
}

function getBarColor(uptimePct) {
  if (uptimePct >= 99.99) return 'level-excellent';
  if (uptimePct >= 99.9) return 'level-good';
  if (uptimePct >= 99) return 'level-fair';
  if (uptimePct >= 95) return 'level-poor';
  return 'level-bad';
}

function barHeight(uptimePct) {
  // Map SCALE_MIN..100 → 5%..100% of container height
  const clamped = Math.max(uptimePct, SCALE_MIN);
  const pct = ((clamped - SCALE_MIN) / (100 - SCALE_MIN)) * 95 + 5;
  return `${pct}%`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function renderChart(containerId, data, service) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const slaTarget = SLA_TARGETS[service] * 100;
  const slaHeight = ((Math.max(slaTarget, SCALE_MIN) - SCALE_MIN) / (100 - SCALE_MIN)) * 95 + 5;

  // SLA line
  const slaLine = document.createElement('div');
  slaLine.className = 'sla-line';
  slaLine.style.bottom = `${slaHeight}%`;
  container.appendChild(slaLine);

  let lastYear = null;
  data.forEach((entry) => {
    const svcData = entry[service];
    const uptime = svcData.uptime;
    const group = document.createElement('div');
    group.className = 'bar-group';

    const bar = document.createElement('div');
    bar.className = `bar-col ${getBarColor(uptime)}`;
    bar.style.height = barHeight(uptime);
    bar.dataset.month = entry.month;
    bar.dataset.year = entry.year;
    bar.dataset.service = service;
    bar.dataset.uptime = uptime.toFixed(4);
    bar.dataset.incidents = svcData.incidentCount;
    bar.dataset.downtime = svcData.downtimeMins;
    group.appendChild(bar);

    // X-axis label: show month abbr, emphasize January / first month
    const label = document.createElement('div');
    if (entry.month === 0 || (entry.year === START_YEAR && entry.month === START_MONTH)) {
      label.className = 'x-label year-label';
      label.textContent = `${entry.year}`;
      lastYear = entry.year;
    } else if (entry.year !== lastYear && entry.month !== 0) {
      // Show year on first visible bar of a new year
      label.className = 'x-label year-label';
      label.textContent = `${entry.year}`;
      lastYear = entry.year;
    } else {
      label.className = 'x-label';
      label.textContent = MONTH_NAMES[entry.month];
    }
    group.appendChild(label);
    container.appendChild(group);
  });
}


function renderYAxis(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const ticks = [100, 99, 98, 97, 96, 95];
  ticks.forEach((val) => {
    const label = document.createElement('div');
    label.className = 'y-label';
    label.textContent = `${val}%`;
    container.appendChild(label);
  });
}

function initTooltip() {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;

  document.addEventListener('mouseover', (e) => {
    const bar = e.target.closest('.bar-col');
    if (!bar) {
      tooltip.classList.remove('visible');
      return;
    }
    const month = parseInt(bar.dataset.month, 10);
    const year = parseInt(bar.dataset.year, 10);
    const uptime = parseFloat(bar.dataset.uptime);
    const incidents = parseInt(bar.dataset.incidents, 10);
    const downtime = parseFloat(bar.dataset.downtime);

    const monthName = MONTH_NAMES[month];
    tooltip.innerHTML = `<strong>${monthName} ${year}</strong>
      <div class="tooltip-row"><span>Uptime:</span><span>${uptime.toFixed(4)}%</span></div>
      <div class="tooltip-row"><span>Incidents:</span><span>${incidents}</span></div>
      <div class="tooltip-row"><span>Downtime:</span><span>${Math.round(downtime)} min</span></div>`;
    tooltip.classList.add('visible');
  });

  document.addEventListener('mousemove', (e) => {
    if (!tooltip.classList.contains('visible')) return;
    const x = e.clientX + 12;
    const y = e.clientY - 10;
    tooltip.style.left = `${Math.min(x, window.innerWidth - 260)}px`;
    tooltip.style.top = `${Math.max(y - 60, 8)}px`;
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.bar-col')) {
      tooltip.classList.remove('visible');
    }
  });
}

/**
 * Normalize data from historical-uptime.js into chart format.
 * historical-uptime.js returns: { month: 1-12, year, delivery: 0.9999, publishing: 1.0, incidents: [...] }
 * Chart expects: { month: 0-11, year, delivery: { uptime: 99.99, incidentCount: N, downtimeMins: N } }
 */
function normalizeExternalData(rawData) {
  return rawData.map((entry) => {
    const normalized = { year: entry.year, month: entry.month - 1 };
    Object.keys(SLA_TARGETS).forEach((svc) => {
      const uptimeFraction = entry[svc];
      const incidentsForService = (entry.incidents || []).filter((i) => i.impactedService === svc);
      const totalDowntime = incidentsForService.reduce((sum, i) => sum + (i.downtimeMins || 0), 0);
      normalized[svc] = {
        uptime: (typeof uptimeFraction === 'number' ? uptimeFraction : 1) * 100,
        incidentCount: incidentsForService.length,
        downtimeMins: Math.round(totalDowntime * 100) / 100,
      };
    });
    return normalized;
  });
}

async function init() {
  let data;

  // Try to use the historical-uptime module if available
  try {
    const mod = await import('./historical-uptime.js');
    if (mod.computeMonthlyUptime) {
      const incidents = await (await fetch('/incidents/index.json')).json();
      const rawData = mod.computeMonthlyUptime(incidents);
      data = normalizeExternalData(rawData);
    } else if (mod.getMonthlyUptime) {
      const rawData = await mod.getMonthlyUptime();
      data = normalizeExternalData(rawData);
    }
  } catch {
    // Module not available yet — fall back to inline computation
  }

  if (!data) {
    const incidents = await (await fetch('/incidents/index.json')).json();
    data = computeMonthlyUptime(incidents);
  }

  renderYAxis('delivery-y-axis');
  renderYAxis('publishing-y-axis');
  renderChart('delivery-chart', data, 'delivery');
  renderChart('publishing-chart', data, 'publishing');
  initTooltip();

  // Update copyright year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  document.body.classList.add('ready');
}

init();

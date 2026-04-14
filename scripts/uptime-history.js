import { computeMonthlyUptime } from './historical-uptime.js';

const SLA_TARGETS = {
  delivery: 0.9999,
  publishing: 0.999,
};

const START_YEAR = 2023;
const START_MONTH = 5; // June 2023 (0-indexed)

// Nines scale: max nines to display (100% uptime caps here)
const MAX_NINES = 7;
const CHART_HEIGHT = 250; // px, must match .chart-area { height: 250px }

function getBarColor(uptimePct, slaTargetFraction) {
  const nines = uptimeToNines(uptimePct);
  const slaTargetNines = uptimeToNines(slaTargetFraction * 100);

  if (nines >= slaTargetNines + 1) return 'level-exceeds';
  if (nines >= slaTargetNines) return 'level-meets';
  if (nines >= slaTargetNines - 1) return 'level-misses';
  if (nines >= slaTargetNines - 2) return 'level-misses-bad';
  return 'level-critical';
}

/**
 * Convert uptime percentage to "nines" value.
 * 90% = 1 nine, 99% = 2, 99.9% = 3, 99.99% = 4, 99.999% = 5, 100% = MAX_NINES
 */
function uptimeToNines(uptimePct) {
  const fraction = uptimePct / 100;
  if (fraction >= 1) return MAX_NINES;
  if (fraction <= 0) return 0;
  return Math.min(-Math.log10(1 - fraction), MAX_NINES);
}

function barHeight(uptimePct) {
  const nines = uptimeToNines(uptimePct);
  // Map 0..MAX_NINES → pixels (min 2px)
  const heightPx = Math.min(Math.max(Math.round((nines / MAX_NINES) * CHART_HEIGHT), 2), CHART_HEIGHT);
  return `${heightPx}px`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function renderChart(containerId, data, service) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const slaTarget = SLA_TARGETS[service] * 100;
  const slaNines = uptimeToNines(slaTarget);
  const slaHeightPx = Math.round((slaNines / MAX_NINES) * CHART_HEIGHT);

  // SLA line
  const slaLine = document.createElement('div');
  slaLine.className = 'sla-line';
  slaLine.style.bottom = `${slaHeightPx}px`;
  container.appendChild(slaLine);

  let lastYear = null;
  data.forEach((entry) => {
    const svcData = entry[service];
    const uptime = svcData.uptime;
    const group = document.createElement('div');
    group.className = 'bar-group';

    const bar = document.createElement('div');
    bar.className = `bar-col ${getBarColor(uptime, SLA_TARGETS[service])}`;
    bar.style.height = barHeight(uptime);
    bar.dataset.month = entry.month;
    bar.dataset.year = entry.year;
    bar.dataset.service = service;
    bar.dataset.uptime = uptime.toFixed(4);
    bar.dataset.incidents = svcData.incidentCount;
    bar.dataset.downtime = svcData.downtimeMins;
    group.appendChild(bar);

    // X-axis label: show month abbr; show abbreviated year for Jan / first month
    const label = document.createElement('div');
    label.className = 'x-label';
    if (entry.month === 0 || (entry.year === START_YEAR && entry.month === START_MONTH)) {
      label.textContent = `'${String(entry.year).slice(2)}`;
      lastYear = entry.year;
    } else if (entry.year !== lastYear && entry.month !== 0) {
      label.textContent = `'${String(entry.year).slice(2)}`;
      lastYear = entry.year;
    } else {
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
  // Nines-based ticks
  const ticks = [
    { label: '100%', nines: MAX_NINES },
    { label: '99.9999%', nines: 6 },
    { label: '99.999%', nines: 5 },
    { label: '99.99%', nines: 4 },
    { label: '99.9%', nines: 3 },
    { label: '99%', nines: 2 },
    { label: '90%', nines: 1 },
  ];
  ticks.forEach((tick) => {
    const label = document.createElement('div');
    label.className = 'y-label';
    label.textContent = tick.label;
    const bottomPx = Math.round((tick.nines / MAX_NINES) * CHART_HEIGHT);
    label.style.position = 'absolute';
    label.style.bottom = `${bottomPx}px`;
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
  const incidents = await (await fetch('/incidents/index.json')).json();
  const rawData = computeMonthlyUptime(incidents);
  const data = normalizeExternalData(rawData);

  renderYAxis('delivery-y-axis');
  renderYAxis('publishing-y-axis');
  renderChart('delivery-chart', data, 'delivery');
  renderChart('publishing-chart', data, 'publishing');
  initTooltip();

  // Update copyright year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Auto-scroll charts to show most recent months (after layout settles)
  setTimeout(() => {
    document.querySelectorAll('.chart-container').forEach((el) => {
      el.scrollLeft = el.scrollWidth;
    });
  }, 100);

  document.body.classList.add('ready');
}

init();

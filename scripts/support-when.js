// Support Case Timing Analysis

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Fetch case data
const getCases = async () => {
  const response = await fetch('/support-cases/index.json');
  return response.json();
};

// Build heatmap data (day x hour)
const buildHeatmapData = (cases) => {
  const heatmap = {};

  // Initialize all cells to 0
  for (let day = 0; day < 7; day += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      heatmap[`${day}-${hour}`] = 0;
    }
  }

  // Count cases
  cases.forEach((c) => {
    if (c.dayOfWeek !== null && c.hour !== null) {
      const key = `${c.dayOfWeek}-${c.hour}`;
      heatmap[key] = (heatmap[key] || 0) + 1;
    }
  });

  return heatmap;
};

// Calculate timing stats
const calculateStats = (cases) => {
  const dayCount = {};
  const hourCount = {};

  cases.forEach((c) => {
    if (c.dayOfWeek !== null) {
      dayCount[c.dayOfWeek] = (dayCount[c.dayOfWeek] || 0) + 1;
    }
    if (c.hour !== null) {
      hourCount[c.hour] = (hourCount[c.hour] || 0) + 1;
    }
  });

  // Find busiest day
  let busiestDay = 0;
  let busiestDayCount = 0;
  Object.entries(dayCount).forEach(([day, count]) => {
    if (count > busiestDayCount) {
      busiestDay = parseInt(day, 10);
      busiestDayCount = count;
    }
  });

  // Find busiest hour
  let busiestHour = 0;
  let busiestHourCount = 0;
  Object.entries(hourCount).forEach(([hour, count]) => {
    if (count > busiestHourCount) {
      busiestHour = parseInt(hour, 10);
      busiestHourCount = count;
    }
  });

  // Weekend vs weekday
  const weekdayCount = [1, 2, 3, 4, 5].reduce((sum, d) => sum + (dayCount[d] || 0), 0);
  const weekendCount = [0, 6].reduce((sum, d) => sum + (dayCount[d] || 0), 0);
  const weekdayPercent = ((weekdayCount / cases.length) * 100).toFixed(1);

  return {
    total: cases.length,
    busiestDay: DAY_NAMES[busiestDay],
    busiestDayCount,
    busiestHour: `${String(busiestHour).padStart(2, '0')}:00 UTC`,
    busiestHourCount,
    weekdayPercent,
  };
};

// Render stats
const renderStats = (stats) => {
  const container = document.getElementById('timing-stats');
  const cards = [
    { value: stats.total, label: 'Total Cases' },
    { value: stats.busiestDay, label: `Busiest Day (${stats.busiestDayCount} cases)` },
    { value: stats.busiestHour, label: `Peak Hour (${stats.busiestHourCount} cases)` },
    { value: `${stats.weekdayPercent}%`, label: 'Created on Weekdays' },
  ];

  cards.forEach((card) => {
    const div = document.createElement('div');
    div.className = 'stat-card';
    div.innerHTML = `
      <div class="stat-value">${card.value}</div>
      <div class="stat-label">${card.label}</div>
    `;
    container.appendChild(div);
  });
};

// Render heatmap
const renderHeatmap = (heatmapData) => {
  const container = document.getElementById('heatmap');
  const maxCount = Math.max(...Object.values(heatmapData));

  // Header row (hours)
  const headerCell = document.createElement('div');
  headerCell.className = 'heatmap-cell header';
  container.appendChild(headerCell);

  for (let hour = 0; hour < 24; hour += 1) {
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell header';
    cell.textContent = hour;
    container.appendChild(cell);
  }

  // Data rows (days)
  for (let day = 0; day < 7; day += 1) {
    // Row header
    const rowHeader = document.createElement('div');
    rowHeader.className = 'heatmap-cell row-header';
    rowHeader.textContent = DAY_NAMES[day].slice(0, 3);
    container.appendChild(rowHeader);

    // Data cells
    for (let hour = 0; hour < 24; hour += 1) {
      const key = `${day}-${hour}`;
      const count = heatmapData[key] || 0;
      const level = count === 0 ? 0 : Math.min(Math.ceil((count / maxCount) * 10), 10);

      const cell = document.createElement('div');
      cell.className = `heatmap-cell level-${level}`;
      cell.textContent = count || '';
      cell.dataset.day = DAY_NAMES[day];
      cell.dataset.hour = hour;
      cell.dataset.count = count;

      cell.addEventListener('mouseenter', () => {
        const tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = `
          <strong>${DAY_NAMES[day]} ${String(hour).padStart(2, '0')}:00-${String(hour).padStart(2, '0')}:59 UTC</strong><br>
          ${count} cases
        `;
        tooltip.classList.add('visible');
      });

      cell.addEventListener('mousemove', (e) => {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.left = `${e.clientX + 15}px`;
        tooltip.style.top = `${e.clientY + 15}px`;
      });

      cell.addEventListener('mouseleave', () => {
        document.getElementById('tooltip').classList.remove('visible');
      });

      container.appendChild(cell);
    }
  }

  // Render legend scale
  const legendScale = document.getElementById('legend-scale');
  for (let i = 0; i <= 10; i += 1) {
    const segment = document.createElement('div');
    segment.className = `legend-scale-segment level-${i}`;
    segment.style.backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue(`--level-${i}`) || '';
    legendScale.appendChild(segment);
  }
};

// Render day of week chart
const renderDayChart = (cases) => {
  const container = document.getElementById('day-chart');
  const dayCounts = {};

  cases.forEach((c) => {
    if (c.dayOfWeek !== null) {
      dayCounts[c.dayOfWeek] = (dayCounts[c.dayOfWeek] || 0) + 1;
    }
  });

  const max = Math.max(...Object.values(dayCounts));

  for (let day = 1; day <= 7; day += 1) {
    const actualDay = day % 7; // Start with Monday (1), end with Sunday (0)
    const count = dayCounts[actualDay] || 0;
    const percent = (count / max) * 100;
    const isWeekend = actualDay === 0 || actualDay === 6;

    const barItem = document.createElement('div');
    barItem.className = 'bar-item';
    barItem.innerHTML = `
      <div class="bar-label">${DAY_NAMES[actualDay]}</div>
      <div class="bar-visual">
        <div class="bar-fill" style="width: ${percent}%; ${isWeekend ? 'background-color: #9e9e9e;' : ''}">
          ${count}
        </div>
      </div>
    `;
    container.appendChild(barItem);
  }
};

// Render month chart
const renderMonthChart = (cases) => {
  const container = document.getElementById('month-chart');
  const monthCounts = {};

  cases.forEach((c) => {
    if (c.month) {
      monthCounts[c.month] = (monthCounts[c.month] || 0) + 1;
    }
  });

  const max = Math.max(...Object.values(monthCounts));

  for (let month = 1; month <= 12; month += 1) {
    const count = monthCounts[month] || 0;
    const percent = (count / max) * 100;

    const barItem = document.createElement('div');
    barItem.className = 'bar-item';
    barItem.innerHTML = `
      <div class="bar-label">${MONTH_NAMES[month - 1]}</div>
      <div class="bar-visual">
        <div class="bar-fill" style="width: ${percent}%;">
          ${count}
        </div>
      </div>
    `;
    container.appendChild(barItem);
  }
};

// Initialize
const init = async () => {
  const cases = await getCases();

  const stats = calculateStats(cases);
  renderStats(stats);

  const heatmapData = buildHeatmapData(cases);
  renderHeatmap(heatmapData);

  renderDayChart(cases);
  renderMonthChart(cases);

  document.getElementById('year').textContent = new Date().getFullYear();
  document.body.classList.add('ready');
};

init();

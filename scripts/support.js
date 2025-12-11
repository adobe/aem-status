// Color palette for product areas
const AREA_COLORS = {
  universal_editor: '#e63946',
  other: '#9d9d9d',
  cdn_config: '#ff9f1c',
  publishing: '#2a9d8f',
  cloud_manager: '#264653',
  site_config: '#e76f51',
  git_integration: '#457b9d',
  dynamic_media: '#f4a261',
  cdn_caching: '#a8dadc',
  assets_dam: '#1d3557',
  content_authoring: '#ffbf69',
  blocks: '#8338ec',
  infrastructure: '#3a86ff',
  rum: '#06d6a0',
  authentication: '#ef476f',
  indexing: '#ffd166',
  performance: '#118ab2',
  admin_api: '#073b4c',
  content_fragments: '#7209b7',
  forms: '#560bad',
  sidekick: '#480ca8',
  live_copy_msm: '#3f37c9',
  templates: '#4361ee',
  commerce: '#4895ef',
};

const AREA_LABELS = {
  universal_editor: 'Universal Editor',
  other: 'Other/Misc',
  cdn_config: 'CDN Configuration',
  publishing: 'Publishing',
  cloud_manager: 'Cloud Manager',
  site_config: 'Site Configuration',
  git_integration: 'Git Integration',
  dynamic_media: 'Dynamic Media',
  cdn_caching: 'CDN Caching',
  assets_dam: 'Assets/DAM',
  content_authoring: 'Content Authoring',
  blocks: 'Blocks',
  infrastructure: 'Infrastructure',
  rum: 'RUM Analytics',
  authentication: 'Authentication',
  indexing: 'Indexing',
  performance: 'Performance',
  admin_api: 'Admin API',
  content_fragments: 'Content Fragments',
  forms: 'Forms',
  sidekick: 'Sidekick',
  live_copy_msm: 'Live Copy/MSM',
  templates: 'Templates',
  commerce: 'Commerce',
};

const ISSUE_COLORS = {
  bug: '#e63946',
  how_to: '#2a9d8f',
  configuration: '#ff9f1c',
  access_provisioning: '#457b9d',
  feature_enablement: '#8338ec',
  outage_degradation: '#ef476f',
  feature_request: '#06d6a0',
  integration: '#3a86ff',
  security: '#ffd166',
  migration: '#7209b7',
  documentation: '#9d9d9d',
  performance: '#118ab2',
};

const ISSUE_LABELS = {
  bug: 'Bug',
  how_to: 'How-to/Guidance',
  configuration: 'Configuration',
  access_provisioning: 'Access/Provisioning',
  feature_enablement: 'Feature Enablement',
  outage_degradation: 'Outage/Degradation',
  feature_request: 'Feature Request',
  integration: 'Integration',
  security: 'Security',
  migration: 'Migration',
  documentation: 'Documentation',
  performance: 'Performance',
};

const REGION_COLORS = {
  Americas: '#2196f3',
  EMEA: '#4caf50',
  APAC: '#ff9800',
  Japan: '#e91e63',
  Unknown: '#9e9e9e',
};

// Fetch case data
const getCases = async () => {
  try {
    const response = await fetch('/support-cases/index.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching support cases:', error);
    return [];
  }
};

// Aggregate by field
const aggregateBy = (cases, field, labelMap = {}) => {
  const counts = {};
  cases.forEach((c) => {
    const val = c[field] || 'unknown';
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([key, count]) => ({
      key,
      label: labelMap[key] || key,
      count,
    }))
    .sort((a, b) => b.count - a.count);
};

// Aggregate tags
const aggregateTags = (cases) => {
  const counts = {};
  cases.forEach((c) => {
    if (c.tags && Array.isArray(c.tags)) {
      c.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    }
  });
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
};

// Calculate metrics
const calculateMetrics = (cases) => {
  const topArea = aggregateBy(cases, 'productArea', AREA_LABELS)[0];
  const topIssue = aggregateBy(cases, 'issueType', ISSUE_LABELS)[0];
  const bugCount = cases.filter((c) => c.issueType === 'bug').length;
  const bugPercent = ((bugCount / cases.length) * 100).toFixed(1);

  const ocaCases = cases.filter((c) => c.oca !== null);
  const avgOca = ocaCases.length > 0
    ? ocaCases.reduce((sum, c) => sum + c.oca, 0) / ocaCases.length
    : 0;

  return {
    total: cases.length,
    topArea,
    topIssue,
    bugPercent,
    avgOca: avgOca.toFixed(1),
  };
};

// Render metrics
const renderMetrics = (metrics) => {
  const container = document.getElementById('key-metrics');
  const cards = [
    { value: metrics.total, label: 'Total Cases Analyzed' },
    {
      value: metrics.topArea ? metrics.topArea.label : 'N/A',
      label: metrics.topArea ? `Top Product Area (${metrics.topArea.count} cases)` : 'Top Product Area',
    },
    {
      value: `${metrics.bugPercent}%`,
      label: 'Cases are Bugs',
    },
    {
      value: `${metrics.avgOca} days`,
      label: 'Avg. Time to Resolution (OCA)',
    },
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

// Render pie chart
const renderPieChart = (data, svgId, colorMap, labelMap) => {
  const svg = document.getElementById(svgId);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const centerX = 200;
  const centerY = 200;
  const radius = 150;

  let currentAngle = -90;

  data.forEach(({ key, count }) => {
    const angle = (count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`);
    path.setAttribute('fill', colorMap[key] || '#cccccc');
    path.classList.add('pie-slice');
    path.dataset.key = key;
    path.dataset.count = count;
    path.dataset.percent = ((count / total) * 100).toFixed(1);

    path.addEventListener('mouseenter', (e) => {
      const tooltip = document.getElementById('tooltip');
      tooltip.innerHTML = `
        <strong>${labelMap[key] || key}</strong><br>
        Cases: ${count}<br>
        Percentage: ${e.target.dataset.percent}%
      `;
      tooltip.classList.add('visible');
    });

    path.addEventListener('mousemove', (e) => {
      const tooltip = document.getElementById('tooltip');
      tooltip.style.left = `${e.clientX + 15}px`;
      tooltip.style.top = `${e.clientY + 15}px`;
    });

    path.addEventListener('mouseleave', () => {
      document.getElementById('tooltip').classList.remove('visible');
    });

    svg.appendChild(path);
    currentAngle = endAngle;
  });
};

// Render legend
const renderLegend = (data, containerId, colorMap, labelMap) => {
  const container = document.getElementById(containerId);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  data.forEach(({ key, count }) => {
    const percent = ((count / total) * 100).toFixed(1);
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <div class="legend-color" style="background-color: ${colorMap[key] || '#ccc'}"></div>
      <div class="legend-label">${labelMap[key] || key}</div>
      <div class="legend-value">${count} (${percent}%)</div>
    `;
    container.appendChild(item);
  });
};

// Render bar chart
const renderBarChart = (data, containerId, colorMap = null, colorClass = '') => {
  const container = document.getElementById(containerId);

  if (data.length === 0) {
    container.innerHTML = '<div class="empty-state">No data available</div>';
    return;
  }

  const max = Math.max(...data.map((d) => d.count));

  data.slice(0, 15).forEach(({ key, label, count }) => {
    const percent = (count / max) * 100;
    const color = colorMap ? colorMap[key] : null;

    const barItem = document.createElement('div');
    barItem.className = 'bar-item';
    barItem.innerHTML = `
      <div class="bar-label">${label || key}</div>
      <div class="bar-visual">
        <div class="bar-fill ${colorClass}" style="width: ${percent}%; ${color ? `background-color: ${color}` : ''}">
          ${count}
        </div>
      </div>
    `;
    container.appendChild(barItem);
  });
};

// Render tag cloud
const renderTagCloud = (tags) => {
  const container = document.getElementById('tag-cloud');
  const maxCount = Math.max(...tags.map((t) => t.count));

  tags.forEach(({ tag, count }) => {
    const size = Math.min(5, Math.max(1, Math.ceil((count / maxCount) * 5)));
    const item = document.createElement('div');
    item.className = `tag-item size-${size}`;
    item.innerHTML = `${tag.replace(/_/g, ' ')}<span class="tag-count">${count}</span>`;

    item.addEventListener('mouseenter', () => {
      const tooltip = document.getElementById('tooltip');
      tooltip.innerHTML = `<strong>${tag.replace(/_/g, ' ')}</strong><br>${count} cases`;
      tooltip.classList.add('visible');
    });

    item.addEventListener('mousemove', (e) => {
      const tooltip = document.getElementById('tooltip');
      tooltip.style.left = `${e.clientX + 15}px`;
      tooltip.style.top = `${e.clientY + 15}px`;
    });

    item.addEventListener('mouseleave', () => {
      document.getElementById('tooltip').classList.remove('visible');
    });

    container.appendChild(item);
  });
};

// Build and render matrix
const renderMatrix = (cases) => {
  const container = document.getElementById('matrix-container');

  // Get top product areas and issue types
  const areaData = aggregateBy(cases, 'productArea', AREA_LABELS).slice(0, 10);
  const issueData = aggregateBy(cases, 'issueType', ISSUE_LABELS);

  const areas = areaData.map((d) => d.key);
  const issues = issueData.map((d) => d.key);

  // Build matrix
  const matrix = {};
  cases.forEach((c) => {
    const key = `${c.productArea}:${c.issueType}`;
    matrix[key] = (matrix[key] || 0) + 1;
  });

  const maxValue = Math.max(...Object.values(matrix));

  const matrixEl = document.createElement('div');
  matrixEl.className = 'matrix';

  // Header row
  const headerRow = document.createElement('div');
  headerRow.className = 'matrix-row';

  const cornerCell = document.createElement('div');
  cornerCell.className = 'matrix-cell header';
  headerRow.appendChild(cornerCell);

  issues.forEach((issue) => {
    const cell = document.createElement('div');
    cell.className = 'matrix-cell header';
    cell.textContent = ISSUE_LABELS[issue] || issue;
    cell.style.fontSize = '10px';
    headerRow.appendChild(cell);
  });

  matrixEl.appendChild(headerRow);

  // Data rows
  areas.forEach((area) => {
    const row = document.createElement('div');
    row.className = 'matrix-row';

    const labelCell = document.createElement('div');
    labelCell.className = 'matrix-cell row-label';
    labelCell.textContent = AREA_LABELS[area] || area;
    row.appendChild(labelCell);

    issues.forEach((issue) => {
      const key = `${area}:${issue}`;
      const count = matrix[key] || 0;
      const level = count === 0 ? 0 : Math.min(Math.ceil((count / maxValue) * 10), 10);

      const cell = document.createElement('div');
      cell.className = `matrix-cell data level-${level}`;
      cell.textContent = count || '-';

      if (count > 0) {
        cell.addEventListener('mouseenter', () => {
          const tooltip = document.getElementById('tooltip');
          tooltip.innerHTML = `
            <strong>${AREA_LABELS[area] || area}</strong><br>
            ${ISSUE_LABELS[issue] || issue}: ${count} cases
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
      }

      row.appendChild(cell);
    });

    matrixEl.appendChild(row);
  });

  container.appendChild(matrixEl);
};

// Render monthly trend
const renderTrend = (cases) => {
  const svg = document.getElementById('trend-chart');

  // Group by year-month
  const monthly = {};
  cases.forEach((c) => {
    if (c.year && c.month) {
      const key = `${c.year}-${String(c.month).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + 1;
    }
  });

  const sortedMonths = Object.keys(monthly).sort();
  const data = sortedMonths.map((key) => ({ month: key, count: monthly[key] }));

  if (data.length === 0) return;

  const width = 900;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map((d) => d.count));
  const xStep = chartWidth / (data.length - 1 || 1);

  // Draw grid lines
  for (let i = 0; i <= 5; i += 1) {
    const y = padding.top + chartHeight - (chartHeight * i) / 5;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', padding.left);
    line.setAttribute('y1', y);
    line.setAttribute('x2', width - padding.right);
    line.setAttribute('y2', y);
    line.classList.add('grid-line');
    svg.appendChild(line);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', padding.left - 10);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.classList.add('axis-label');
    label.textContent = Math.round((maxCount * i) / 5);
    svg.appendChild(label);
  }

  // Build path
  let pathD = '';
  let areaD = `M ${padding.left} ${padding.top + chartHeight}`;

  data.forEach((d, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartHeight - (d.count / maxCount) * chartHeight;

    if (i === 0) {
      pathD = `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
    areaD += ` L ${x} ${y}`;

    // Add point
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', 5);
    circle.classList.add('trend-point');

    circle.addEventListener('mouseenter', () => {
      const tooltip = document.getElementById('tooltip');
      tooltip.innerHTML = `<strong>${d.month}</strong><br>${d.count} cases`;
      tooltip.classList.add('visible');
    });

    circle.addEventListener('mousemove', (e) => {
      const tooltip = document.getElementById('tooltip');
      tooltip.style.left = `${e.clientX + 15}px`;
      tooltip.style.top = `${e.clientY + 15}px`;
    });

    circle.addEventListener('mouseleave', () => {
      document.getElementById('tooltip').classList.remove('visible');
    });

    svg.appendChild(circle);

    // X-axis label (every 2 months)
    if (i % 2 === 0) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x);
      label.setAttribute('y', height - padding.bottom + 20);
      label.setAttribute('text-anchor', 'middle');
      label.classList.add('axis-label');
      label.textContent = d.month;
      svg.appendChild(label);
    }
  });

  areaD += ` L ${padding.left + (data.length - 1) * xStep} ${padding.top + chartHeight} Z`;

  // Draw area
  const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  area.setAttribute('d', areaD);
  area.classList.add('trend-area');
  svg.insertBefore(area, svg.firstChild);

  // Draw line
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  path.classList.add('trend-line');
  svg.appendChild(path);
};

// Get available years
const getAvailableYears = (cases) => {
  const years = new Set();
  cases.forEach((c) => {
    if (c.year) years.add(c.year);
  });
  return Array.from(years).sort((a, b) => b - a);
};

// Filter by year
const filterByYear = (cases, year) => {
  if (year === 'all') return cases;
  return cases.filter((c) => c.year === parseInt(year, 10));
};

// Render year filters
const renderYearFilters = (cases, currentYear) => {
  const container = document.getElementById('year-filters');
  container.innerHTML = '';

  const years = getAvailableYears(cases);

  const allTab = document.createElement('button');
  allTab.className = `year-tab ${currentYear === 'all' ? 'active' : ''}`;
  allTab.textContent = 'All time';
  allTab.dataset.year = 'all';
  container.appendChild(allTab);

  years.forEach((year) => {
    const tab = document.createElement('button');
    tab.className = `year-tab ${currentYear === year.toString() ? 'active' : ''}`;
    tab.textContent = year;
    tab.dataset.year = year;
    container.appendChild(tab);
  });
};

// Render all visualizations
const renderAll = (cases) => {
  // Clear
  document.getElementById('key-metrics').innerHTML = '';
  document.getElementById('product-area-pie').innerHTML = '';
  document.getElementById('product-area-legend').innerHTML = '';
  document.getElementById('issue-type-chart').innerHTML = '';
  document.getElementById('priority-chart').innerHTML = '';
  document.getElementById('integration-chart').innerHTML = '';
  document.getElementById('authoring-chart').innerHTML = '';
  document.getElementById('region-pie').innerHTML = '';
  document.getElementById('region-legend').innerHTML = '';
  document.getElementById('tag-cloud').innerHTML = '';
  document.getElementById('matrix-container').innerHTML = '';
  document.getElementById('trend-chart').innerHTML = '';

  // Aggregate
  const areaData = aggregateBy(cases, 'productArea', AREA_LABELS);
  const issueData = aggregateBy(cases, 'issueType', ISSUE_LABELS);
  const priorityData = aggregateBy(cases, 'priority');
  // Sort priorities by priority order, not frequency
  const priorityOrder = ['P1', 'P2', 'P3', 'P4', 'Unknown'];
  priorityData.sort((a, b) => priorityOrder.indexOf(a.key) - priorityOrder.indexOf(b.key));
  const integrationData = aggregateBy(cases, 'integrationType')
    .filter((d) => d.key !== 'none');
  const authoringData = aggregateBy(cases, 'authoringMode')
    .filter((d) => d.key !== 'unknown');
  const regionData = aggregateBy(cases, 'region');
  const tags = aggregateTags(cases);
  const metrics = calculateMetrics(cases);

  // Render
  renderMetrics(metrics);
  renderPieChart(areaData, 'product-area-pie', AREA_COLORS, AREA_LABELS);
  renderLegend(areaData, 'product-area-legend', AREA_COLORS, AREA_LABELS);
  renderBarChart(issueData, 'issue-type-chart', ISSUE_COLORS);
  renderBarChart(priorityData, 'priority-chart', {
    P1: '#e63946',
    P2: '#ff9f1c',
    P3: '#2196f3',
    P4: '#9e9e9e',
    Unknown: '#cccccc',
  });
  renderBarChart(integrationData, 'integration-chart');
  renderBarChart(authoringData, 'authoring-chart');
  renderPieChart(regionData, 'region-pie', REGION_COLORS, {});
  renderLegend(regionData, 'region-legend', REGION_COLORS, {});
  renderTagCloud(tags);
  renderMatrix(cases);
  renderTrend(cases);
};

// Initialize
const init = async () => {
  const allCases = await getCases();
  let currentYear = 'all';

  renderYearFilters(allCases, currentYear);
  renderAll(allCases);

  document.getElementById('year-filters').addEventListener('click', (e) => {
    if (e.target.classList.contains('year-tab')) {
      const { year } = e.target.dataset;
      currentYear = year;

      document.querySelectorAll('.year-tab').forEach((tab) => {
        tab.classList.remove('active');
      });
      e.target.classList.add('active');

      const filtered = filterByYear(allCases, year);
      renderAll(filtered);
    }
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  document.body.classList.add('ready');
};

init();

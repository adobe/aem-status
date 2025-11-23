// Color palette for root causes
const CAUSE_COLORS = {
  'third-party-outage': '#e63946',
  'configuration-change': '#ff9f1c',
  'deployment-issue': '#ffbf69',
  unknown: '#9d9d9d',
  'credential-issue': '#a8dadc',
  'resource-limits': '#457b9d',
  'dns-issue': '#1d3557',
  'network-issue': '#2a9d8f',
  'dependency-issue': '#e76f51',
};

const CAUSE_LABELS = {
  'third-party-outage': 'Third-party Outage',
  'configuration-change': 'Configuration Change',
  'deployment-issue': 'Deployment Issue',
  unknown: 'Unknown',
  'credential-issue': 'Credential Issue',
  'resource-limits': 'Resource Limits',
  'dns-issue': 'DNS Issue',
  'network-issue': 'Network Issue',
  'dependency-issue': 'Dependency Issue',
};

// Fetch incident data
const getIncidents = async () => {
  const response = await fetch('/incidents/index.json');
  const incidents = await response.json();
  return incidents;
};

// Aggregate root causes
const aggregateRootCauses = (incidents) => {
  const causes = {};
  incidents.forEach((incident) => {
    const cause = incident.rootCause || 'unknown';
    causes[cause] = (causes[cause] || 0) + 1;
  });
  return Object.entries(causes)
    .map(([cause, count]) => ({ cause, count }))
    .sort((a, b) => b.count - a.count);
};

// Aggregate internal services
const aggregateServices = (incidents) => {
  const services = {};
  incidents.forEach((incident) => {
    const serviceList = incident.internalServices || [];
    serviceList.forEach((service) => {
      services[service] = (services[service] || 0) + 1;
    });
  });
  return Object.entries(services)
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);
};

// Aggregate external vendors
const aggregateVendors = (incidents) => {
  const vendors = {};
  incidents.forEach((incident) => {
    const vendorList = incident.externalVendors || [];
    vendorList.forEach((vendor) => {
      vendors[vendor] = (vendors[vendor] || 0) + 1;
    });
  });
  return Object.entries(vendors)
    .map(([vendor, count]) => ({ vendor, count }))
    .sort((a, b) => b.count - a.count);
};

// Build dependency matrix
const buildDependencyMatrix = (incidents) => {
  const matrix = {};
  const allServices = new Set();
  const allVendors = new Set();

  incidents.forEach((incident) => {
    // Combine affectedComponents (delivery, publishing) with internalServices
    const affectedComponents = incident.affectedComponents || [];
    const internalServices = incident.internalServices || [];
    const services = [...affectedComponents, ...internalServices];
    const vendors = incident.externalVendors || [];

    services.forEach((s) => allServices.add(s));
    vendors.forEach((v) => allVendors.add(v));

    // Track co-occurrence
    if (services.length > 0 && vendors.length > 0) {
      services.forEach((service) => {
        vendors.forEach((vendor) => {
          const key = `${service}:${vendor}`;
          matrix[key] = (matrix[key] || 0) + 1;
        });
      });
    }
  });

  // Sort services with delivery and publishing first
  const servicesList = Array.from(allServices);
  const sortedServices = [];

  // Add delivery first if it exists
  if (servicesList.includes('delivery')) {
    sortedServices.push('delivery');
  }
  // Add publishing second if it exists
  if (servicesList.includes('publishing')) {
    sortedServices.push('publishing');
  }
  // Add remaining services alphabetically
  servicesList
    .filter((s) => s !== 'delivery' && s !== 'publishing')
    .sort()
    .forEach((s) => sortedServices.push(s));

  return {
    matrix,
    services: sortedServices,
    vendors: Array.from(allVendors).sort(),
  };
};

// Calculate key metrics
const calculateMetrics = (incidents, services, vendors) => {
  const topVendor = vendors.length > 0 ? vendors[0] : null;
  const topService = services.length > 0 ? services[0] : null;

  let mixedCount = 0;
  incidents.forEach((incident) => {
    const hasService = incident.internalServices && incident.internalServices.length > 0;
    const hasVendor = incident.externalVendors && incident.externalVendors.length > 0;
    if (hasService && hasVendor) {
      mixedCount += 1;
    }
  });

  const mixedPercent = ((mixedCount / incidents.length) * 100).toFixed(1);

  return {
    total: incidents.length,
    topVendor,
    topService,
    mixedPercent,
  };
};

// Render key metrics
const renderMetrics = (metrics) => {
  const container = document.getElementById('key-metrics');
  const cards = [
    { value: metrics.total, label: 'Total Incidents Analyzed' },
    {
      value: metrics.topVendor ? `${metrics.topVendor.vendor}` : 'N/A',
      label: metrics.topVendor ? `Top Vendor (${metrics.topVendor.count} incidents)` : 'Top Vendor',
    },
    {
      value: metrics.topService ? `${metrics.topService.service}` : 'N/A',
      label: metrics.topService ? `Top Service (${metrics.topService.count} incidents)` : 'Top Service',
    },
    { value: `${metrics.mixedPercent}%`, label: 'Mixed Internal/External Causes' },
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
const renderPieChart = (causes) => {
  const svg = document.getElementById('pie-chart');
  const total = causes.reduce((sum, c) => sum + c.count, 0);
  const centerX = 200;
  const centerY = 200;
  const radius = 150;

  let currentAngle = -90; // Start from top

  causes.forEach((causeData) => {
    const { cause, count } = causeData;
    const angle = (count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Convert to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate arc path
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`);
    path.setAttribute('fill', CAUSE_COLORS[cause] || '#cccccc');
    path.classList.add('pie-slice');
    path.dataset.cause = cause;
    path.dataset.count = count;
    path.dataset.percent = ((count / total) * 100).toFixed(1);

    // Tooltip
    path.addEventListener('mouseenter', (e) => {
      const tooltip = document.getElementById('tooltip');
      tooltip.innerHTML = `
                <strong>${CAUSE_LABELS[cause] || cause}</strong><br>
                Incidents: ${count}<br>
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
      const tooltip = document.getElementById('tooltip');
      tooltip.classList.remove('visible');
    });

    svg.appendChild(path);
    currentAngle = endAngle;
  });
};

// Render cause legend
const renderCauseLegend = (causes) => {
  const container = document.getElementById('cause-legend');
  const total = causes.reduce((sum, c) => sum + c.count, 0);

  causes.forEach(({ cause, count }) => {
    const percent = ((count / total) * 100).toFixed(1);
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
            <div class="legend-color" style="background-color: ${CAUSE_COLORS[cause] || '#ccc'}"></div>
            <div class="legend-label">${CAUSE_LABELS[cause] || cause}</div>
            <div class="legend-value">${count} (${percent}%)</div>
        `;
    container.appendChild(item);
  });
};

// Render bar chart
const renderBarChart = (data, containerId, isVendor = false) => {
  const container = document.getElementById(containerId);

  if (data.length === 0) {
    container.innerHTML = '<div class="empty-state">No data available</div>';
    return;
  }

  const max = Math.max(...data.map((d) => d.count));

  data.forEach((item) => {
    const label = item.service || item.vendor;
    const { count } = item;
    const percent = (count / max) * 100;

    const barItem = document.createElement('div');
    barItem.className = 'bar-item';
    barItem.innerHTML = `
            <div class="bar-label">${label}</div>
            <div class="bar-visual">
                <div class="bar-fill ${isVendor ? 'vendor' : ''}" style="width: ${percent}%">
                    ${count}
                </div>
            </div>
        `;
    container.appendChild(barItem);
  });
};

// Render dependency matrix
const renderMatrix = (matrixData) => {
  const container = document.getElementById('matrix-container');
  const { matrix, services, vendors } = matrixData;

  if (services.length === 0 || vendors.length === 0) {
    container.innerHTML = '<div class="empty-state">No dependency data available</div>';
    return;
  }

  const matrixEl = document.createElement('div');
  matrixEl.className = 'matrix';

  // Find max for color scaling
  const maxValue = Math.max(...Object.values(matrix));

  // Header row
  const headerRow = document.createElement('div');
  headerRow.className = 'matrix-row';

  const cornerCell = document.createElement('div');
  cornerCell.className = 'matrix-cell header';
  headerRow.appendChild(cornerCell);

  vendors.forEach((vendor) => {
    const cell = document.createElement('div');
    cell.className = 'matrix-cell header';
    cell.textContent = vendor;
    headerRow.appendChild(cell);
  });

  matrixEl.appendChild(headerRow);

  // Data rows
  services.forEach((service) => {
    const row = document.createElement('div');
    row.className = 'matrix-row';

    const labelCell = document.createElement('div');
    labelCell.className = 'matrix-cell row-label';
    labelCell.textContent = service;
    row.appendChild(labelCell);

    vendors.forEach((vendor) => {
      const key = `${service}:${vendor}`;
      const count = matrix[key] || 0;
      const level = count === 0 ? 0 : Math.min(Math.ceil((count / maxValue) * 10), 10);

      const cell = document.createElement('div');
      cell.className = `matrix-cell data level-${level}`;
      cell.textContent = count || '-';
      cell.dataset.service = service;
      cell.dataset.vendor = vendor;
      cell.dataset.count = count;

      if (count > 0) {
        cell.addEventListener('mouseenter', () => {
          const tooltip = document.getElementById('tooltip');
          tooltip.innerHTML = `
                        <strong>${service} + ${vendor}</strong><br>
                        Co-occurred in ${count} incident${count !== 1 ? 's' : ''}
                    `;
          tooltip.classList.add('visible');
        });

        cell.addEventListener('mousemove', (e) => {
          const tooltip = document.getElementById('tooltip');
          tooltip.style.left = `${e.clientX + 15}px`;
          tooltip.style.top = `${e.clientY + 15}px`;
        });

        cell.addEventListener('mouseleave', () => {
          const tooltip = document.getElementById('tooltip');
          tooltip.classList.remove('visible');
        });
      }

      row.appendChild(cell);
    });

    matrixEl.appendChild(row);
  });

  container.appendChild(matrixEl);
};

// Filter incidents by year
const filterIncidentsByYear = (incidents, year) => {
  if (year === 'all') return incidents;
  return incidents.filter((incident) => {
    // Use startTime when available, otherwise fall back to incidentUpdated (or legacy timestamp)
    const timestamp = incident.startTime || incident.incidentUpdated || incident.timestamp;
    const date = new Date(timestamp);
    return date.getFullYear() === parseInt(year, 10);
  });
};

// Get unique years from incidents
const getAvailableYears = (incidents) => {
  const years = new Set();
  incidents.forEach((incident) => {
    // Use startTime when available, otherwise fall back to incidentUpdated (or legacy timestamp)
    const timestamp = incident.startTime || incident.incidentUpdated || incident.timestamp;
    const date = new Date(timestamp);
    years.add(date.getFullYear());
  });
  return Array.from(years).sort((a, b) => b - a); // Descending order
};

// Render year filter tabs
const renderYearFilters = (incidents, currentYear) => {
  const container = document.getElementById('year-filters');
  container.innerHTML = '';

  const years = getAvailableYears(incidents);

  // Add "All time" tab
  const allTab = document.createElement('button');
  allTab.className = `year-tab ${currentYear === 'all' ? 'active' : ''}`;
  allTab.textContent = 'All time';
  allTab.dataset.year = 'all';
  container.appendChild(allTab);

  // Add year tabs
  years.forEach((year) => {
    const tab = document.createElement('button');
    tab.className = `year-tab ${currentYear === year.toString() ? 'active' : ''}`;
    tab.textContent = year;
    tab.dataset.year = year;
    container.appendChild(tab);
  });
};

// Render incidents by category
const renderIncidentsByCategory = (incidents) => {
  const container = document.getElementById('incidents-by-category');
  container.innerHTML = '';

  // Group incidents by root cause
  const incidentsByCategory = {};
  incidents.forEach((incident) => {
    const cause = incident.rootCause || 'unknown';
    if (!incidentsByCategory[cause]) {
      incidentsByCategory[cause] = [];
    }
    incidentsByCategory[cause].push(incident);
  });

  // Sort categories by count (descending)
  const sortedCategories = Object.entries(incidentsByCategory)
    .sort((a, b) => b[1].length - a[1].length);

  // Render each category
  sortedCategories.forEach(([cause, categoryIncidents]) => {
    const categorySection = document.createElement('div');
    categorySection.className = 'incident-category';

    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';
    categoryHeader.innerHTML = `
            <div class="category-title-wrapper">
                <div class="category-color-indicator" style="background-color: ${CAUSE_COLORS[cause] || '#ccc'}"></div>
                <h3 class="category-title">${CAUSE_LABELS[cause] || cause}</h3>
                <span class="category-count">${categoryIncidents.length} incident${categoryIncidents.length !== 1 ? 's' : ''}</span>
            </div>
            <button class="category-toggle">▼</button>
        `;

    const incidentList = document.createElement('div');
    incidentList.className = 'incident-list';

    // Sort incidents by startTime (most recent first)
    const sortedIncidents = [...categoryIncidents].sort((a, b) => {
      // Use startTime when available, otherwise fall back to incidentUpdated (or legacy timestamp)
      const aTime = a.startTime || a.incidentUpdated || a.timestamp;
      const bTime = b.startTime || b.incidentUpdated || b.timestamp;
      return new Date(bTime) - new Date(aTime);
    });

    sortedIncidents.forEach((incident) => {
      const incidentItem = document.createElement('div');
      incidentItem.className = 'incident-item';

      // Use startTime when available, otherwise fall back to incidentUpdated (or legacy timestamp)
      const timestamp = incident.startTime || incident.incidentUpdated || incident.timestamp;
      const date = new Date(timestamp);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      // Build metadata string
      const metadata = [];
      if (incident.impactedService) {
        metadata.push(`Service: ${incident.impactedService}`);
      }
      if (incident.externalVendors && incident.externalVendors.length > 0) {
        metadata.push(`Vendors: ${incident.externalVendors.join(', ')}`);
      }
      if (incident.internalServices && incident.internalServices.length > 0) {
        metadata.push(`Internal: ${incident.internalServices.join(', ')}`);
      }

      incidentItem.innerHTML = `
                <div class="incident-date">${formattedDate}</div>
                <div class="incident-details">
                    <a href="/details.html?incident=${incident.code}" class="incident-name">${incident.name}</a>
                    <div class="incident-code">${incident.code}</div>
                    ${metadata.length > 0 ? `<div class="incident-metadata">${metadata.join(' • ')}</div>` : ''}
                </div>
            `;

      incidentList.appendChild(incidentItem);
    });

    categorySection.appendChild(categoryHeader);
    categorySection.appendChild(incidentList);
    container.appendChild(categorySection);

    // Add toggle functionality
    categoryHeader.addEventListener('click', () => {
      incidentList.classList.toggle('collapsed');
      const toggle = categoryHeader.querySelector('.category-toggle');
      toggle.textContent = incidentList.classList.contains('collapsed') ? '▶' : '▼';
    });
  });
};

// Render all visualizations
const renderAllVisualizations = (incidents) => {
  // Clear existing visualizations
  document.getElementById('pie-chart').innerHTML = '';
  document.getElementById('cause-legend').innerHTML = '';
  document.getElementById('services-chart').innerHTML = '';
  document.getElementById('vendors-chart').innerHTML = '';
  document.getElementById('matrix-container').innerHTML = '';
  document.getElementById('key-metrics').innerHTML = '';
  document.getElementById('incidents-by-category').innerHTML = '';

  // Aggregate data
  const causes = aggregateRootCauses(incidents);
  const services = aggregateServices(incidents);
  const vendors = aggregateVendors(incidents);
  const matrixData = buildDependencyMatrix(incidents);
  const metrics = calculateMetrics(incidents, services, vendors);

  // Render all visualizations
  renderMetrics(metrics);
  renderPieChart(causes);
  renderCauseLegend(causes);
  renderBarChart(services, 'services-chart', false);
  renderBarChart(vendors, 'vendors-chart', true);
  renderMatrix(matrixData);
  renderIncidentsByCategory(incidents);
};

// Initialize
const init = async () => {
  const allIncidents = await getIncidents();
  let currentYear = 'all';

  // Render year filters
  renderYearFilters(allIncidents, currentYear);

  // Render initial visualizations with all data
  renderAllVisualizations(allIncidents);

  // Add event listeners to year tabs
  document.getElementById('year-filters').addEventListener('click', (e) => {
    if (e.target.classList.contains('year-tab')) {
      const { year } = e.target.dataset;
      currentYear = year;

      // Update active tab
      document.querySelectorAll('.year-tab').forEach((tab) => {
        tab.classList.remove('active');
      });
      e.target.classList.add('active');

      // Filter incidents and re-render
      const filteredIncidents = filterIncidentsByYear(allIncidents, year);
      renderAllVisualizations(filteredIncidents);
    }
  });

  // Set year in footer
  document.getElementById('year').textContent = new Date().getFullYear();
  document.body.classList.add('ready');
};

init();

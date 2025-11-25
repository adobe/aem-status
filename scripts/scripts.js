import { calculateUptime as calculateUptimeBase, parseIncidentTimestamp, getUptimeStatus } from './slo-calculator.js';

const fetchCurrentIncident = async () => {
  const response = await fetch('https://script.google.com/macros/s/AKfycbxoBSj7v-y5WyoeSn1T0KcFsoQXEYQiiK_nmOPf-pKAJqf7w46ubpt0XmwFM7qdbzgCzw/exec', {
    cache: 'reload',
  });
  const json = await response.json();
  const { rows } = json;

  if (!rows.length) return [];

  const data = rows.map((row) => {
    const status = row.Status.toLowerCase();
    const impact = row.Impact.toLowerCase();
    const timestamp = row.Timestamp;
    const comment = row.Comment.replace(/\n/g, '<br>').replace(/https:\/\/\S+/g, '<a href="$&">$&</a>');

    return {
      status,
      impact,
      timestamp,
      comment,
    };
  });

  return data;
};

async function getHistory() {
  const response = await fetch('/incidents/index.json');
  const incidents = await response.json();
  return incidents;
}

const timeAgo = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const isPast = diffMs >= 0;
  const ms = Math.abs(diffMs);

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${prefix}${seconds} second${seconds === 1 ? '' : 's'}${suffix}`;
  if (minutes < 2) return isPast ? 'a minute ago' : 'in a minute';
  if (minutes < 60) return `${prefix}${minutes} minute${minutes === 1 ? '' : 's'}${suffix}`;
  if (hours < 2) return isPast ? 'an hour ago' : 'in an hour';
  if (hours < 24) return `${prefix}${hours} hour${hours === 1 ? '' : 's'}${suffix}`;
  if (days === 1) return isPast ? 'yesterday' : 'tomorrow';
  if (days < 7) return `${prefix}${days} day${days === 1 ? '' : 's'}${suffix}`;
  if (weeks < 2) return isPast ? 'a week ago' : 'in a week';
  if (weeks < 5) return `${prefix}${weeks} week${weeks === 1 ? '' : 's'}${suffix}`;
  if (months < 2) return isPast ? 'a month ago' : 'in a month';
  if (months < 12) return `${prefix}${months} month${months === 1 ? '' : 's'}${suffix}`;
  if (years < 2) return isPast ? 'a year ago' : 'in a year';
  return `${prefix}${years} year${years === 1 ? '' : 's'}${suffix}`;
};

const calculateUptime = (incidents) => {
  const status = calculateUptimeBase(incidents);

  Object.entries(status).forEach(([service, serviceStatus]) => {
    // display uptime details
    const serviceElement = document.querySelector(`.service.${service}`);
    if (!serviceElement) return;
    const uptimeElement = serviceElement.querySelector('.uptime');
    uptimeElement.innerHTML = `
      <h4>90-Day Uptime: ${serviceStatus.uptimePercentage}%</h4>
      <p>${serviceStatus.numIncidents} incident${serviceStatus.numIncidents === 1 ? '' : 's'}</p>
    `;
    // color coding based on uptime
    const statusClass = getUptimeStatus(serviceStatus.uptime, serviceStatus.sla);
    uptimeElement.classList.add(statusClass);
  });
};

const displayLast30Days = (incidents) => {
  const last30DaysContainer = document.getElementById('last30Days');
  last30DaysContainer.innerHTML = '';
  last30DaysContainer.classList.add('incidents');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  // Get all incidents from the last 30 days
  const recentIncidents = incidents.filter((incident) => {
    // Use startTime when available, otherwise fall back to incidentUpdated
    const timestamp = incident.startTime || incident.incidentUpdated;
    const incidentDate = parseIncidentTimestamp(timestamp);
    return incidentDate >= thirtyDaysAgo;
  });

  // Group incidents by day
  const incidentsByDay = {};
  recentIncidents.forEach((incident) => {
    // Use startTime when available, otherwise fall back to incidentUpdated
    const timestamp = incident.startTime || incident.incidentUpdated;
    const incidentDate = parseIncidentTimestamp(timestamp);
    const dayKey = incidentDate.toDateString();
    if (!incidentsByDay[dayKey]) {
      incidentsByDay[dayKey] = [];
    }
    incidentsByDay[dayKey].push(incident);
  });

  // Generate all 30 days and sort in descending order (most recent first)
  const allDays = [];
  for (let i = 0; i < 30; i += 1) {
    const day = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    allDays.push(day);
  }

  allDays.forEach((day) => {
    const dayKey = day.toDateString();
    const dayElement = document.createElement('div');
    const dayTitle = day.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    dayElement.innerHTML = `<h3>${dayTitle}</h3>`;
    dayElement.setAttribute('role', 'listitem');
    last30DaysContainer.appendChild(dayElement);

    const dayIncidents = incidentsByDay[dayKey] || [];

    if (dayIncidents.length === 0) {
      const metaElement = document.createElement('p');
      metaElement.classList.add('meta');
      metaElement.textContent = 'No incidents reported';
      dayElement.appendChild(metaElement);
    } else {
      dayIncidents.forEach((incident) => {
        const incidentElement = document.createElement('div');
        incidentElement.classList.add('incident', incident.impact);
        // Use startTime when available, otherwise fall back to incidentUpdated
        const timestamp = incident.startTime || incident.incidentUpdated;
        const incidentDate = parseIncidentTimestamp(timestamp);

        incidentElement.innerHTML = `<h4><a href="/details.html?incident=${incident.code}">${incident.name}</a><span class="pill ${incident.impact}">${incident.impact}</span></h4>
            <p>${incident.message}</p>
            <time class="meta" datetime="${incidentDate.toISOString()}">${incidentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${incidentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</time>`;
        dayElement.appendChild(incidentElement);
      });
    }
  });
};

const displayIncidentArchive = (incidents) => {
  const incidentArchive = document.getElementById('incidentArchive');
  incidentArchive.innerHTML = '';
  incidentArchive.classList.add('incidents');

  // Group incidents by month/year based on incident occurrence time
  const incidentsByMonth = {};
  incidents.forEach((incident) => {
    // Use startTime when available, otherwise fall back to incidentUpdated
    const timestamp = incident.startTime || incident.incidentUpdated;
    const incidentDate = parseIncidentTimestamp(timestamp);
    const month = incidentDate.toLocaleDateString('en-US', { month: 'long' });
    const year = incidentDate.getFullYear();
    const key = `${year}-${month}`;

    if (!incidentsByMonth[key]) {
      incidentsByMonth[key] = {
        month,
        year,
        incidents: [],
      };
    }
    incidentsByMonth[key].incidents.push(incident);
  });

  // Sort months (newest first)
  const sortedMonths = Object.values(incidentsByMonth).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month);
  });

  sortedMonths.forEach((month) => {
    const monthElement = document.createElement('div');
    monthElement.innerHTML = `<h3>${month.month} ${month.year}</h3>`;
    monthElement.setAttribute('role', 'listitem');
    incidentArchive.appendChild(monthElement);
    if (month.incidents.length === 0) {
      const metaElement = document.createElement('p');
      metaElement.classList.add('meta');
      metaElement.textContent = '(No incidents reported)';
      monthElement.appendChild(metaElement);
    }
    month.incidents.forEach((incident) => {
      const incidentElement = document.createElement('div');
      incidentElement.classList.add('incident', incident.impact);
      // Use startTime when available, otherwise fall back to incidentUpdated
      const timestamp = incident.startTime || incident.incidentUpdated;
      const incidentDate = parseIncidentTimestamp(timestamp);
      incidentElement.innerHTML = `<h4><a href="/details.html?incident=${incident.code}">${incident.name}</a><span class="pill ${incident.impact}">${incident.impact}</span></h4>
          <p>${incident.message}</p>
          <time class="meta" datetime="${incidentDate.toISOString()}">${incidentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${incidentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</time>`;
      monthElement.appendChild(incidentElement);
    });
  });

  const backToTop = document.createElement('p');
  backToTop.innerHTML = '<a class="back-link" href="/">↑ Back to top</a>';
  incidentArchive.appendChild(backToTop);
};

const displayCurrentIncident = (currentIncident) => {
  const updateCurrentImpact = (status, impact, affectedServices) => {
    const impactClasses = {
      minor: 'warn',
      major: 'err',
      none: 'ok',
    };
    document.querySelector('#current-incident').className = `section ${impactClasses[impact]}`;
    if (status === 'resolved' || status === 'monitoring') {
      document.querySelector('header').className = 'ok';
      document.querySelector('.status-overview .status-badge').className = 'status-badge ok';
      document.querySelectorAll('.service').forEach((service) => {
        service.dataset.impacted = '';
        service.querySelector('.state').className = 'state ok';
      });
    } else {
      document.querySelector('header').className = impactClasses[impact] ?? 'ok';
      document.querySelector('.status-overview .status-badge').className = `status-badge ${impactClasses[impact] ?? 'ok'}`;
      document.querySelectorAll('.service').forEach((service) => {
        if (affectedServices.includes(service.classList[1])) {
          service.dataset.impacted = impactClasses[impact] ?? '';
          service.querySelector('.state').className = `state ${impactClasses[impact]}`;
        } else {
          service.dataset.impacted = '';
          service.querySelector('.state').className = 'state ok';
        }
      });
    }
  };

  const parseAffectedServices = (incident) => {
    const affectedServices = [];
    if (incident[incident.length - 1].comment.toLowerCase().includes('publishing')) affectedServices.push('publishing');
    if (incident[incident.length - 1].comment.toLowerCase().includes('delivery')) affectedServices.push('delivery');
    return affectedServices;
  };

  const currentIncidentSection = document.getElementById('current-incident');

  if (currentIncident.length > 0) {
    currentIncidentSection.setAttribute('aria-hidden', 'false');

    currentIncident.reverse();
    const { impact } = currentIncident[0];
    const { status } = currentIncident[0];

    const currentIncidentTitle = document.getElementById('currentIncidentsTitle');
    currentIncidentTitle.textContent = status === 'resolved' ? 'Recent Incident' : 'On-going Incident';

    const affectedServices = parseAffectedServices(currentIncident);
    updateCurrentImpact(status, impact, affectedServices);

    const currentIncidentElement = document.getElementById('current-incident-details');
    currentIncidentElement.innerHTML = '';
    currentIncident.forEach((statusUpdate) => {
      const statusUpdateElement = document.createElement('div');
      statusUpdateElement.classList.add('status-update');
      statusUpdateElement.innerHTML = `<time datetime="${statusUpdate.timestamp}">${timeAgo(new Date(statusUpdate.timestamp))}</time> (${new Date(statusUpdate.timestamp).toLocaleString()}) <span class="pill ${statusUpdate.status}">${statusUpdate.status}</span>
          <p>${statusUpdate.comment}</p>`;
      if (statusUpdate.status) statusUpdateElement.classList.add(statusUpdate.status);
      statusUpdateElement.setAttribute('aria-label', statusUpdate.status);
      currentIncidentElement.appendChild(statusUpdateElement);
    });
  } else {
    updateCurrentImpact('', '', []);
    currentIncidentSection.setAttribute('aria-hidden', 'true');
  }
};

const updateCurrentIncident = async () => {
  const currentIncident = await fetchCurrentIncident();
  displayCurrentIncident(currentIncident);
};

const initArchiveToggle = () => {
  const toggleButton = document.getElementById('archiveToggle');
  const archiveContent = document.getElementById('incidentArchive');

  if (toggleButton && archiveContent) {
    toggleButton.addEventListener('click', () => {
      const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        // Hide archive
        archiveContent.style.display = 'none';
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.querySelector('.toggle-text').textContent = 'Show archive';
        window.history.pushState({}, '', window.location.pathname);
      } else {
        // Show archive
        archiveContent.style.display = 'block';
        toggleButton.setAttribute('aria-expanded', 'true');
        toggleButton.querySelector('.toggle-text').textContent = 'Hide';
        toggleButton.closest('.section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState({}, '', `${window.location.pathname}#archive`);
      }
    });
  }

  const archiveHashChecker = () => {
    if (window.location.hash === '#archive') {
      toggleButton.click();
    }
  };
  window.addEventListener('hashchange', archiveHashChecker);
  archiveHashChecker();
};

const initIncidents = async () => {
  updateCurrentIncident();
  setInterval(updateCurrentIncident, 30000);
  const incidents = await getHistory();
  calculateUptime(incidents);
  displayLast30Days(incidents);
  displayIncidentArchive(incidents);
  initArchiveToggle();

  const copyright = document.getElementById('year');
  copyright.textContent = new Date().getFullYear();
  document.body.classList.add('ready');
};

if (window.location.pathname === '/' || window.location.pathname === '/index.html') initIncidents();

// eslint-disable-next-line import/prefer-default-export
export { fetchCurrentIncident };

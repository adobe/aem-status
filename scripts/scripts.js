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
  /*
  const incidentHistory = [];
  let i = 1;
  let status = 200;
  do {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(`/incidents/json/history-${i}.json`);
    status = response.status;
    if (status === 200) {
      const data = await response.json();
      incidentHistory.push(...data.months);
    }
    i++;
  } while (status === 200);
   */
  const response = await fetch('/incidents/index.json');
  const incidentHistory = await response.json();
  return incidentHistory;
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

const displayIncidentHistory = (history) => {
  const incidentHistory = document.getElementById('incidentHistory');
  incidentHistory.innerHTML = '';
  incidentHistory.classList.add('incidents');
  history.forEach((month) => {
    const monthElement = document.createElement('div');
    monthElement.innerHTML = `<h3>${month.name} ${month.year}</h3>`;
    monthElement.setAttribute('role', 'listitem');
    incidentHistory.appendChild(monthElement);
    if (month.incidents.length === 0) {
      const metaElement = document.createElement('p');
      metaElement.classList.add('meta');
      metaElement.textContent = '(No incidents reported)';
      monthElement.appendChild(metaElement);
    }
    month.incidents.forEach((incident) => {
      const incidentElement = document.createElement('div');
      incidentElement.classList.add('incident', incident.impact);
      incidentElement.innerHTML = `<h4><a href="/details.html?incident=${incident.code}">${incident.name}</a><span class="pill ${incident.impact}">${incident.impact}</span></h4>
          <p>${incident.message}</p>
          <time class="meta" datetime="${incident.timestamp}">${incident.timestamp}</time>`;
      monthElement.appendChild(incidentElement);
    });
  });
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

const initIncidents = async () => {
  updateCurrentIncident();
  setInterval(updateCurrentIncident, 30000);
  const history = await getHistory();
  displayIncidentHistory(history);
};

const download = (string, filename, type) => {
  const a = document.createElement('a');
  a.href = `data: ${type};charset=utf-8, ${string}`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const savePostmortem = async () => {
  download(encodeURIComponent(document.getElementById('incidentText').value), `${document.getElementById('incidentid').textContent}.html`, 'text/html');
};

const saveIndex = async () => {
  /* create index */
  const index = await getHistory();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const now = new Date();
  const currentMonth = months[now.getMonth()];
  let month = index.find((i) => i.name === currentMonth && i.year === now.getFullYear());
  if (!month) {
    month = {
      name: currentMonth,
      year: now.getFullYear(),
      incidents: [],
    };
    index.unshift(month);
  }
  month.incidents.unshift({
    code: document.getElementById('incidentid').textContent,
    name: document.getElementById('incidentName').value,
    message: document.getElementById('incidentText').value,
    impact: document.getElementById('incidentImpact').value,
    timestamp: new Date().toISOString(),
  });
  const indexJson = JSON.stringify(index, null, 2);
  download(indexJson, 'index.json', 'application/json');
};

const updatePostmortem = async () => {
  const postmortemSelect = document.getElementById('postmortemSelect');
  const resp = await fetch(`/incidents/incident-template-${postmortemSelect.value}.html`);
  const template = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(template, 'text/html');
  const incidentName = document.getElementById('incidentName').value;
  const incidentTextArea = document.getElementById('incidentText');
  const incidentImpact = document.getElementById('incidentImpact').value;
  doc.querySelector('h1').textContent = incidentName;
  doc.querySelector('h1').className = incidentImpact;
  const updates = doc.querySelector('.updates');
  let updatesHTML = '';
  window.currentIncident.forEach((incident) => {
    updatesHTML += `
    <li>
      <h2>${incident.status}</h2>
      <p>${incident.comment}</p>
      <time>${incident.timestamp}</time>
    </li>
`;
  });
  updates.innerHTML = updatesHTML;

  doc.querySelector('article time').textContent = new Date().toISOString();

  incidentTextArea.value = doc.body.innerHTML;
};

const initPostmortem = async () => {
  window.currentIncident = await fetchCurrentIncident();
  document.querySelector('fieldset').disabled = false;
  const randomString = (length) => Math.random().toString(36).substring(2, 2 + length);
  const postmortemSelect = document.getElementById('postmortemSelect');
  postmortemSelect.addEventListener('change', updatePostmortem);
  const incidentId = `AEM-${randomString(8)}`;
  document.getElementById('incidentid').textContent = incidentId;

  const incidentName = document.getElementById('incidentName');
  if (window.currentIncident.length > 0) incidentName.value = window.currentIncident[0].comment;
  incidentName.addEventListener('input', updatePostmortem);

  const incidentImpact = document.getElementById('incidentImpact');
  if (window.currentIncident.length > 0) {
    incidentImpact.value = window.currentIncident[window.currentIncident.length - 1].impact;
  }
  incidentImpact.addEventListener('change', updatePostmortem);
  updatePostmortem();

  const saveButton = document.getElementById('saveButton');
  saveButton.addEventListener('click', savePostmortem);

  const saveIndexButton = document.getElementById('saveIndexButton');
  saveIndexButton.addEventListener('click', saveIndex);
};

if (window.location.pathname === '/postmortem.html') initPostmortem();
if (window.location.pathname === '/' || window.location.pathname === '/index.html') initIncidents();

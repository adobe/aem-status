import { fetchCurrentIncident } from './scripts.js';

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

const updatePostmortem = async () => {
  const postmortemSelect = document.getElementById('postmortemSelect');
  const incidentTextArea = document.getElementById('incidentText');
  if (postmortemSelect.value !== window.postmortemType) {
    window.postmortemType = postmortemSelect.value;
    const resp = await fetch(`/incidents/incident-template-${window.postmortemType}.html`);
    const template = await resp.text();
    incidentTextArea.value = template;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(incidentTextArea.value, 'text/html');
  const incidentName = document.getElementById('incidentName').value;
  const incidentStartTime = document.getElementById('incidentStartTime');
  const incidentEndTime = document.getElementById('incidentEndTime');
  const incidentErrorRate = document.getElementById('incidentErrorRate');
  const incidentImpact = document.getElementById('incidentImpact');
  const incidentImpactedService = document.getElementById('incidentImpactedService');
  const saveButton = document.getElementById('saveButton');

  const updates = doc.querySelector('.updates');
  let updatesHTML = '';
  let firstUpdate;
  let lastUpdate;
  if (window.currentIncident.length > 0) {
    lastUpdate = window.currentIncident[window.currentIncident.length - 1];
    [firstUpdate] = window.currentIncident;
    window.currentIncident.forEach((update) => {
      updatesHTML += `
      <li>
        <h2>${update.status}</h2>
        <p>${update.comment}</p>
        <time>${update.timestamp}</time>
      </li>
      `;
    });
    updates.innerHTML = updatesHTML;
  }

  const startTimestamp = incidentStartTime.value
    || firstUpdate?.timestamp || new Date(new Date().getFullYear()).toISOString();
  const endTimestamp = incidentEndTime.value
    || lastUpdate?.timestamp || new Date(0).toISOString();
  const errorRate = incidentErrorRate.value || '';
  const impactedService = incidentImpactedService.value || '';

  const article = doc.querySelector('article');
  article.setAttribute('data-incident-start-time', startTimestamp);
  article.setAttribute('data-incident-end-time', endTimestamp);
  article.setAttribute('data-incident-error-rate', errorRate);
  article.setAttribute('data-incident-impacted-service', impactedService);

  // if (!incidentStartTime.value) {
  //   incidentStartTime.value = startTimestamp;
  // }
  // if (!incidentEndTime.value) {
  //   incidentEndTime.value = endTimestamp;
  // }
  if (errorRate >= 0.1) {
    incidentImpact.value = 'critical';
  } else if (errorRate >= 0.05) {
    incidentImpact.value = 'major';
  } else if (errorRate >= 0.005) {
    incidentImpact.value = 'minor';
  } else {
    incidentImpact.value = 'none';
  }

  document.querySelectorAll('input, select').forEach((input) => {
    if (!input.value) {
      input.classList.add('field-empty');
    } else {
      input.classList.remove('field-empty');
    }
  });

  saveButton.disabled = document.querySelectorAll('input.field-empty, select.field-empty').length > 0;

  doc.querySelector('h1').textContent = incidentName;
  doc.querySelector('h1').className = incidentImpact.value;
  doc.querySelector('article time').textContent = new Date().toISOString();

  incidentTextArea.value = doc.body.innerHTML;
};

const initPostmortem = async () => {
  document.body.classList.add('ready');
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

  const incidentStartTime = document.getElementById('incidentStartTime');
  incidentStartTime.addEventListener('change', updatePostmortem);

  const incidentEndTime = document.getElementById('incidentEndTime');
  incidentEndTime.addEventListener('change', updatePostmortem);

  const incidentErrorRate = document.getElementById('incidentErrorRate');
  incidentErrorRate.addEventListener('change', updatePostmortem);

  const incidentImpactedService = document.getElementById('incidentImpactedService');
  incidentImpactedService.addEventListener('change', updatePostmortem);

  updatePostmortem();

  const saveButton = document.getElementById('saveButton');
  saveButton.addEventListener('click', savePostmortem);
};

if (window.location.pathname === '/postmortem.html') initPostmortem();

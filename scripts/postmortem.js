import { fetchCurrentIncident } from './scripts.js';
import {
  parseFrontmatter,
  serializeFrontmatter,
  splitPostmortemBody,
  joinPostmortemBody,
  buildUpdatesMarkdown,
  extractPostmortemTitle,
} from './simple-markdown.js';

const download = (string, filename, type) => {
  const a = document.createElement('a');
  a.href = `data:${type};charset=utf-8,${encodeURIComponent(string)}`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const htmlCommentToPlain = (html) => {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.innerText || d.textContent || '';
};

const savePostmortem = async () => {
  download(
    document.getElementById('incidentText').value,
    `${document.getElementById('incidentid').textContent}.md`,
    'text/markdown',
  );
};

const updatePostmortem = async () => {
  const postmortemSelect = document.getElementById('postmortemSelect');
  const incidentTextArea = document.getElementById('incidentText');

  if (postmortemSelect.value !== window.postmortemType) {
    const resp = await fetch(`/incidents/md/incident-template-${postmortemSelect.value}.md`);
    window.postmortemType = postmortemSelect.value;
    incidentTextArea.value = await resp.text();
  }

  let { frontmatter, body } = parseFrontmatter(incidentTextArea.value);
  const { articleMd, updatesMd: templateUpdates } = splitPostmortemBody(body);

  const incidentName = document.getElementById('incidentName').value;
  const incidentStartTime = document.getElementById('incidentStartTime');
  const incidentEndTime = document.getElementById('incidentEndTime');
  const incidentErrorRate = document.getElementById('incidentErrorRate');
  const incidentImpact = document.getElementById('incidentImpact');
  const incidentImpactedService = document.getElementById('incidentImpactedService');
  const saveButton = document.getElementById('saveButton');

  const titleOneLine = incidentName.replace(/\r?\n/g, ' ').replace(/[ \t]+/g, ' ').trim();

  let articlePart = articleMd;
  if (titleOneLine) {
    const currentTitle = extractPostmortemTitle(articlePart);
    if (currentTitle) {
      articlePart = articlePart.replace(/^#\s+[^\n]+/m, `# ${titleOneLine}`);
    } else {
      articlePart = `# ${titleOneLine}\n\n${articlePart}`;
    }
  }

  let firstUpdate;
  let lastUpdate;
  if (window.currentIncident.length > 0) {
    lastUpdate = window.currentIncident[window.currentIncident.length - 1];
    [firstUpdate] = window.currentIncident;
  }

  const startTimestamp = incidentStartTime.value
    || firstUpdate?.timestamp || new Date(0).toISOString();
  const endTimestamp = incidentEndTime.value
    || lastUpdate?.timestamp || new Date(0).toISOString();
  const errorRate = incidentErrorRate.value || '';
  const impactedService = incidentImpactedService.value || '';

  frontmatter.impact = incidentImpact.value;
  frontmatter['start-time'] = startTimestamp;
  frontmatter['end-time'] = endTimestamp;
  frontmatter['error-rate'] = errorRate;
  frontmatter['impacted-service'] = impactedService;
  frontmatter['postmortem-completed'] = new Date().toISOString();

  if (!incidentStartTime.value) {
    incidentStartTime.value = startTimestamp;
  }
  if (!incidentEndTime.value) {
    incidentEndTime.value = endTimestamp;
  }
  if (errorRate >= 0.1) {
    incidentImpact.value = 'critical';
  } else if (errorRate >= 0.05) {
    incidentImpact.value = 'major';
  } else if (errorRate >= 0.005) {
    incidentImpact.value = 'minor';
  } else {
    incidentImpact.value = 'none';
  }
  frontmatter.impact = incidentImpact.value;

  document.querySelectorAll('input, select').forEach((input) => {
    if (!input.value) {
      input.classList.add('field-empty');
    } else {
      input.classList.remove('field-empty');
    }
  });

  saveButton.disabled = document.querySelectorAll('input.field-empty, select.field-empty').length > 0;

  const updatesMarkdown = window.currentIncident.length > 0
    ? buildUpdatesMarkdown(window.currentIncident.map((u) => ({
      status: u.status,
      comment: htmlCommentToPlain(u.comment),
      timestamp: u.timestamp,
    })))
    : templateUpdates;

  const newBody = joinPostmortemBody(articlePart, updatesMarkdown);
  incidentTextArea.value = serializeFrontmatter(frontmatter) + newBody;
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
  if (window.currentIncident.length > 0) {
    incidentName.value = htmlCommentToPlain(window.currentIncident[0].comment);
  }
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

  // Leave window.postmortemType unset until the first fetch in updatePostmortem,
  // so it differs from the select value and the template is loaded.
  updatePostmortem();

  const saveButton = document.getElementById('saveButton');
  saveButton.addEventListener('click', savePostmortem);
};

if (window.location.pathname === '/postmortem.html') initPostmortem();

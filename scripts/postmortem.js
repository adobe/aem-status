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

/** Values from YAML placeholders are not real timestamps. */
function isUsableIso(s) {
  if (s === undefined || s === null || s === '') return false;
  const str = String(s);
  if (str.includes('[') || str.includes('e.g.') || str.includes('ISO 8601')) return false;
  const t = Date.parse(str);
  return !Number.isNaN(t);
}

function isUsableErrorRate(s) {
  if (s === undefined || s === null || s === '') return false;
  const str = String(s);
  if (str.includes('[') || str.includes('e.g.') || str.includes('Error rate')) return false;
  return !Number.isNaN(parseFloat(str));
}

/** Stored decimal (0–1); avoids IEEE-754 noise in YAML (e.g. 0.013000000000000001). */
function normalizeErrorRateDecimal(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return n;
  return parseFloat(n.toFixed(12));
}

/** Percent shown in the input (0–100). */
function normalizeErrorRatePercent(p) {
  if (typeof p !== 'number' || Number.isNaN(p)) return p;
  return parseFloat(p.toFixed(8));
}

/**
 * ISO 8601 UTC instant with whole-second precision only (no fractional seconds).
 * @param {Date|string|number} value
 * @returns {string} Empty string if not a valid instant.
 */
function toIso8601UtcSeconds(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Interpret datetime-local value as UTC wall time → ISO string. */
function datetimeLocalUtcToIso(value) {
  if (!value) return '';
  const v = value.length === 16 ? `${value}:00` : value;
  const d = new Date(`${v}Z`);
  return Number.isNaN(d.getTime()) ? '' : toIso8601UtcSeconds(d);
}

/** ISO string → value for datetime-local (UTC components, no timezone in control). */
function isoToDatetimeLocalValue(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const sec = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}:${sec}`;
}

function refreshUtcHints() {
  const sh = document.getElementById('incidentStartTimeHint');
  const eh = document.getElementById('incidentEndTimeHint');
  const s = document.getElementById('incidentStartTime').value;
  const e = document.getElementById('incidentEndTime').value;
  const isoS = s ? datetimeLocalUtcToIso(s) : '';
  const isoE = e ? datetimeLocalUtcToIso(e) : '';
  sh.textContent = isoS ? `ISO (UTC): ${isoS}` : '';
  eh.textContent = isoE ? `ISO (UTC): ${isoE}` : '';
}

const savePostmortem = async () => {
  download(
    document.getElementById('incidentText').value,
    `${document.getElementById('incidentid').textContent}.markdown`,
    'text/markdown',
  );
};

const updatePostmortem = async () => {
  const postmortemSelect = document.getElementById('postmortemSelect');
  const incidentTextArea = document.getElementById('incidentText');

  if (postmortemSelect.value !== window.postmortemType) {
    const resp = await fetch(`/incidents/md/incident-template-${postmortemSelect.value}.markdown`);
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

  let firstUpdate;
  let lastUpdate;
  if (window.currentIncident.length > 0) {
    lastUpdate = window.currentIncident[window.currentIncident.length - 1];
    [firstUpdate] = window.currentIncident;
  }

  if (incidentErrorRate.value === '' && isUsableErrorRate(frontmatter['error-rate'])) {
    incidentErrorRate.value = String(
      normalizeErrorRatePercent(parseFloat(frontmatter['error-rate']) * 100),
    );
  }

  if (!incidentStartTime.value) {
    if (isUsableIso(frontmatter['start-time'])) {
      incidentStartTime.value = isoToDatetimeLocalValue(frontmatter['start-time']);
    } else if (firstUpdate?.timestamp) {
      incidentStartTime.value = isoToDatetimeLocalValue(firstUpdate.timestamp);
    }
  }
  if (!incidentEndTime.value) {
    if (isUsableIso(frontmatter['end-time'])) {
      incidentEndTime.value = isoToDatetimeLocalValue(frontmatter['end-time']);
    } else if (lastUpdate?.timestamp) {
      incidentEndTime.value = isoToDatetimeLocalValue(lastUpdate.timestamp);
    }
  }

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

  const defaultTimeIso = toIso8601UtcSeconds(new Date());

  let startTimestamp = datetimeLocalUtcToIso(incidentStartTime.value);
  if (!startTimestamp) {
    if (isUsableIso(frontmatter['start-time'])) startTimestamp = toIso8601UtcSeconds(frontmatter['start-time']);
    else if (firstUpdate?.timestamp) startTimestamp = toIso8601UtcSeconds(firstUpdate.timestamp);
    else startTimestamp = defaultTimeIso;
  }
  if (!incidentStartTime.value) {
    incidentStartTime.value = isoToDatetimeLocalValue(startTimestamp);
  }

  let endTimestamp = datetimeLocalUtcToIso(incidentEndTime.value);
  if (!endTimestamp) {
    if (isUsableIso(frontmatter['end-time'])) endTimestamp = toIso8601UtcSeconds(frontmatter['end-time']);
    else if (lastUpdate?.timestamp) endTimestamp = toIso8601UtcSeconds(lastUpdate.timestamp);
    else endTimestamp = defaultTimeIso;
  }
  if (!incidentEndTime.value) {
    incidentEndTime.value = isoToDatetimeLocalValue(endTimestamp);
  }

  let errorRateDecimal = '';
  if (incidentErrorRate.value !== '' && !Number.isNaN(parseFloat(incidentErrorRate.value))) {
    errorRateDecimal = normalizeErrorRateDecimal(parseFloat(incidentErrorRate.value) / 100);
  } else if (isUsableErrorRate(frontmatter['error-rate'])) {
    errorRateDecimal = normalizeErrorRateDecimal(parseFloat(frontmatter['error-rate']));
  }

  const impactedService = incidentImpactedService.value || '';

  frontmatter.impact = incidentImpact.value;
  frontmatter['start-time'] = startTimestamp;
  frontmatter['end-time'] = endTimestamp;
  frontmatter['error-rate'] = errorRateDecimal === '' ? '' : String(errorRateDecimal);
  frontmatter['impacted-service'] = impactedService;
  frontmatter['postmortem-completed'] = toIso8601UtcSeconds(new Date());

  const er = typeof errorRateDecimal === 'number' && !Number.isNaN(errorRateDecimal) ? errorRateDecimal : 0;
  if (er >= 0.1) {
    incidentImpact.value = 'critical';
  } else if (er >= 0.05) {
    incidentImpact.value = 'major';
  } else if (er >= 0.005) {
    incidentImpact.value = 'minor';
  } else {
    incidentImpact.value = 'none';
  }
  frontmatter.impact = incidentImpact.value;

  document.querySelectorAll('input, select').forEach((input) => {
    if (input.disabled) return;
    const empty = input.type === 'number' || input.type === 'datetime-local'
      ? input.value === ''
      : !input.value;
    if (empty) {
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
      timestamp: toIso8601UtcSeconds(u.timestamp) || u.timestamp,
    })))
    : templateUpdates;

  const newBody = joinPostmortemBody(articlePart, updatesMarkdown);
  incidentTextArea.value = serializeFrontmatter(frontmatter) + newBody;

  refreshUtcHints();
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
  incidentStartTime.addEventListener('input', refreshUtcHints);

  const incidentEndTime = document.getElementById('incidentEndTime');
  incidentEndTime.addEventListener('change', updatePostmortem);
  incidentEndTime.addEventListener('input', refreshUtcHints);

  const incidentErrorRate = document.getElementById('incidentErrorRate');
  incidentErrorRate.addEventListener('input', updatePostmortem);

  const incidentImpactedService = document.getElementById('incidentImpactedService');
  incidentImpactedService.addEventListener('change', updatePostmortem);

  updatePostmortem();

  const saveButton = document.getElementById('saveButton');
  saveButton.addEventListener('click', savePostmortem);
};

if (window.location.pathname === '/postmortem.html') initPostmortem();

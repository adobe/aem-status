import {
  parseFrontmatter,
  markdownToHtml,
  parseLegacyIncidentSections,
  splitPostmortemBody,
  parseUpdatesMarkdown,
  extractPostmortemTitle,
  stripLeadingH1,
} from './simple-markdown.js';

const displayLegacyFromMarkdown = (body, incident, heading, sectionHead, frontmatter) => {
  const incidentName = frontmatter.title || `Incident ${incident}`;
  const impact = frontmatter.impact || 'none';
  heading.textContent = incidentName;

  const pill = document.createElement('span');
  pill.className = `pill ${impact}`;
  pill.textContent = impact;
  sectionHead.appendChild(pill);

  const updatesWrap = document.createElement('div');
  updatesWrap.className = 'updates';
  const sections = parseLegacyIncidentSections(body);

  if (!sections.length) {
    const empty = document.createElement('div');
    empty.className = 'u';
    empty.innerHTML = '<p>No updates available for this incident.</p>';
    updatesWrap.appendChild(empty);
  } else {
    sections.forEach((sec) => {
      const u = document.createElement('div');
      u.className = 'u';

      const titleEl = document.createElement('h3');
      titleEl.className = 'legacy-update-title';
      titleEl.textContent = sec.title;
      u.appendChild(titleEl);

      if (sec.posted) {
        const time = document.createElement('time');
        time.textContent = sec.posted;
        u.appendChild(time);
      }

      const div = document.createElement('div');
      div.className = 'legacy-update-body';
      div.innerHTML = markdownToHtml(sec.bodyMd);
      u.appendChild(div);
      updatesWrap.appendChild(u);
    });
  }

  const article = document.createElement('article');
  article.className = `incident ${impact}`;
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `Incident: ${incident}`;
  article.appendChild(meta);
  article.appendChild(updatesWrap);
  return article;
};

const displayPostmortemFromMarkdown = (body, incident, heading, frontmatter) => {
  const { articleMd, updatesMd } = splitPostmortemBody(body);
  const impact = frontmatter.impact || 'none';
  const title = extractPostmortemTitle(articleMd) || `Incident ${incident}`;
  heading.textContent = `Incident ${incident}`;

  const container = document.createElement('div');
  container.className = 'incident-modern';

  const article = document.createElement('article');
  [
    ['start-time', 'data-incident-start-time'],
    ['end-time', 'data-incident-end-time'],
    ['error-rate', 'data-incident-error-rate'],
    ['impacted-service', 'data-incident-impacted-service'],
  ].forEach(([fmKey, attrName]) => {
    const v = frontmatter[fmKey];
    if (v) article.setAttribute(attrName, v);
  });

  const innerMd = stripLeadingH1(articleMd);
  article.innerHTML = markdownToHtml(innerMd);

  const h1 = document.createElement('h1');
  h1.className = impact;
  h1.textContent = title;
  article.insertBefore(h1, article.firstChild);

  container.appendChild(article);

  const ul = document.createElement('ul');
  ul.className = 'updates';
  parseUpdatesMarkdown(updatesMd).forEach((u) => {
    const li = document.createElement('li');
    const h2 = document.createElement('h2');
    h2.textContent = u.status;
    const p = document.createElement('p');
    p.textContent = u.comment;
    const time = document.createElement('time');
    time.textContent = u.timestamp;
    li.appendChild(h2);
    li.appendChild(p);
    li.appendChild(time);
    ul.appendChild(li);
  });
  container.appendChild(ul);

  return container;
};

const init = async () => {
  const params = new URLSearchParams(window.location.search);
  const incident = params.get('incident');
  const heading = document.getElementById('incidentHeading');
  const sectionHead = document.querySelector('.section-head');
  const container = document.getElementById('incident-container');

  if (!incident) {
    heading.textContent = 'Incident not specified';
    container.innerHTML = '<div class="error">Missing incident code. Use the history on the home page to open an incident.</div>';
    return;
  }

  document.title = `Incident ${incident}`;
  heading.textContent = `Incident ${incident}`;

  const url = `/incidents/md/${incident}.md`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Not found');
    const text = await res.text();
    const { frontmatter, body } = parseFrontmatter(text);
    const kind = frontmatter.kind || 'legacy';

    if (kind === 'legacy') {
      container.replaceChildren(displayLegacyFromMarkdown(body, incident, heading, sectionHead, frontmatter));
    } else if (kind === 'postmortem') {
      container.replaceChildren(displayPostmortemFromMarkdown(body, incident, heading, frontmatter));
      document.querySelectorAll('.incident-modern time').forEach((time) => {
        const raw = time.textContent.trim();
        if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
          time.setAttribute('datetime', raw);
          time.textContent = new Date(raw).toLocaleString();
        }
      });
    } else {
      container.innerHTML = '<div class="error">Unknown incident format.</div>';
    }
  } catch {
    container.innerHTML = '<div class="error">Incident not found. It may have been removed or the incident id is incorrect.</div>';
  }

  const copyright = document.getElementById('year');
  copyright.textContent = new Date().getFullYear();
  document.body.classList.add('ready');
};

init();

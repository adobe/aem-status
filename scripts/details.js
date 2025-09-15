const displayLegacyIncident = (html, incident, heading, sectionHead) => {
  const escapeHtml = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Extract incident name and impact
  const nameEl = doc.querySelector('h1');
  const incidentName = (nameEl && nameEl.textContent.trim()) || `Incident ${incident}`;
  let impact = 'none';
  if (nameEl) {
    const impactClass = Array.from(nameEl.classList || []).find((c) => c.startsWith('impact-'));
    if (impactClass) impact = impactClass.replace('impact-', '');
  }

  heading.textContent = incidentName;

  // Add impact pill to section head
  const pill = document.createElement('span');
  pill.className = `pill ${impact}`;
  pill.textContent = impact;
  sectionHead.appendChild(pill);

  // Build updates list
  const updatesWrap = document.createElement('div');
  updatesWrap.className = 'updates';

  const rows = doc.querySelectorAll('.incident-updates-container .row.update-row');
  if (!rows || rows.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'u';
    empty.innerHTML = '<p>No updates available for this incident.</p>';
    updatesWrap.appendChild(empty);
  } else {
    rows.forEach((row) => {
      const title = (row.querySelector('.update-title')?.textContent || '').trim();
      const ts = (row.querySelector('.update-timestamp')?.textContent || '').trim().replace(/^Posted\s*/, '');
      const md = row.querySelector('.update-container .markdown-display');
      const bodyEl = row.querySelector('.update-container .update-body');

      const u = document.createElement('div');
      u.className = 'u';

      if (ts) {
        const time = document.createElement('time');
        time.textContent = ts;
        u.appendChild(time);
      }

      if (md) {
        const div = document.createElement('div');
        div.innerHTML = md.innerHTML.replaceAll('<strong>', '').replaceAll('</strong>', '');
        u.appendChild(div);
      } else if (bodyEl) {
        const text = bodyEl.textContent.trim();
        const p = document.createElement('p');
        p.innerHTML = (title ? `<strong>${escapeHtml(title)}:</strong> ` : '') + escapeHtml(text);
        u.appendChild(p);
      }

      updatesWrap.appendChild(u);
    });
  }

  // Render container content
  const article = document.createElement('article');
  article.className = `incident ${impact}`;
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `Incident: ${incident}`;
  article.appendChild(meta);
  article.appendChild(updatesWrap);

  return article;
};

function displayIncident(html, incident, heading) {
  const container = document.createElement('div');
  container.className = 'incident-modern';
  container.innerHTML = html;

  const h1 = container.querySelector('h1');
  heading.textContent = `Incident: ${h1.textContent.trim()} (${incident})`;

  h1.remove();
  return container;
}

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

  const url = `/incidents/html/${incident}.html`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Not found');
    const html = await res.text();
    if (html.startsWith('<!DOCTYPE')) {
      container.replaceChildren(displayLegacyIncident(html, incident, heading, sectionHead));
    } else {
      container.replaceChildren(displayIncident(html, incident, heading, sectionHead));
      document.querySelectorAll('time').forEach((time) => {
        time.setAttribute('datetime', time.textContent);
        time.textContent = new Date(time.textContent).toLocaleString();
      });
    }
  } catch (e) {
    container.innerHTML = '<div class="error">Incident not found. It may have been removed or the incident id is incorrect.</div>';
  }
};

init();

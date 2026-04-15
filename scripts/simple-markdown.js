/**
 * Minimal markdown subset for incident pages: headings, paragraphs, hard breaks,
 * unordered/ordered lists, **bold**, *italic*, `code`, and [text](url) links.
 */

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeHref(url) {
  const u = String(url).trim();
  if (/^javascript:/i.test(u) || /^data:/i.test(u)) return '#';
  return u;
}

/**
 * Inline: `code`, [text](url), **bold**, *italic* (innermost first: code, then links, bold, italic).
 * @param {string} text
 * @returns {string}
 */
export function parseInlineMarkdown(text) {
  if (!text) return '';
  const s = text;
  const out = [];
  let i = 0;

  while (i < s.length) {
    if (s[i] === '`') {
      const end = s.indexOf('`', i + 1);
      if (end !== -1) {
        out.push(`<code>${escapeHtml(s.slice(i + 1, end))}</code>`);
        i = end + 1;
        continue;
      }
    }

    if (s[i] === '[') {
      const closeLabel = s.indexOf(']', i);
      if (closeLabel !== -1 && s[closeLabel + 1] === '(') {
        const closeParen = s.indexOf(')', closeLabel + 2);
        if (closeParen !== -1) {
          const label = s.slice(i + 1, closeLabel);
          const url = s.slice(closeLabel + 2, closeParen);
          out.push(`<a href="${escapeHtml(safeHref(url))}">${parseInlineMarkdown(label)}</a>`);
          i = closeParen + 1;
          continue;
        }
      }
    }

    if (s[i] === '*' && s[i + 1] === '*') {
      const end = s.indexOf('**', i + 2);
      if (end !== -1) {
        out.push(`<strong>${parseInlineMarkdown(s.slice(i + 2, end))}</strong>`);
        i = end + 2;
        continue;
      }
    }

    if (s[i] === '*' && s[i + 1] !== '*') {
      const end = s.indexOf('*', i + 1);
      if (end !== -1 && s[end + 1] !== '*') {
        out.push(`<em>${parseInlineMarkdown(s.slice(i + 1, end))}</em>`);
        i = end + 1;
        continue;
      }
    }

    let j = i + 1;
    while (j < s.length) {
      const c = s[j];
      if (c === '`' || c === '[' || (c === '*' && (s[j + 1] === '*' || j > i))) break;
      j++;
    }
    out.push(escapeHtml(s.slice(i, j)));
    i = j;
  }

  return out.join('');
}

/**
 * @param {string} md
 * @returns {string} HTML fragment
 */
export function markdownToHtml(md) {
  if (!md) return '';
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const parts = [];
  let i = 0;

  const flushParagraph = (paraLines) => {
    if (!paraLines.length) return;
    const raw = paraLines.join('\n');
    const chunks = raw.split(/  \n/);
    const inner = chunks
      .map((c) => parseInlineMarkdown(c.replace(/\n/g, ' ').trim()))
      .join('<br>\n');
    parts.push(`<p>${inner}</p>`);
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const hm = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (hm) {
      const level = hm[1].length;
      parts.push(`<h${level}>${parseInlineMarkdown(hm[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(`<li>${parseInlineMarkdown(lines[i].replace(/^[-*]\s+/, '').trim())}</li>`);
        i++;
      }
      parts.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(`<li>${parseInlineMarkdown(lines[i].replace(/^\d+\.\s+/, '').trim())}</li>`);
        i++;
      }
      parts.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const paraLines = [];
    while (i < lines.length && lines[i].trim()) {
      const l = lines[i];
      if (/^(#{1,6})\s/.test(l.trim()) || /^[-*]\s+/.test(l.trim()) || /^\d+\.\s+/.test(l.trim())) break;
      paraLines.push(l);
      i++;
    }
    flushParagraph(paraLines);
  }

  return parts.join('\n');
}

/**
 * @param {string} text
 * @returns {{ frontmatter: Record<string, string>, body: string }}
 */
export function parseFrontmatter(text) {
  if (!text || !text.startsWith('---\n')) {
    return { frontmatter: {}, body: text || '' };
  }
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) {
    return { frontmatter: {}, body: text };
  }
  const raw = text.slice(4, end);
  const body = text.slice(end + 5);
  const frontmatter = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    let [, key, val] = m;
    val = val.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }
    frontmatter[key] = val;
  }
  return { frontmatter, body };
}

/**
 * @param {Record<string, string | undefined>} fm
 */
export function serializeFrontmatter(fm) {
  const lines = ['---'];
  Object.entries(fm).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v);
    if (/[\n"]/.test(s) || s === '') {
      lines.push(`${k}: "${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`);
    } else {
      lines.push(`${k}: ${s}`);
    }
  });
  lines.push('---', '');
  return `${lines.join('\n')}\n`;
}

/**
 * Split postmortem body into article markdown and updates markdown (after ## Updates).
 * @param {string} body
 * @returns {{ articleMd: string, updatesMd: string }}
 */
export function splitPostmortemBody(body) {
  const marker = '\n## Updates\n';
  const idx = body.indexOf(marker);
  if (idx === -1) {
    return { articleMd: body.trim(), updatesMd: '' };
  }
  return {
    articleMd: body.slice(0, idx).trimStart().trimEnd(),
    updatesMd: body.slice(idx + marker.length).trim(),
  };
}

/**
 * @param {string} articleMd
 * @param {string} updatesMd
 */
export function joinPostmortemBody(articleMd, updatesMd) {
  const a = articleMd.trimStart().trimEnd();
  const u = updatesMd.trim();
  if (!u) return a;
  return `${a}\n\n## Updates\n\n${u}\n`;
}

/**
 * @param {Array<{ status: string, comment: string, timestamp: string }>} updates
 */
export function buildUpdatesMarkdown(updates) {
  if (!updates || updates.length === 0) return '';
  return updates
    .map((u) => `### ${u.status}\n${u.timestamp}\n\n${u.comment}\n`)
    .join('\n');
}

/**
 * Legacy incident body: sections starting with ## Title, optional *Posted ...*, then content.
 * @param {string} body
 * @returns {Array<{ title: string, posted: string, bodyMd: string }>}
 */
/**
 * @param {string} md
 * @returns {Array<{ status: string, timestamp: string, comment: string }>}
 */
export function parseUpdatesMarkdown(md) {
  if (!md || !md.trim()) return [];
  const chunks = md.split(/\n(?=### )/).filter((p) => p.trim());
  return chunks.map((chunk) => {
    const lines = chunk.trim().split('\n');
    const status = lines[0].replace(/^###\s+/, '').trim();
    const timestamp = (lines[1] || '').trim();
    const comment = lines.slice(3).join('\n').trim();
    return { status, timestamp, comment };
  });
}

/**
 * @param {string} articleMd
 */
export function extractPostmortemTitle(articleMd) {
  const m = articleMd.trimStart().match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

/**
 * Remove the first markdown H1 line (after frontmatter, body often starts with newlines).
 * @param {string} articleMd
 */
export function stripLeadingH1(articleMd) {
  return articleMd.trimStart().replace(/^#\s+[^\n]+\n*/, '');
}

export function parseLegacyIncidentSections(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^## (.+)$/);
    if (!m) {
      i++;
      continue;
    }
    const title = m[1].trim();
    i++;
    while (i < lines.length && !lines[i].trim()) {
      i++;
    }
    let posted = '';
    if (i < lines.length) {
      const rawLine = lines[i].trim();
      const pm = rawLine.match(/^\*Posted\s+(.+)\*\s*$/)
        || rawLine.match(/^Posted\s+(.+)\s*$/);
      if (pm) {
        posted = pm[1].trim().replace(/^(Posted\s*)+/i, '').trim();
        i++;
      }
    }
    const contentLines = [];
    while (i < lines.length && !/^## /.test(lines[i])) {
      contentLines.push(lines[i]);
      i++;
    }
    const bodyMd = contentLines.join('\n').trim();
    sections.push({ title, posted, bodyMd });
  }
  return sections;
}

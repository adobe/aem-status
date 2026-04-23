#!/usr/bin/env node
/**
 * One-time (or repeat) conversion: incidents/html/*.html -> incidents/md/*.markdown
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dirname, '..');
const htmlDir = path.join(root, 'incidents', 'html');
const mdDir = path.join(root, 'incidents', 'md');

function yamlQuote(val) {
  const s = String(val ?? '');
  if (/[\n":#]/.test(s) || s.includes("'")) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  }
  return s;
}

function inlineHtmlToMd(el) {
  if (!el) return '';
  let md = '';
  for (const node of el.childNodes) {
    if (node.nodeType === 3) {
      md += node.textContent;
    } else if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'br') md += '  \n';
      else if (tag === 'strong' || tag === 'b') md += `**${inlineHtmlToMd(node)}**`;
      else if (tag === 'em' || tag === 'i') md += `*${inlineHtmlToMd(node)}*`;
      else if (tag === 'code') md += `\`${node.textContent}\``;
      else if (tag === 'a') {
        const href = node.getAttribute('href') || '';
        md += `[${inlineHtmlToMd(node)}](${href})`;
      } else if (tag === 'p') md += `${inlineHtmlToMd(node)}\n\n`;
      else if (tag === 'span') md += inlineHtmlToMd(node);
      else md += inlineHtmlToMd(node);
    }
  }
  return md.trim();
}

function blockHtmlToMd(el) {
  if (!el) return '';
  let md = '';
  for (const child of el.childNodes) {
    if (child.nodeType === 3) {
      const t = child.textContent.trim();
      if (t) md += `${t}\n\n`;
    } else if (child.nodeType === 1) {
      const tag = child.tagName.toLowerCase();
      if (tag === 'h2') md += `## ${child.textContent.trim()}\n\n`;
      else if (tag === 'h3') md += `### ${child.textContent.trim()}\n\n`;
      else if (tag === 'h4') md += `#### ${child.textContent.trim()}\n\n`;
      else if (tag === 'p') {
        const t = inlineHtmlToMd(child).replace(/\s+/g, ' ').trim();
        md += `${t}\n\n`;
      }
      else if (tag === 'ul') {
        child.querySelectorAll(':scope > li').forEach((li) => {
          md += `- ${inlineHtmlToMd(li).replace(/\n+/g, ' ')}\n`;
        });
        md += '\n';
      } else if (tag === 'ol') {
        let n = 1;
        child.querySelectorAll(':scope > li').forEach((li) => {
          md += `${n}. ${inlineHtmlToMd(li).replace(/\n+/g, ' ')}\n`;
          n += 1;
        });
        md += '\n';
      } else md += blockHtmlToMd(child);
    }
  }
  return md;
}

function extractImpactFromH1(h1) {
  if (!h1) return 'none';
  const cls = h1.className || '';
  const m = cls.match(/\b(minor|major|critical|none|maintenance)\b/);
  if (m) return m[1];
  const im = cls.match(/impact-(\w+)/);
  if (im) return im[1];
  return 'none';
}

function convertLegacy(doc) {
  const h1 = doc.querySelector('h1.incident-name') || doc.querySelector('h1');
  const title = (h1?.textContent || '').trim();
  const impact = extractImpactFromH1(h1);
  let md = '---\n';
  md += `kind: legacy\n`;
  md += `title: ${yamlQuote(title)}\n`;
  md += `impact: ${impact}\n`;
  md += '---\n\n';

  const rows = doc.querySelectorAll('.incident-updates-container .row.update-row');
  rows.forEach((row) => {
    const updateTitle = (row.querySelector('.update-title')?.textContent || '').trim();
    let tsRaw = (row.querySelector('.update-timestamp')?.textContent || '').trim();
    while (/^Posted\s+/i.test(tsRaw)) {
      tsRaw = tsRaw.replace(/^Posted\s+/i, '').trim();
    }
    const mdDisplay = row.querySelector('.markdown-display');
    const bodyEl = row.querySelector('.update-body');
    let bodyText = '';
    if (mdDisplay) {
      bodyText = blockHtmlToMd(mdDisplay).trim();
    } else if (bodyEl) {
      const span = bodyEl.querySelector('.whitespace-pre-wrap');
      bodyText = (span || bodyEl).textContent.trim();
    }
    md += `## ${updateTitle}\n\n`;
    if (tsRaw) md += `*Posted ${tsRaw}*\n\n`;
    md += `${bodyText}\n\n`;
  });

  return md;
}

function convertPostmortem(doc) {
  const h1 = doc.querySelector('h1');
  const title = (h1?.textContent || '').trim();
  const impact = extractImpactFromH1(h1);
  const article = doc.querySelector('article');
  if (!article) {
    throw new Error('No article element');
  }

  const attrs = [
    ['start-time', 'data-incident-start-time'],
    ['end-time', 'data-incident-end-time'],
    ['error-rate', 'data-incident-error-rate'],
    ['impacted-service', 'data-incident-impacted-service'],
  ];
  let fm = '---\n';
  fm += 'kind: postmortem\n';
  fm += `impact: ${impact}\n`;
  attrs.forEach(([mdKey, htmlAttr]) => {
    const v = article.getAttribute(htmlAttr);
    if (v) fm += `${mdKey}: ${yamlQuote(v)}\n`;
  });
  const timeEl = article.querySelector(':scope > time');
  if (timeEl) {
    fm += `postmortem-completed: ${yamlQuote(timeEl.textContent.trim())}\n`;
  }
  fm += '---\n\n';

  const artClone = article.cloneNode(true);
  const t = artClone.querySelector(':scope > time');
  if (t) t.remove();

  const articleMd = blockHtmlToMd(artClone).trim();
  let md = fm;
  md += `# ${title}\n\n`;
  md += `${articleMd}\n`;

  const ul = doc.querySelector('ul.updates');
  if (ul) {
    md += '\n## Updates\n\n';
    ul.querySelectorAll(':scope > li').forEach((li) => {
      const h2 = li.querySelector('h2');
      const p = li.querySelector('p');
      const time = li.querySelector('time');
      const status = (h2?.textContent || '').trim();
      const ts = (time?.textContent || '').trim();
      const comment = (p?.textContent || '').trim();
      md += `### ${status}\n${ts}\n\n${comment}\n\n`;
    });
  }

  return md;
}

function convertFile(htmlPath, name) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const dom = new JSDOM(html);
  const { document } = dom.window;

  let md;
  if (html.trimStart().startsWith('<!DOCTYPE')) {
    md = convertLegacy(document);
  } else {
    md = convertPostmortem(document);
  }

  const outPath = path.join(mdDir, `${name}.markdown`);
  fs.writeFileSync(outPath, md, 'utf-8');
}

function main() {
  if (!fs.existsSync(mdDir)) {
    fs.mkdirSync(mdDir, { recursive: true });
  }
  const files = fs.readdirSync(htmlDir).filter((f) => f.endsWith('.html'));
  files.forEach((f) => {
    const base = f.replace(/\.html$/, '');
    convertFile(path.join(htmlDir, f), base);
    process.stdout.write(`converted ${f} -> md/${base}.markdown\n`);
  });

  const incidentsRoot = path.join(root, 'incidents');
  for (const name of ['incident-template-short', 'incident-template-long']) {
    const p = path.join(incidentsRoot, `${name}.html`);
    if (fs.existsSync(p)) {
      convertFile(p, name);
      process.stdout.write(`converted ${name}.html -> md/${name}.markdown\n`);
    }
  }
}

main();

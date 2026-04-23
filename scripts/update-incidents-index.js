#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseFrontmatter,
  splitPostmortemBody,
  parseLegacyIncidentSections,
  stripLeadingH1,
} from './simple-markdown.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Helper function to parse date from ISO 8601 timestamp string
function parseTimestamp(timestampStr) {
  const date = new Date(timestampStr);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    month: date.getUTCMonth(),
    year: date.getUTCFullYear(),
    date: date.getUTCDate(),
  };
}

function humanPostedToIso(posted) {
  if (!posted) return null;
  const timestampText = posted.replace(/^(Posted\s*)+/i, '').trim();
  const dateMatch = timestampText.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+-\s+\d{2}:\d{2}\s+UTC/,
  );
  if (dateMatch) {
    const parts = dateMatch[0].match(/(\w+)\s+(\d{1,2}),\s+(\d{4})\s+-\s+(\d{2}):(\d{2})\s+UTC/);
    if (parts) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames.indexOf(parts[1]);
      const day = parseInt(parts[2], 10);
      const year = parseInt(parts[3], 10);
      const hour = parseInt(parts[4], 10);
      const minute = parseInt(parts[5], 10);

      const date = new Date(year, month, day, hour, minute);
      return date.toISOString();
    }
  }
  return null;
}

function firstMessageFromPostmortem(articleMd) {
  const stripped = stripLeadingH1(articleMd);
  let exec = stripped.match(/### Executive Summary\s*\n+([\s\S]*?)(?=\n### |\n## |\n# |$)/);
  if (exec) {
    return exec[1].replace(/\s+/g, ' ').trim().substring(0, 500);
  }
  exec = stripped.match(/## Postmortem\s*\n+([\s\S]*?)(?=\n### |\n## |\n# |$)/);
  if (exec) {
    return exec[1].replace(/\s+/g, ' ').trim().substring(0, 500);
  }
  const firstPara = stripped.split(/\n\n/).find((b) => b.trim() && !b.trim().startsWith('#'));
  if (firstPara) {
    return firstPara.replace(/\s+/g, ' ').trim().substring(0, 500);
  }
  return 'This incident has been resolved.';
}

function parseIncidentMarkdown(filePath, incidentCode) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(text);
  const kind = frontmatter.kind || 'legacy';

  if (kind === 'legacy') {
    const name = frontmatter.title;
    if (!name) return null;
    const impact = frontmatter.impact || 'none';
    const sections = parseLegacyIncidentSections(body);
    let message = 'This incident has been resolved.';
    if (sections.length > 0) {
      message = sections[0].bodyMd.replace(/\s+/g, ' ').trim().substring(0, 500);
    }
    let incidentUpdated = null;
    if (sections[0]?.posted) {
      incidentUpdated = humanPostedToIso(sections[0].posted);
    }

    const result = {
      code: incidentCode,
      name,
      message: message || 'This incident has been resolved.',
      impact,
      incidentUpdated: incidentUpdated || 'NEEDS_MANUAL_UPDATE',
    };
    return result;
  }

  if (kind === 'postmortem') {
    const { articleMd } = splitPostmortemBody(body);
    const titleMatch = articleMd.match(/^#\s+(.+)$/m);
    const name = titleMatch ? titleMatch[1].trim() : null;
    if (!name) return null;
    const impact = frontmatter.impact || 'none';

    let incidentUpdated = 'NEEDS_MANUAL_UPDATE';
    const pc = frontmatter['postmortem-completed'];
    if (pc) {
      const d = new Date(pc);
      if (!Number.isNaN(d.getTime())) {
        incidentUpdated = d.toISOString();
      }
    }

    const message = firstMessageFromPostmortem(articleMd);

    const result = {
      code: incidentCode,
      name,
      message,
      impact,
      incidentUpdated,
    };

    if (incidentCode.startsWith('AEM-')) {
      const dataKeys = ['start-time', 'end-time', 'error-rate', 'impacted-service'];

      dataKeys.forEach((key) => {
        const value = frontmatter[key];
        if (value) {
          const camelCaseName = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
          result[camelCaseName] = value;
        }
      });
    }

    return result;
  }

  return null;
}

// Main function
function updateIncidentsIndex() {
  const incidentsDir = path.join(dirname, '..', 'incidents');
  const mdDir = path.join(incidentsDir, 'md');
  const indexPath = path.join(incidentsDir, 'index.json');

  // Read existing index to preserve timestamps and classifications
  const existingIncidentsMap = new Map();
  try {
    const existingIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    existingIndex.forEach((incident) => {
      existingIncidentsMap.set(incident.code, incident);
    });
  } catch {
    // No existing index.json found or could not parse, creating new one
  }

  const mdFiles = fs.readdirSync(mdDir)
    .filter((f) => f.endsWith('.markdown') && !f.startsWith('incident-template-'))
    .map((f) => ({
      filename: f,
      code: f.replace('.markdown', ''),
      path: path.join(mdDir, f),
    }));

  const incidents = [];
  mdFiles.forEach((file) => {
    const incident = parseIncidentMarkdown(file.path, file.code);
    if (incident) {
      if (incident.incidentUpdated === 'NEEDS_MANUAL_UPDATE' && existingIncidentsMap.has(incident.code)) {
        const existing = existingIncidentsMap.get(incident.code);
        incident.incidentUpdated = existing.incidentUpdated;
      }

      if (existingIncidentsMap.has(incident.code)) {
        const existingIncident = existingIncidentsMap.get(incident.code);
        if (existingIncident.affectedComponents !== undefined) {
          incident.affectedComponents = existingIncident.affectedComponents;
        }
        if (existingIncident.internalServices !== undefined) {
          incident.internalServices = existingIncident.internalServices;
        }
        if (existingIncident.externalVendors !== undefined) {
          incident.externalVendors = existingIncident.externalVendors;
        }
        if (existingIncident.rootCause !== undefined) {
          incident.rootCause = existingIncident.rootCause;
        }
      }

      if (incident.incidentUpdated && incident.incidentUpdated !== 'NEEDS_MANUAL_UPDATE') {
        incidents.push(incident);
      }
    }
  });

  incidents.forEach((incident) => {
    if (incident.affectedComponents) {
      const validComponents = ['delivery', 'publishing'];
      const invalidComponents = incident.affectedComponents.filter(
        (comp) => !validComponents.includes(comp),
      );
      if (invalidComponents.length > 0) {
        console.warn(
          `Warning: Incident ${incident.code} has invalid affectedComponents: ${invalidComponents.join(', ')}`,
        );
        console.warn('  Valid values are: delivery, publishing');
        console.warn('  Other services should be in internalServices field');
      }
    }
  });

  const validIncidents = incidents
    .filter((incident) => {
      const sortTimestamp = incident.startTime || incident.incidentUpdated;
      const dateInfo = parseTimestamp(sortTimestamp);
      return dateInfo !== null;
    })
    .sort((a, b) => {
      const aTime = a.startTime || a.incidentUpdated;
      const bTime = b.startTime || b.incidentUpdated;
      return new Date(bTime) - new Date(aTime);
    });

  fs.writeFileSync(indexPath, `${JSON.stringify(validIncidents, null, 2)}\n`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    updateIncidentsIndex();
  } catch {
    process.exit(1);
  }
}

export default updateIncidentsIndex;

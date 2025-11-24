#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Helper function to parse date from ISO 8601 timestamp string
function parseTimestamp(timestampStr) {
  // Handle ISO 8601 format: "2024-12-10T02:26:00.000Z"
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

// Parse incident HTML file
function parseIncidentHTML(filePath, incidentCode) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  let name = null;
  let impact = 'none';
  let incidentUpdated = null;
  let message = null;

  // Check if it's a legacy format (has DOCTYPE)
  const isLegacy = html.startsWith('<!DOCTYPE');

  if (isLegacy) {
    // Legacy format with full HTML structure
    const h1 = doc.querySelector('h1.incident-name, h1');
    if (h1) {
      name = h1.textContent.trim();
      // Extract impact from class
      const classes = h1.className.split(' ');
      const impactClass = classes.find((c) => c.startsWith('impact-'));
      if (impactClass) {
        impact = impactClass.replace('impact-', '');
      }
    }

    // Try to get incidentUpdated from update sections
    const timestampEl = doc.querySelector('.update-timestamp');
    if (timestampEl) {
      const timestampText = timestampEl.textContent.replace(/^Posted\s*/, '').trim();
      // Remove the "ago" part and extract the date
      // Format is like: "Feb 07, 2025 - 15:10 UTC"
      const dateMatch = timestampText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+-\s+\d{2}:\d{2}\s+UTC/);
      if (dateMatch) {
        // Convert to ISO 8601 format
        const parts = dateMatch[0].match(/(\w+)\s+(\d{1,2}),\s+(\d{4})\s+-\s+(\d{2}):(\d{2})\s+UTC/);
        if (parts) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = monthNames.indexOf(parts[1]);
          const day = parseInt(parts[2], 10);
          const year = parseInt(parts[3], 10);
          const hour = parseInt(parts[4], 10);
          const minute = parseInt(parts[5], 10);

          const date = new Date(year, month, day, hour, minute);
          incidentUpdated = date.toISOString();
        }
      }
    }

    // Try to get message
    const updateBody = doc.querySelector('.update-body');
    if (updateBody) {
      message = updateBody.textContent.trim().substring(0, 500);
    } else {
      const markdownDisplay = doc.querySelector('.markdown-display p');
      if (markdownDisplay) {
        message = markdownDisplay.textContent.trim().substring(0, 500);
      }
    }
  } else {
    // Modern simple format
    const h1 = doc.querySelector('h1');
    if (h1) {
      name = h1.textContent.trim();
      // Check for impact class directly on h1
      if (h1.className) {
        const classMatch = h1.className.match(/(minor|major|critical|maintenance|none)/);
        if (classMatch) [, impact] = classMatch;
      }
    }

    // For simple format, check for <time> element with ISO timestamp
    const timeEl = doc.querySelector('time');
    if (timeEl && timeEl.textContent) {
      const isoTimestamp = timeEl.textContent.trim();
      // Parse ISO timestamp and use it directly
      const date = new Date(isoTimestamp);
      if (!Number.isNaN(date.getTime())) {
        incidentUpdated = date.toISOString();
      } else {
        incidentUpdated = 'NEEDS_MANUAL_UPDATE';
      }
    } else {
      incidentUpdated = 'NEEDS_MANUAL_UPDATE';
    }

    // Try to get message from article
    const article = doc.querySelector('article');
    if (article) {
      const firstP = article.querySelector('p');
      if (firstP) {
        message = firstP.textContent.trim().substring(0, 500);
      }
    }
  }

  if (!name) {
    // Could not parse incident name
    return null;
  }

  const result = {
    code: incidentCode,
    name,
    message: message || 'This incident has been resolved.',
    impact,
    incidentUpdated: incidentUpdated || 'NEEDS_MANUAL_UPDATE',
  };

  // Extract data attributes for AEM-prefixed incidents
  if (incidentCode.startsWith('AEM-')) {
    const article = doc.querySelector('article');
    if (article) {
      // List of data attributes to extract
      const dataAttrNames = [
        'data-incident-start-time',
        'data-incident-end-time',
        'data-incident-error-rate',
        'data-incident-impacted-service',
      ];

      dataAttrNames.forEach((attrName) => {
        const value = article.getAttribute(attrName);
        if (value) {
          // Convert attribute name to camelCase for JSON and add to result
          const camelCaseName = attrName.replace(/^data-incident-/, '').replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
          result[camelCaseName] = value;
        }
      });
    }
  }

  return result;
}

// Main function
function updateIncidentsIndex() {
  const incidentsDir = path.join(dirname, '..', 'incidents');
  const htmlDir = path.join(incidentsDir, 'html');
  const indexPath = path.join(incidentsDir, 'index.json');

  // Read existing index to preserve timestamps and classifications
  let existingIndex = [];
  const existingIncidentsMap = new Map();
  try {
    existingIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    // Build map of existing incidents for lookup
    existingIndex.forEach((incident) => {
      existingIncidentsMap.set(incident.code, incident);
    });
  } catch (e) {
    // No existing index.json found or could not parse, creating new one
  }

  // Read all HTML files
  const htmlFiles = fs.readdirSync(htmlDir)
    .filter((f) => f.endsWith('.html'))
    .map((f) => ({
      filename: f,
      code: f.replace('.html', ''),
      path: path.join(htmlDir, f),
    }));

  // Parse all incidents
  const incidents = [];
  htmlFiles.forEach((file) => {
    const incident = parseIncidentHTML(file.path, file.code);
    if (incident) {
      // If incidentUpdated needs update and we have existing data, use it
      if (incident.incidentUpdated === 'NEEDS_MANUAL_UPDATE' && existingIncidentsMap.has(incident.code)) {
        const existing = existingIncidentsMap.get(incident.code);
        incident.incidentUpdated = existing.incidentUpdated;
      }

      // Preserve classification fields from existing incident if they exist
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
        if (existingIncident.startTime !== undefined) {
          incident.startTime = existingIncident.startTime;
        }
        if (existingIncident.endTime !== undefined) {
          incident.endTime = existingIncident.endTime;
        }
      }

      // Skip incidents without valid incidentUpdated
      if (incident.incidentUpdated && incident.incidentUpdated !== 'NEEDS_MANUAL_UPDATE') {
        incidents.push(incident);
      } else {
        // Skipping incident - no valid incidentUpdated
      }
    }
  });

  // Validate classification fields
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

  // Filter out incidents without valid timestamps and sort by startTime
  // (or incidentUpdated as fallback)
  const validIncidents = incidents
    .filter((incident) => {
      // Use startTime if available, otherwise incidentUpdated
      const sortTimestamp = incident.startTime || incident.incidentUpdated;
      const dateInfo = parseTimestamp(sortTimestamp);
      return dateInfo !== null;
    })
    .sort((a, b) => {
      // Use startTime for sorting when available, otherwise fall back to incidentUpdated
      const aTime = a.startTime || a.incidentUpdated;
      const bTime = b.startTime || b.incidentUpdated;
      return new Date(bTime) - new Date(aTime); // Sort newest first
    });

  // Write to index.json
  fs.writeFileSync(indexPath, `${JSON.stringify(validIncidents, null, 2)}\n`);
  // Updated index with incidents
}

// Run if called directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    updateIncidentsIndex();
  } catch (error) {
    // Error updating incidents index
    process.exit(1);
  }
}

export default updateIncidentsIndex;

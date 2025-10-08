#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Check if an incident is missing classification fields
 */
function needsClassification(incident) {
  return !incident.affectedComponents ||
         incident.externalVendors === undefined ||
         !incident.rootCause;
}

/**
 * Find all incidents that need classification
 */
function findUnclassifiedIncidents() {
  const indexPath = path.join(dirname, '..', 'incidents', 'index.json');

  try {
    const incidents = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const unclassified = incidents.filter(needsClassification);

    return {
      total: incidents.length,
      unclassified: unclassified.length,
      incidents: unclassified
    };
  } catch (error) {
    console.error('Error reading incidents index:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
function main() {
  const result = findUnclassifiedIncidents();

  console.log(`Total incidents: ${result.total}`);
  console.log(`Unclassified incidents: ${result.unclassified}`);

  if (result.unclassified > 0) {
    console.log('\nUnclassified incidents:');
    result.incidents.forEach(incident => {
      console.log(`  - ${incident.code}: ${incident.name}`);
    });

    // Exit with status 1 to indicate classification is needed
    process.exit(1);
  } else {
    console.log('\nAll incidents are classified! ✓');
    process.exit(0);
  }
}

// Run if called directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

export { findUnclassifiedIncidents, needsClassification };

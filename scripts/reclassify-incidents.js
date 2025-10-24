#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Define which components are business-level vs internal services
const BUSINESS_COMPONENTS = ['delivery', 'publishing'];
const INTERNAL_SERVICES = ['admin-api', 'sidekick', 'code-sync', 'forms', 'rum', 'media', 'indexing', 'logging'];

function reclassifyIncidents() {
  const indexPath = path.join(dirname, '..', 'incidents', 'index.json');

  // Read the incidents
  const incidents = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  // Reclassify each incident
  const reclassified = incidents.map(incident => {
    if (!incident.affectedComponents || incident.affectedComponents.length === 0) {
      // If there are no affectedComponents, keep as is
      return incident;
    }

    const businessComponents = [];
    const internalServices = [];

    // Split the components
    incident.affectedComponents.forEach(component => {
      if (BUSINESS_COMPONENTS.includes(component)) {
        businessComponents.push(component);
      } else if (INTERNAL_SERVICES.includes(component)) {
        internalServices.push(component);
      } else {
        // Unknown component - log warning and keep in business components for safety
        console.warn(`Unknown component "${component}" in incident ${incident.code}`);
        businessComponents.push(component);
      }
    });

    // Create the new structure
    return {
      ...incident,
      affectedComponents: businessComponents.length > 0 ? businessComponents : null,
      internalServices: internalServices.length > 0 ? internalServices : null,
      // Keep externalVendors as is
    };
  });

  // Write back the reclassified incidents
  fs.writeFileSync(indexPath, JSON.stringify(reclassified, null, 2) + '\n');
  console.log(`Successfully reclassified ${incidents.length} incidents`);
}

// Run if called directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    reclassifyIncidents();
  } catch (error) {
    console.error('Error reclassifying incidents:', error);
    process.exit(1);
  }
}

export default reclassifyIncidents;

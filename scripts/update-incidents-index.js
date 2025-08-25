#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Helper function to parse date from timestamp string
function parseTimestamp(timestampStr) {
  // Example: "Feb <var data-var='date'>6</var>, <var data-var='time'>08:36</var> - <var data-var='time'>09:48</var> UTC"
  // or "Feb <var data-var='date'>6</var>, <var data-var='time'>08:36</var> UTC"
  // or "Feb 07, 2025 - 15:10 UTC" (from HTML)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Extract month
  const monthMatch = timestampStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
  if (!monthMatch) return null;
  
  const month = monthNames.indexOf(monthMatch[1]);
  
  // Extract date - try both formats
  let date = null;
  let year = null;
  
  // Try format with var tags
  const dateVarMatch = timestampStr.match(/data-var='date'>(\d+)</);
  if (dateVarMatch) {
    date = parseInt(dateVarMatch[1]);
    const yearVarMatch = timestampStr.match(/data-var='year'>(\d{4})</);
    year = yearVarMatch ? parseInt(yearVarMatch[1]) : null;
  } else {
    // Try plain format "Feb 07, 2025"
    const plainMatch = timestampStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})/);
    if (plainMatch) {
      date = parseInt(plainMatch[2]);
      year = parseInt(plainMatch[3]);
    }
  }
  
  if (!date) return null;
  
  // If no year found, try to infer from context or use current year
  if (!year) {
    // Look for year in format "Jul 30, 2024" or similar
    const yearMatch = timestampStr.match(/, (\d{4})/);
    if (yearMatch) {
      year = parseInt(yearMatch[1]);
    } else {
      // Default to current year
      year = new Date().getFullYear();
    }
  }
  
  return { month, year, date };
}

// Helper function to get month info
function getMonthInfo(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startsOn = firstDay.getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  return {
    name: monthNames[month],
    year: year,
    starts_on: startsOn,
    days: daysInMonth,
    incidents: []
  };
}

// Parse incident HTML file
function parseIncidentHTML(filePath, incidentCode) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  let name = null;
  let impact = 'none';
  let timestamp = null;
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
      const impactClass = classes.find(c => c.startsWith('impact-'));
      if (impactClass) {
        impact = impactClass.replace('impact-', '');
      }
    }
    
    // Try to get timestamp from update sections
    const timestampEl = doc.querySelector('.update-timestamp');
    if (timestampEl) {
      let timestampText = timestampEl.textContent.replace(/^Posted\s*/, '').trim();
      // Remove the "ago" part and extract the date
      // Format is like: "Feb 07, 2025 - 15:10 UTC"
      const dateMatch = timestampText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+-\s+\d{2}:\d{2}\s+UTC/);
      if (dateMatch) {
        // Convert to index.json format: "Feb <var data-var='date'>7</var>, <var data-var='time'>15:10</var> UTC"
        const parts = dateMatch[0].match(/(\w+)\s+(\d{1,2}),\s+(\d{4})\s+-\s+(\d{2}:\d{2})\s+UTC/);
        if (parts) {
          timestamp = `${parts[1]} <var data-var='date'>${parts[2]}</var>, <var data-var='time'>${parts[4]}</var> UTC`;
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
        if (classMatch) impact = classMatch[1];
      }
    }
    
    // For simple format, we need to manually construct timestamp
    // This will be filled in by the existing index data
    // For now, just mark it as needing manual review
    timestamp = 'NEEDS_MANUAL_UPDATE';
    
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
    console.warn(`Could not parse incident name for ${incidentCode}`);
    return null;
  }
  
  return {
    code: incidentCode,
    name: name,
    message: message || 'This incident has been resolved.',
    impact: impact,
    timestamp: timestamp || 'NEEDS_MANUAL_UPDATE'
  };
}

// Main function
function updateIncidentsIndex() {
  const incidentsDir = path.join(__dirname, '..', 'incidents');
  const htmlDir = path.join(incidentsDir, 'html');
  const indexPath = path.join(incidentsDir, 'index.json');
  
  // Read existing index to preserve timestamps for simple format files
  let existingIndex = [];
  let existingIncidentsMap = new Map();
  try {
    existingIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    // Build map of existing incidents for lookup
    for (const month of existingIndex) {
      for (const incident of month.incidents) {
        existingIncidentsMap.set(incident.code, incident);
      }
    }
  } catch (e) {
    console.log('No existing index.json found or could not parse, creating new one');
  }
  
  // Read all HTML files
  const htmlFiles = fs.readdirSync(htmlDir)
    .filter(f => f.endsWith('.html'))
    .map(f => ({
      filename: f,
      code: f.replace('.html', ''),
      path: path.join(htmlDir, f)
    }));
  
  // Parse all incidents
  const incidents = [];
  for (const file of htmlFiles) {
    const incident = parseIncidentHTML(file.path, file.code);
    if (incident) {
      // If timestamp needs update and we have existing data, use it
      if (incident.timestamp === 'NEEDS_MANUAL_UPDATE' && existingIncidentsMap.has(incident.code)) {
        incident.timestamp = existingIncidentsMap.get(incident.code).timestamp;
      }
      
      // Skip incidents without valid timestamps
      if (incident.timestamp && incident.timestamp !== 'NEEDS_MANUAL_UPDATE') {
        incidents.push(incident);
      } else {
        console.warn(`Skipping incident ${incident.code} - no valid timestamp`);
      }
    }
  }
  
  // Group incidents by month/year
  const monthsMap = new Map();
  
  for (const incident of incidents) {
    const dateInfo = parseTimestamp(incident.timestamp);
    if (!dateInfo) {
      console.warn(`Could not parse timestamp for ${incident.code}: ${incident.timestamp}`);
      continue;
    }
    
    const key = `${dateInfo.year}-${dateInfo.month}`;
    if (!monthsMap.has(key)) {
      monthsMap.set(key, getMonthInfo(dateInfo.year, dateInfo.month));
    }
    
    monthsMap.get(key).incidents.push(incident);
  }
  
  // Convert to sorted array (newest months first)
  let months = Array.from(monthsMap.values());
  
  // Add empty months to fill gaps if needed
  if (months.length > 0) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Find oldest and newest years
    let oldestYear = currentYear;
    let newestYear = 2022; // Start from 2022 as minimum
    
    for (const month of months) {
      if (month.year < oldestYear) oldestYear = month.year;
      if (month.year > newestYear) newestYear = month.year;
    }
    
    // Ensure we go to current month
    newestYear = Math.max(newestYear, currentYear);
    
    // Fill all months from oldest to newest
    for (let year = newestYear; year >= oldestYear; year--) {
      const startMonth = (year === currentYear) ? currentMonth : 11;
      const endMonth = 0;
      
      for (let month = startMonth; month >= endMonth; month--) {
        const key = `${year}-${month}`;
        if (!monthsMap.has(key)) {
          const monthInfo = getMonthInfo(year, month);
          months.push(monthInfo);
        }
      }
    }
  }
  
  // Sort months (newest first)
  months.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return monthOrder.indexOf(b.name) - monthOrder.indexOf(a.name);
  });
  
  // Write to index.json
  fs.writeFileSync(indexPath, JSON.stringify(months, null, 2) + '\n');
  console.log(`Updated ${indexPath} with ${incidents.length} incidents across ${months.length} months`);
}

// Run if called directly
if (require.main === module) {
  try {
    updateIncidentsIndex();
  } catch (error) {
    console.error('Error updating incidents index:', error);
    process.exit(1);
  }
}

module.exports = { updateIncidentsIndex };
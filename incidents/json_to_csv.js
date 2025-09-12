/* eslint-disable */

// #!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const JSON_DIR = 'json';
const OUTPUT_CSV = 'incidents.csv';

// CSV header
const CSV_HEADER = 'code,name,message,impact,timestamp,month,year,filename\n';

// Month name to number mapping
const MONTH_TO_NUM = {
    'January': '01', 'Jan': '01',
    'February': '02', 'Feb': '02',
    'March': '03', 'Mar': '03',
    'April': '04', 'Apr': '04',
    'May': '05',
    'June': '06', 'Jun': '06',
    'July': '07', 'Jul': '07',
    'August': '08', 'Aug': '08',
    'September': '09', 'Sep': '09',
    'October': '10', 'Oct': '10',
    'November': '11', 'Nov': '11',
    'December': '12', 'Dec': '12'
};

// Function to parse timestamp and convert to standard format
function parseTimestamp(timestamp, year) {
    if (!timestamp || timestamp === 'no timestamp') {
        return 'no timestamp';
    }

    // Remove HTML entities and clean up
    let cleanTimestamp = timestamp
        .replace(/\\u003cvar data-var='date'\\u003e/g, '')
        .replace(/\\u003c\/var\\u003e/g, '')
        .replace(/\\u003cvar data-var='time'\\u003e/g, '')
        .replace(/\\n/g, ' ');

    // Extract month, day, and time
    const monthMatch = cleanTimestamp.match(/^([A-Za-z]+)/);
    const dayMatch = cleanTimestamp.match(/(\d+)/);
    const timeMatch = cleanTimestamp.match(/(\d+:\d+)/);

    if (monthMatch && dayMatch && timeMatch && year) {
        const monthName = monthMatch[1];
        const day = dayMatch[1].padStart(2, '0');
        const time = timeMatch[1];
        const monthNum = MONTH_TO_NUM[monthName];

        if (monthNum) {
            return `${year}-${monthNum}-${day} ${time}:00`;
        }
    }

    return cleanTimestamp;
}

// Function to escape CSV values
function escapeCsvValue(value) {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
}

// Function to process a single JSON file
function processJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        const filename = path.basename(filePath);
        const incidents = [];

        // Check if the file has months structure
        if (data.months && Array.isArray(data.months)) {
            data.months.forEach(month => {
                const monthName = month.name;
                const year = month.year;

                if (month.incidents && Array.isArray(month.incidents)) {
                    month.incidents.forEach(incident => {
                        const timestamp = parseTimestamp(incident.timestamp, year);
                        
                        incidents.push({
                            code: incident.code || 'unknown',
                            name: incident.name || 'unknown',
                            message: incident.message || 'no message',
                            impact: incident.impact || 'unknown',
                            timestamp: timestamp,
                            month: monthName || 'unknown',
                            year: year || 'unknown',
                            filename: filename
                        });
                    });
                }
            });
        }

        return incidents;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return [];
    }
}

// Main function
function main() {
    console.log('Converting JSON files to CSV using Node.js...');
    console.log('==========================================');

    // Check if json directory exists
    if (!fs.existsSync(JSON_DIR)) {
        console.error(`Error: Directory '${JSON_DIR}' not found`);
        process.exit(1);
    }

    // Find all history-N.json files
    const files = fs.readdirSync(JSON_DIR)
        .filter(file => file.match(/^history-\d+\.json$/))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });

    if (files.length === 0) {
        console.error(`No history-N.json files found in '${JSON_DIR}' directory`);
        process.exit(1);
    }

    console.log(`Found ${files.length} history files:`);
    files.forEach(file => console.log(`  ${file}`));
    console.log('');

    // Initialize CSV file
    fs.writeFileSync(OUTPUT_CSV, CSV_HEADER);

    let totalIncidents = 0;
    let totalFiles = 0;

    // Process each file
    files.forEach(file => {
        const filePath = path.join(JSON_DIR, file);
        console.log(`Processing: ${file}`);

        const incidents = processJsonFile(filePath);
        
        if (incidents.length > 0) {
            console.log(`  Found ${incidents.length} incidents`);
            
            // Write incidents to CSV
            incidents.forEach(incident => {
                const csvLine = [
                    escapeCsvValue(incident.code),
                    escapeCsvValue(incident.name),
                    escapeCsvValue(incident.message),
                    escapeCsvValue(incident.impact),
                    escapeCsvValue(incident.timestamp),
                    escapeCsvValue(incident.month),
                    escapeCsvValue(incident.year),
                    escapeCsvValue(incident.filename)
                ].join(',') + '\n';

                fs.appendFileSync(OUTPUT_CSV, csvLine);
            });

            totalIncidents += incidents.length;
            totalFiles++;
        } else {
            console.log('  No incidents found in this file');
        }
    });

    console.log('');
    console.log('==========================================');
    console.log('CSV conversion completed!');
    console.log(`Output file: ${OUTPUT_CSV}`);
    console.log(`Total files processed: ${totalFiles}`);
    console.log(`Total incidents processed: ${totalIncidents}`);

    // Show file size
    try {
        const stats = fs.statSync(OUTPUT_CSV);
        console.log(`CSV file size: ${(stats.size / 1024).toFixed(2)} KB`);
    } catch (error) {
        console.log('Could not determine file size');
    }

    // Show first few lines as preview
    try {
        const content = fs.readFileSync(OUTPUT_CSV, 'utf8');
        const lines = content.split('\n').slice(0, 11); // Header + 10 data rows
        console.log('\nFirst few lines of the CSV:');
        lines.forEach(line => {
            if (line.trim()) {
                console.log(line);
            }
        });
    } catch (error) {
        console.log('Could not preview CSV content');
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
import { app } from '@azure/functions';

// In-memory cache shared across function invocations
// This persists as long as the Function instance is warm
let cachedData = null;
let lastFetchTime = null;

// Google Apps Script URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxoBSj7v-y5WyoeSn1T0KcFsoQXEYQiiK_nmOPf-pKAJqf7w46ubpt0XmwFM7qdbzgCzw/exec';

/**
 * Timer trigger function that runs every minute to fetch incident data
 * from Google Apps Script and cache it in memory
 */
app.timer('fetchIncidents', {
  // Run every minute: "0 */1 * * * *"
  // Format: {second} {minute} {hour} {day} {month} {day-of-week}
  schedule: '0 */1 * * * *',
  handler: async (myTimer, context) => {
    context.log('Timer trigger function started at:', new Date().toISOString());

    try {
      // Fetch data from Google Apps Script
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update cache
      cachedData = data;
      lastFetchTime = new Date().toISOString();

      context.log(`Successfully fetched and cached data. Rows: ${data.rows?.length || 0}`);
      context.log(`Cache updated at: ${lastFetchTime}`);
    } catch (error) {
      context.error('Error fetching data from Google Apps Script:', error);
      // Don't clear cache on error - serve stale data rather than failing
    }
  },
});

// Export cache accessor for HTTP trigger
export function getCachedData() {
  return {
    data: cachedData,
    lastFetchTime,
  };
}

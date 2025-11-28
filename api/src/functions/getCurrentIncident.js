import { app } from '@azure/functions';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxoBSj7v-y5WyoeSn1T0KcFsoQXEYQiiK_nmOPf-pKAJqf7w46ubpt0XmwFM7qdbzgCzw/exec';
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

let cache = {
  data: null,
  timestamp: 0
};

app.http('getCurrentIncident', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const now = Date.now();
    const cacheAge = now - cache.timestamp;

    // Return cached data if valid
    if (cache.data && cacheAge < CACHE_TTL_MS) {
      context.log(`Serving cached data (age: ${Math.round(cacheAge / 1000)}s)`);
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Cache-Age': String(Math.round(cacheAge / 1000))
        },
        body: JSON.stringify(cache.data)
      };
    }

    // Fetch fresh data from Google
    context.log('Cache miss, fetching from Google Apps Script');
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      if (!response.ok) {
        throw new Error(`Google API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update cache
      cache = {
        data,
        timestamp: now
      };

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS'
        },
        body: JSON.stringify(data)
      };
    } catch (error) {
      context.error('Failed to fetch from Google:', error.message);
      
      // Return stale cache if available
      if (cache.data) {
        context.log('Returning stale cache due to error');
        return {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'STALE',
            'X-Cache-Age': String(Math.round(cacheAge / 1000))
          },
          body: JSON.stringify(cache.data)
        };
      }

      return {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to fetch incident data' })
      };
    }
  }
});

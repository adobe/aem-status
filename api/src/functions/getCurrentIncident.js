import { app } from '@azure/functions';

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
if (!GOOGLE_SCRIPT_URL) {
  throw new Error('GOOGLE_SCRIPT_URL environment variable is not set');
}
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const FETCH_TIMEOUT_MS = 30000; // 30 seconds

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

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Return cached data if valid
    if (cache.data && cacheAge < CACHE_TTL_MS) {
      context.log(`Serving cached data (age: ${Math.round(cacheAge / 1000)}s)`);
      return {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Age': String(Math.round(cacheAge / 1000))
        },
        body: JSON.stringify(cache.data)
      };
    }

    // Fetch fresh data from Google
    context.log('Cache miss, fetching from Google Apps Script');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      
      let response;
      try {
        response = await fetch(GOOGLE_SCRIPT_URL, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      
      if (!response.ok) {
        throw new Error(`Upstream API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate response structure
      if (typeof data !== 'object' || !('rows' in data)) {
        throw new Error('Invalid response structure from upstream');
      }
      
      // Update cache
      cache = {
        data,
        timestamp: now
      };

      return {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          'Age': '0'
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
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Cache': 'STALE',
            'Age': String(Math.round(cacheAge / 1000))
          },
          body: JSON.stringify(cache.data)
        };
      }

      const isTimeout = error.name === 'AbortError';
      return {
        status: 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Error': isTimeout ? 'timeout' : 'upstream_error'
        },
        body: JSON.stringify({ error: 'Failed to fetch incident data' })
      };
    }
  }
});

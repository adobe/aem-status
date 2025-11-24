import { app } from '@azure/functions';
import { getCachedData } from './fetchIncidents.js';

/**
 * HTTP trigger function that serves cached incident data
 * This endpoint is called by the Azure Static Web App frontend
 */
app.http('getCurrentIncident', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'getCurrentIncident',
  handler: async (request, context) => {
    context.log('HTTP trigger getCurrentIncident invoked');

    try {
      const { data, lastFetchTime } = getCachedData();

      // Check if cache has been populated
      if (!data) {
        context.warn('No cached data available yet');
        return {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            error: 'Data not available yet. Please try again in a moment.',
            message: 'Cache is being initialized',
          }),
        };
      }

      // Return cached data with metadata
      const response = {
        ...data,
        _metadata: {
          cachedAt: lastFetchTime,
          cacheAge: lastFetchTime
            ? Math.floor((Date.now() - new Date(lastFetchTime).getTime()) / 1000)
            : null,
          source: 'azure-functions-cache',
        },
      };

      context.log(`Serving cached data from: ${lastFetchTime}`);

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Cache in browser for 30 seconds to reduce load
          'Cache-Control': 'public, max-age=30',
          // CORS headers - will be added by Azure Static Web Apps integration
          // but including for standalone function app deployment
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
        body: JSON.stringify(response),
      };
    } catch (error) {
      context.error('Error serving cached data:', error);

      return {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message,
        }),
      };
    }
  },
});

# AEM Status API - Azure Functions

This directory contains Azure Functions that cache incident data from Google Apps Script for faster delivery to the status page.

## Architecture

- **fetchIncidents** (Timer Trigger): Runs every minute to fetch data from Google Apps Script and cache it in memory
- **getCurrentIncident** (HTTP Trigger): Serves the cached data to the frontend via HTTP GET

## Local Development

### Prerequisites

- Node.js 20.x or later
- Azure Functions Core Tools v4

### Install Dependencies

```bash
cd api
npm install
```

### Run Locally

```bash
npm start
```

The functions will be available at:
- `http://localhost:7071/api/getCurrentIncident` (HTTP trigger)
- Timer trigger will run automatically every minute

## Deployment

Deployment is automated via GitHub Actions when changes are pushed to the `api/` directory.

### Manual Deployment

```bash
cd api
func azure functionapp publish YOUR_FUNCTION_APP_NAME
```

## Configuration

The timer trigger is configured to run every minute using the cron expression: `0 */1 * * * *`

To change the frequency, edit the `schedule` parameter in `fetchIncidents.js`.

## Caching Strategy

- Data is cached in a module-level variable that persists across function invocations
- The timer trigger keeps the function instance warm, preventing cold starts
- On error, stale data is served rather than failing completely
- Cache age is included in the HTTP response metadata

## Environment Variables

None required. The Google Apps Script URL is hardcoded in `fetchIncidents.js`.

If you need to make it configurable, add to `local.settings.json` (local) or Application Settings (Azure):

```json
{
  "Values": {
    "GOOGLE_SCRIPT_URL": "https://script.google.com/macros/s/..."
  }
}
```

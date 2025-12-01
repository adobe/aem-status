import { describe, it } from 'node:test';
import assert from 'node:assert';

const API_URL = process.env.API_URL || 'https://aem-status-api-staging.azurewebsites.net/api/getCurrentIncident';

describe('API Post-Deploy Tests', () => {
  it('should return 200 OK', async () => {
    const response = await fetch(API_URL);
    assert.strictEqual(response.status, 200);
  });

  it('should return JSON content-type', async () => {
    const response = await fetch(API_URL);
    const contentType = response.headers.get('content-type');
    assert.ok(contentType.includes('application/json'));
  });

  it('should return CORS headers', async () => {
    const response = await fetch(API_URL);
    assert.strictEqual(response.headers.get('access-control-allow-origin'), '*');
  });

  it('should return X-Cache header', async () => {
    const response = await fetch(API_URL);
    const xCache = response.headers.get('x-cache');
    assert.ok(['HIT', 'MISS', 'STALE'].includes(xCache), `Expected X-Cache to be HIT, MISS, or STALE, got: ${xCache}`);
  });

  it('should return Age header', async () => {
    const response = await fetch(API_URL);
    const age = response.headers.get('age');
    assert.ok(age !== null, 'Expected Age header to be present');
    assert.ok(!isNaN(parseInt(age)), 'Expected Age to be a number');
  });

  it('should return valid JSON body', async () => {
    const response = await fetch(API_URL);
    const data = await response.json();
    assert.ok(typeof data === 'object', 'Expected response body to be an object');
  });

  it('should have expected response structure', async () => {
    const response = await fetch(API_URL);
    const data = await response.json();
    assert.ok('rows' in data, 'Expected response to have "rows" property');
  });
});

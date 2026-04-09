import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeMonthlyUptime } from '../scripts/historical-uptime.js';

describe('computeMonthlyUptime', () => {
  it('should return 100% uptime for both services when no incidents', () => {
    const results = computeMonthlyUptime([]);
    assert.ok(results.length > 0, 'Should have monthly entries');
    results.forEach((entry) => {
      assert.equal(entry.delivery, 1, `delivery uptime for ${entry.key} should be 1`);
      assert.equal(entry.publishing, 1, `publishing uptime for ${entry.key} should be 1`);
      assert.deepEqual(entry.incidents, []);
    });
  });

  it('should calculate correct downtime for a single delivery incident', () => {
    const incidents = [{
      code: 'AEM-001',
      name: 'Delivery Issues',
      impact: 'major',
      startTime: '2024-03-10T10:00:00.000Z',
      endTime: '2024-03-10T11:00:00.000Z',
      errorRate: '0.1',
      impactedService: 'delivery',
    }];

    const results = computeMonthlyUptime(incidents);
    const march2024 = results.find((e) => e.key === '2024-03');
    assert.ok(march2024, 'Should have March 2024 entry');

    // 60 min incident * 0.1 errorRate = 6 min downtime
    // March has 44640 minutes (31 days)
    const expectedUptime = (44640 - 6) / 44640;
    assert.ok(Math.abs(march2024.delivery - expectedUptime) < 0.0001,
      `delivery uptime should be ~${expectedUptime}, got ${march2024.delivery}`);
    assert.equal(march2024.publishing, 1, 'publishing should be unaffected');
  });

  it('should split incident spanning two months correctly', () => {
    // Incident spans from March 31 22:00 UTC to April 1 02:00 UTC (4 hours total)
    const incidents = [{
      code: 'AEM-002',
      name: 'Delivery Issues',
      impact: 'major',
      startTime: '2024-03-31T22:00:00.000Z',
      endTime: '2024-04-01T02:00:00.000Z',
      errorRate: '0.5',
      impactedService: 'delivery',
    }];

    const results = computeMonthlyUptime(incidents);
    const march2024 = results.find((e) => e.key === '2024-03');
    const april2024 = results.find((e) => e.key === '2024-04');

    assert.ok(march2024, 'Should have March 2024 entry');
    assert.ok(april2024, 'Should have April 2024 entry');

    // March overlap: 22:00 to 00:00 = 120 min, downtime = 120 * 0.5 = 60 min
    assert.ok(march2024.delivery < 1, 'March delivery should have downtime');
    // April overlap: 00:00 to 02:00 = 120 min, downtime = 120 * 0.5 = 60 min
    assert.ok(april2024.delivery < 1, 'April delivery should have downtime');

    // Verify the split is correct
    const marchIncidents = march2024.incidents.filter((i) => i.impactedService === 'delivery');
    const aprilIncidents = april2024.incidents.filter((i) => i.impactedService === 'delivery');
    assert.equal(marchIncidents.length, 1, 'March should have 1 delivery incident');
    assert.equal(aprilIncidents.length, 1, 'April should have 1 delivery incident');
    assert.ok(Math.abs(marchIncidents[0].durationMins - 120) < 0.01, 'March overlap should be 120 min');
    assert.ok(Math.abs(aprilIncidents[0].durationMins - 120) < 0.01, 'April overlap should be 120 min');
  });

  it('should infer publishing service from incident name', () => {
    const incidents = [{
      code: 'AEM-003',
      name: 'Publishing Issues affecting authors',
      impact: 'minor',
      startTime: '2024-06-15T10:00:00.000Z',
      endTime: '2024-06-15T11:00:00.000Z',
      errorRate: '0.05',
    }];

    const results = computeMonthlyUptime(incidents);
    const june2024 = results.find((e) => e.key === '2024-06');
    assert.ok(june2024, 'Should have June 2024');
    assert.ok(june2024.publishing < 1, 'publishing should have downtime');
    assert.equal(june2024.delivery, 1, 'delivery should be unaffected');
  });

  it('should infer delivery service from incident name', () => {
    const incidents = [{
      code: 'AEM-004',
      name: 'Delivery performance degradation',
      impact: 'minor',
      startTime: '2024-06-15T10:00:00.000Z',
      endTime: '2024-06-15T11:00:00.000Z',
      errorRate: '0.05',
    }];

    const results = computeMonthlyUptime(incidents);
    const june2024 = results.find((e) => e.key === '2024-06');
    assert.ok(june2024.delivery < 1, 'delivery should have downtime');
    assert.equal(june2024.publishing, 1, 'publishing should be unaffected');
  });

  it('should expand "both" service for ambiguous incident names', () => {
    const incidents = [{
      code: 'AEM-005',
      name: 'General platform issues',
      impact: 'minor',
      startTime: '2024-06-15T10:00:00.000Z',
      endTime: '2024-06-15T11:00:00.000Z',
      errorRate: '0.05',
    }];

    const results = computeMonthlyUptime(incidents);
    const june2024 = results.find((e) => e.key === '2024-06');
    assert.ok(june2024.delivery < 1, 'delivery should have downtime for ambiguous incident');
    assert.ok(june2024.publishing < 1, 'publishing should have downtime for ambiguous incident');
  });

  it('should infer errorRate from impact when missing', () => {
    const incidents = [{
      code: 'AEM-006',
      name: 'Delivery Issues',
      impact: 'major',
      startTime: '2024-06-15T10:00:00.000Z',
      endTime: '2024-06-15T11:00:00.000Z',
      impactedService: 'delivery',
      // no errorRate — should be inferred from impact
    }];

    const results = computeMonthlyUptime(incidents);
    const june2024 = results.find((e) => e.key === '2024-06');
    assert.ok(june2024.delivery < 1, 'delivery should have downtime with inferred errorRate');
  });

  it('should cap uptime at 100% (not exceed 1.0)', () => {
    const results = computeMonthlyUptime([]);
    results.forEach((entry) => {
      assert.ok(entry.delivery <= 1, `delivery uptime should not exceed 1, got ${entry.delivery}`);
      assert.ok(entry.publishing <= 1, `publishing uptime should not exceed 1, got ${entry.publishing}`);
    });
  });

  it('should skip maintenance incidents', () => {
    const incidents = [{
      code: 'AEM-007',
      name: 'Scheduled Maintenance',
      impact: 'maintenance',
      startTime: '2024-06-15T10:00:00.000Z',
      endTime: '2024-06-15T14:00:00.000Z',
      errorRate: '1.0',
      impactedService: 'delivery',
    }];

    const results = computeMonthlyUptime(incidents);
    const june2024 = results.find((e) => e.key === '2024-06');
    assert.equal(june2024.delivery, 1, 'maintenance should not affect uptime');
  });
});


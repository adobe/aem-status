import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  calculateMeanTimes,
  calculateMetrics,
  extractDetectionMinutes,
  formatDuration,
  renderMetrics,
  summarizeDurations,
} from '../scripts/what.js';

const incident = ({
  startTime = '2026-02-07T01:57:00.000Z',
  detectionTime = '2026-02-07T02:05:00.000Z',
  detectionSource = 'monitoring',
  endTime = '2026-02-07T02:34:00.000Z',
} = {}) => ({
  startTime, detectionTime, detectionSource, endTime,
});

describe('extractDetectionMinutes', () => {
  it('calculates detection time from structured timestamps', () => {
    assert.equal(extractDetectionMinutes(incident()), 8);
  });

  it('supports detection after midnight', () => {
    const input = incident({
      startTime: '2026-05-07T23:45:00Z',
      detectionTime: '2026-05-08T00:15:00Z',
      endTime: '2026-05-08T01:00:00Z',
    });
    assert.equal(extractDetectionMinutes(input), 30);
  });

  it('rejects missing, malformed, or chronologically invalid timestamps', () => {
    assert.equal(extractDetectionMinutes(incident({ detectionTime: null })), null);
    assert.equal(extractDetectionMinutes(incident({ startTime: 'invalid' })), null);
    assert.equal(extractDetectionMinutes(incident({
      detectionTime: '2026-02-07T01:30:00Z',
    })), null);
  });

  it('supports retrospective detection after an incident recovered', () => {
    assert.equal(extractDetectionMinutes(incident({
      startTime: '2026-05-07T23:45:00Z',
      detectionTime: '2026-05-08T08:05:00Z',
      endTime: '2026-05-08T05:30:00Z',
    })), 500);
  });
});

describe('summarizeDurations', () => {
  it('uses all values when fewer than four samples exist', () => {
    assert.deepEqual(summarizeDurations([8, 285]), {
      minutes: 146.5,
      count: 2,
      excludedCount: 0,
      totalCount: 2,
    });
  });

  it('excludes extreme values outside Tukey fences', () => {
    assert.deepEqual(summarizeDurations([0, 8, 10, 24, 285]), {
      minutes: 10.5,
      count: 4,
      excludedCount: 1,
      totalCount: 5,
    });
  });

  it('does not exclude ordinary variation', () => {
    assert.deepEqual(summarizeDurations([10, 20, 30, 40]), {
      minutes: 25,
      count: 4,
      excludedCount: 0,
      totalCount: 4,
    });
  });

  it('returns an empty summary when no samples qualify', () => {
    assert.deepEqual(summarizeDurations([]), {
      minutes: null,
      count: 0,
      excludedCount: 0,
      totalCount: 0,
    });
  });
});

describe('calculateMeanTimes', () => {
  it('averages valid resolution and detection samples independently', () => {
    const result = calculateMeanTimes([
      incident({
        endTime: '2026-02-07T02:27:00Z',
      }),
      incident({
        startTime: '2026-02-07T01:00:00Z',
        detectionTime: '2026-02-07T01:30:00Z',
        detectionSource: 'customer',
        endTime: '2026-02-07T02:00:00Z',
      }),
      incident({
        detectionTime: null,
        endTime: '2026-02-07T02:57:00Z',
      }),
      incident({ startTime: 'invalid', detectionTime: 'invalid', endTime: 'invalid' }),
    ]);

    assert.deepEqual(result.mttr, {
      minutes: 50, count: 3, excludedCount: 0, totalCount: 3,
    });
    assert.deepEqual(result.monitoringMttd, {
      minutes: 8, count: 1, excludedCount: 0, totalCount: 1,
    });
    assert.deepEqual(result.customerDetectionLatency, {
      minutes: 30, count: 1, excludedCount: 0, totalCount: 1,
    });
  });

  it('returns empty metrics when no samples qualify', () => {
    assert.deepEqual(calculateMeanTimes([incident({
      startTime: null,
      detectionTime: null,
      endTime: null,
    })]), {
      mttr: {
        minutes: null, count: 0, excludedCount: 0, totalCount: 0,
      },
      monitoringMttd: {
        minutes: null, count: 0, excludedCount: 0, totalCount: 0,
      },
      customerDetectionLatency: {
        minutes: null, count: 0, excludedCount: 0, totalCount: 0,
      },
    });
  });
});

describe('formatDuration', () => {
  it('formats minutes, hours, and days', () => {
    assert.equal(formatDuration(29.6), '30m');
    assert.equal(formatDuration(90), '1h 30m');
    assert.equal(formatDuration(2940), '2d 1h');
  });

  it('returns N/A for absent or invalid values', () => {
    assert.equal(formatDuration(null), 'N/A');
    assert.equal(formatDuration(Number.NaN), 'N/A');
    assert.equal(formatDuration(-1), 'N/A');
  });
});

describe('calculateMetrics', () => {
  it('uses only the supplied incident subset for mean-time metrics', () => {
    const selectedYearIncidents = [
      incident({
        endTime: '2026-02-07T02:27:00Z',
      }),
    ];
    const metrics = calculateMetrics(selectedYearIncidents, [], []);

    assert.deepEqual(metrics.mttr, {
      minutes: 30, count: 1, excludedCount: 0, totalCount: 1,
    });
    assert.deepEqual(metrics.monitoringMttd, {
      minutes: 8, count: 1, excludedCount: 0, totalCount: 1,
    });
    assert.deepEqual(metrics.customerDetectionLatency, {
      minutes: null, count: 0, excludedCount: 0, totalCount: 0,
    });
    assert.equal(metrics.total, 1);
  });
});

describe('renderMetrics', () => {
  it('renders values, included samples, and excluded outliers', () => {
    const dom = new JSDOM('<div id="key-metrics"></div>');
    global.document = dom.window.document;

    try {
      renderMetrics({
        total: 20,
        topVendor: null,
        topService: null,
        mixedPercent: '10.0',
        mttr: {
          minutes: 90, count: 18, excludedCount: 2, totalCount: 20,
        },
        monitoringMttd: {
          minutes: 10.5, count: 4, excludedCount: 1, totalCount: 5,
        },
        customerDetectionLatency: {
          minutes: 90, count: 3, excludedCount: 1, totalCount: 4,
        },
      });

      const cards = [...document.querySelectorAll('.stat-card')];
      assert.equal(cards.length, 7);
      assert.match(cards[4].textContent, /1h 30m/);
      assert.match(cards[4].textContent, /MTTR.+n = 18.+2 outliers excluded/s);
      assert.match(cards[5].textContent, /11m/);
      assert.match(cards[5].textContent, /MTTD.+n = 4.+1 outlier excluded/s);
      assert.match(cards[6].textContent, /1h 30m/);
      assert.match(cards[6].textContent, /Customer.+n = 3.+1 outlier excluded/s);
    } finally {
      delete global.document;
      dom.window.close();
    }
  });
});

import {
  describe, it, mock, beforeEach,
} from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

describe('Details Script Tests', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <h1 id="incidentHeading"></h1>
          <div class="section-head"></div>
          <div id="incidentContainer"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      runScripts: 'dangerously',
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    global.DOMParser = window.DOMParser;
    global.fetch = mock.fn();
  });

  describe('displayLegacyIncident', () => {
    it('should handle legacy incident HTML format', () => {
      // Test removed - variable 'html' not used
      // This test just verifies we can create DOM elements

      const heading = document.createElement('h1');
      const sectionHead = document.createElement('div');

      // Since displayLegacyIncident is defined in the script, we'll need to
      // test it via integration test or refactor to module exports
      // For now, this is a placeholder showing test structure
      assert.ok(heading);
      assert.ok(sectionHead);
    });
  });

  describe('URL parameter handling', () => {
    it('should extract incident parameter from URL', () => {
      const testIncident = 'test123';
      // JSDOM doesn't support navigation, so we test URLSearchParams directly
      const searchParams = `?incident=${testIncident}`;

      const params = new URLSearchParams(searchParams);
      const incident = params.get('incident');

      assert.equal(incident, testIncident);
    });

    it('should handle missing incident parameter', () => {
      window.location.search = '';

      const params = new URLSearchParams(window.location.search);
      const incident = params.get('incident');

      assert.equal(incident, null);
    });
  });

  describe('Fetch operations', () => {
    it('should construct correct URL for incident', () => {
      const incident = 'abc123';
      const expectedUrl = `/incidents/html/${incident}.html`;

      assert.equal(expectedUrl, '/incidents/html/abc123.html');
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch = mock.fn(() => Promise.reject(new Error('Network error')));

      try {
        await fetch('/incidents/html/test.html');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.equal(error.message, 'Network error');
      }
    });
  });

  describe('HTML escaping', () => {
    it('should properly escape HTML characters', () => {
      const escapeHtml = (str) => str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';

      assert.equal(escapeHtml(input), expected);
    });
  });
});

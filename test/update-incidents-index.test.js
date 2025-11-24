import {
  describe, it, beforeEach, afterEach,
} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe('update-incidents-index', () => {
  describe('parseIncidentFile', () => {
    it('should parse modern incident HTML format', () => {
      const modernHTML = `
        <article class="incident minor">
          <div class="meta">
            <h1>Test Incident 1</h1>
            <p>This is a test incident with minor impact.</p>
          </div>
          <div class="updates">
            <div class="u">
              <time>Feb 07, 2025 - 15:10 UTC</time>
              <p>Initial update for test incident</p>
            </div>
          </div>
        </article>
      `;

      const dom = new JSDOM(modernHTML);
      const doc = dom.window.document;

      const h1 = doc.querySelector('h1');
      const article = doc.querySelector('article');
      const time = doc.querySelector('time');
      const impact = article?.className.match(/incident\s+(\w+)/)?.[1] || 'none';

      assert.equal(h1?.textContent, 'Test Incident 1');
      assert.equal(impact, 'minor');
      assert.ok(time?.textContent.includes('Feb 07, 2025'));
    });

    it('should parse legacy incident HTML format', () => {
      const legacyHTML = `
        <!DOCTYPE html>
        <html>
          <body>
            <h1 class="impact-major">Legacy Test Incident</h1>
            <div class="incident-updates-container">
              <div class="row update-row">
                <div class="update-timestamp">Posted Jan 15, 2025 - 10:30 UTC</div>
                <div class="update-container">
                  <div class="update-body">Legacy incident update</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      const dom = new JSDOM(legacyHTML);
      const doc = dom.window.document;

      const h1 = doc.querySelector('h1');
      const impactClass = h1?.className.match(/impact-(\w+)/)?.[1];
      const timestamp = doc.querySelector('.update-timestamp');

      assert.equal(h1?.textContent, 'Legacy Test Incident');
      assert.equal(impactClass, 'major');
      assert.ok(timestamp?.textContent.includes('Jan 15, 2025'));
    });
  });

  describe('timestamp parsing', () => {
    it('should parse timestamps correctly', () => {
      // Test various timestamp formats
      const timestamps = [
        'Feb 07, 2025 - 15:10 UTC',
        'Jan 15, 2025 - 10:30 UTC',
        'Mar 01, 2025 - 00:00 UTC',
      ];

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      timestamps.forEach((ts) => {
        const monthMatch = ts.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
        const dateMatch = ts.match(/(\d{1,2}),/);
        const yearMatch = ts.match(/(\d{4})/);

        assert.ok(monthMatch, `Should find month in "${ts}"`);
        assert.ok(dateMatch, `Should find date in "${ts}"`);
        assert.ok(yearMatch, `Should find year in "${ts}"`);

        const monthIndex = monthNames.indexOf(monthMatch[1]);
        assert.ok(monthIndex >= 0, `Should have valid month index for "${monthMatch[1]}"`);
      });
    });
  });

  describe('impact level detection', () => {
    it('should detect impact levels from HTML classes', () => {
      const testCases = [
        { html: '<article class="incident minor">', expected: 'minor' },
        { html: '<article class="incident major">', expected: 'major' },
        { html: '<article class="incident critical">', expected: 'critical' },
        { html: '<h1 class="impact-major">Title</h1>', expected: 'major' },
        { html: '<h1 class="impact-minor">Title</h1>', expected: 'minor' },
        { html: '<article class="incident">No impact</article>', expected: 'none' },
      ];

      testCases.forEach((testCase) => {
        const dom = new JSDOM(testCase.html);
        const doc = dom.window.document;

        let impact = 'none';

        // Check article class
        const article = doc.querySelector('article');
        if (article) {
          const match = article.className.match(/incident\s+(\w+)/);
          if (match) {
            const impactValue = match[1];
            impact = impactValue;
          }
        }

        // Check h1 class for legacy format
        if (impact === 'none') {
          const h1 = doc.querySelector('h1');
          if (h1) {
            const match = h1.className.match(/impact-(\w+)/);
            if (match) {
              const impactValue = match[1];
              impact = impactValue;
            }
          }
        }

        assert.equal(
          impact,
          testCase.expected,
          `Impact for "${testCase.html}" should be "${testCase.expected}"`,
        );
      });
    });
  });

  describe('file operations', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(testDir, 'test-'));
    });

    afterEach(() => {
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should read and write JSON files correctly', () => {
      const testData = [
        {
          name: 'February',
          year: 2025,
          incidents: [
            {
              code: 'test1',
              name: 'Test Incident 1',
              impact: 'minor',
              timestamp: 'Feb 07, 2025',
              message: 'Test message',
            },
          ],
        },
      ];

      const jsonPath = path.join(tempDir, 'test.json');
      fs.writeFileSync(jsonPath, `${JSON.stringify(testData, null, 2)}\n`);

      assert.ok(fs.existsSync(jsonPath), 'JSON file should exist');

      const content = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(content);

      assert.deepEqual(parsed, testData, 'Parsed JSON should match original data');
    });

    it('should handle file listing and filtering', () => {
      // Create test HTML files
      fs.writeFileSync(path.join(tempDir, 'test1.html'), '<h1>Test 1</h1>');
      fs.writeFileSync(path.join(tempDir, 'test2.html'), '<h1>Test 2</h1>');
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'Not HTML');
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Readme');

      const files = fs.readdirSync(tempDir);
      const htmlFiles = files.filter((f) => f.endsWith('.html'));

      assert.equal(htmlFiles.length, 2, 'Should find 2 HTML files');
      assert.ok(htmlFiles.includes('test1.html'), 'Should include test1.html');
      assert.ok(htmlFiles.includes('test2.html'), 'Should include test2.html');
    });
  });

  describe('startTime and endTime updates', () => {
    let tempDir;
    let incidentsDir;
    let htmlDir;
    let indexPath;

    // Helper function to create and run the update script
    async function createAndRunScript(scriptName = 'update-script.js') {
      const scriptDir = path.join(path.dirname(testDir), 'scripts');
      const scriptContent = fs.readFileSync(path.join(scriptDir, 'update-incidents-index.js'), 'utf-8');
      const modifiedScript = scriptContent
        .replace("path.join(dirname, '..', 'incidents')", `'${incidentsDir}'`);

      const tempScriptPath = path.join(tempDir, scriptName);
      fs.writeFileSync(tempScriptPath, modifiedScript);

      // eslint-disable-next-line import/no-dynamic-require
      const { default: updateFunc } = await import(`file://${tempScriptPath}?t=${Date.now()}`);
      updateFunc();
    }

    // Helper function to read the incidents index
    function readIndex() {
      return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    }

    beforeEach(() => {
      // Create temporary directory structure
      tempDir = fs.mkdtempSync(path.join(testDir, 'test-incidents-'));
      incidentsDir = path.join(tempDir, 'incidents');
      htmlDir = path.join(incidentsDir, 'html');
      indexPath = path.join(incidentsDir, 'index.json');

      fs.mkdirSync(incidentsDir, { recursive: true });
      fs.mkdirSync(htmlDir, { recursive: true });
    });

    afterEach(() => {
      if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should update startTime and endTime when changed in article metadata', async () => {
      // Create an incident HTML file with initial startTime and endTime
      const initialHTML = `<h1 class="minor">Test Incident</h1>
<article data-incident-start-time="2025-01-01T10:00:00.000Z" data-incident-end-time="2025-01-01T11:00:00.000Z">
    <h2>Postmortem</h2>
    <p>Initial postmortem content.</p>
    <time>2025-01-01T12:00:00.000Z</time>
</article>`;

      fs.writeFileSync(path.join(htmlDir, 'AEM-test123.html'), initialHTML);

      // Run the script for the first time
      await createAndRunScript('update-script-1.js');

      // Read the generated index
      const index1 = readIndex();

      assert.equal(index1.length, 1, 'Should have one incident');
      assert.equal(index1[0].code, 'AEM-test123');
      assert.equal(index1[0].startTime, '2025-01-01T10:00:00.000Z', 'Should have correct initial startTime');
      assert.equal(index1[0].endTime, '2025-01-01T11:00:00.000Z', 'Should have correct initial endTime');

      // Now update the HTML file with new startTime and endTime
      const updatedHTML = `<h1 class="minor">Test Incident</h1>
<article data-incident-start-time="2025-01-01T09:30:00.000Z" data-incident-end-time="2025-01-01T11:30:00.000Z">
    <h2>Postmortem</h2>
    <p>Updated postmortem content with corrected times.</p>
    <time>2025-01-01T12:00:00.000Z</time>
</article>`;

      fs.writeFileSync(path.join(htmlDir, 'AEM-test123.html'), updatedHTML);

      // Re-run the script
      await createAndRunScript('update-script-2.js');

      // Read the updated index
      const index2 = readIndex();

      assert.equal(index2.length, 1, 'Should still have one incident');
      assert.equal(index2[0].code, 'AEM-test123');
      assert.equal(index2[0].startTime, '2025-01-01T09:30:00.000Z', 'Should have updated startTime from article metadata');
      assert.equal(index2[0].endTime, '2025-01-01T11:30:00.000Z', 'Should have updated endTime from article metadata');
    });

    it('should extract startTime and endTime from article data attributes', async () => {
      // Create an incident HTML file with data attributes
      const html = `<h1 class="major">AWS Outage</h1>
<article data-incident-start-time="2025-02-15T08:00:00.000Z" data-incident-end-time="2025-02-15T09:00:00.000Z" data-incident-error-rate="0.05" data-incident-impacted-service="publishing">
    <h2>Postmortem</h2>
    <p>AWS outage affected publishing service.</p>
    <time>2025-02-15T10:00:00.000Z</time>
</article>`;

      fs.writeFileSync(path.join(htmlDir, 'AEM-aws123.html'), html);

      // Run the script
      await createAndRunScript();

      // Read the generated index
      const index = readIndex();

      assert.equal(index.length, 1, 'Should have one incident');
      assert.equal(index[0].code, 'AEM-aws123');
      assert.equal(index[0].startTime, '2025-02-15T08:00:00.000Z', 'Should extract startTime from data attribute');
      assert.equal(index[0].endTime, '2025-02-15T09:00:00.000Z', 'Should extract endTime from data attribute');
      assert.equal(index[0].errorRate, '0.05', 'Should extract errorRate from data attribute');
      assert.equal(index[0].impactedService, 'publishing', 'Should extract impactedService from data attribute');
    });
  });
});

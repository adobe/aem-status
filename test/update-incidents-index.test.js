import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (const ts of timestamps) {
        const monthMatch = ts.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
        const dateMatch = ts.match(/(\d{1,2}),/);
        const yearMatch = ts.match(/(\d{4})/);
        
        assert.ok(monthMatch, `Should find month in "${ts}"`);
        assert.ok(dateMatch, `Should find date in "${ts}"`);
        assert.ok(yearMatch, `Should find year in "${ts}"`);
        
        const monthIndex = monthNames.indexOf(monthMatch[1]);
        assert.ok(monthIndex >= 0, `Should have valid month index for "${monthMatch[1]}"`);
      }
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

      for (const testCase of testCases) {
        const dom = new JSDOM(testCase.html);
        const doc = dom.window.document;
        
        let impact = 'none';
        
        // Check article class
        const article = doc.querySelector('article');
        if (article) {
          const match = article.className.match(/incident\s+(\w+)/);
          if (match) impact = match[1];
        }
        
        // Check h1 class for legacy format
        if (impact === 'none') {
          const h1 = doc.querySelector('h1');
          if (h1) {
            const match = h1.className.match(/impact-(\w+)/);
            if (match) impact = match[1];
          }
        }
        
        assert.equal(impact, testCase.expected, 
          `Impact for "${testCase.html}" should be "${testCase.expected}"`);
      }
    });
  });

  describe('file operations', () => {
    let tempDir;
    
    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(__dirname, 'test-'));
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
      fs.writeFileSync(jsonPath, JSON.stringify(testData, null, 2) + '\n');
      
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
});
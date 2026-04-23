import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseFrontmatter,
  markdownToHtml,
  parseInlineMarkdown,
  parseLegacyIncidentSections,
  stripLeadingH1,
  extractPostmortemTitle,
} from '../scripts/simple-markdown.js';

describe('simple-markdown', () => {
  it('parses YAML-like frontmatter', () => {
    const src = '---\nkind: legacy\ntitle: Hello\nimpact: minor\n---\n\nBody here';
    const { frontmatter, body } = parseFrontmatter(src);
    assert.equal(frontmatter.kind, 'legacy');
    assert.equal(frontmatter.title, 'Hello');
    assert.equal(frontmatter.impact, 'minor');
    assert.ok(body.includes('Body here'));
  });

  it('renders inline bold, italic, links, code', () => {
    const html = parseInlineMarkdown('**b** *i* `c` [a](https://example.com)');
    assert.ok(html.includes('<strong>b</strong>'));
    assert.ok(html.includes('<em>i</em>'));
    assert.ok(html.includes('<code>c</code>'));
    assert.ok(html.includes('href="https://example.com"'));
  });

  it('markdownToHtml renders headings and lists', () => {
    const md = '### Hi\n\n- one\n- two\n\n';
    const html = markdownToHtml(md);
    assert.ok(html.includes('<h3>'));
    assert.ok(html.includes('<ul>'));
    assert.ok(html.includes('<li>one</li>'));
  });

  it('stripLeadingH1 removes first # line even after leading newlines', () => {
    const md = '\n\n# My Title\n\n### Next\n';
    const rest = stripLeadingH1(md);
    assert.ok(!rest.includes('# My Title'));
    assert.ok(rest.includes('### Next'));
    assert.equal(extractPostmortemTitle(md), 'My Title');
  });

  it('parseLegacyIncidentSections reads Posted lines', () => {
    const body = `## Postmortem

*Posted Jun 29, 2022 - 15:29 UTC*

Hello **world**.
`;
    const sections = parseLegacyIncidentSections(body);
    assert.equal(sections.length, 1);
    assert.equal(sections[0].title, 'Postmortem');
    assert.equal(sections[0].posted, 'Jun 29, 2022 - 15:29 UTC');
    assert.ok(sections[0].bodyMd.includes('Hello'));
  });
});

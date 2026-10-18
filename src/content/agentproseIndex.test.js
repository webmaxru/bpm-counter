import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createAgentproseIndex,
  createLlmsTxt,
  getAgentproseMarkdownPath,
  pageToMarkdown,
} from './agentproseIndex';
import { findPublishingPageByPath, getAllPublishingPages } from './publishingPages';

describe('agentprose index', () => {
  const pages = getAllPublishingPages();
  const index = createAgentproseIndex(pages, { generated: '2026-10-18T00:00:00.000Z' });

  test('lists every published page once with the fields the crawler needs', () => {
    expect(index.version).toBe(1);
    expect(index.site.url).toBe('https://bpmtech.no/');
    expect(index.posts).toHaveLength(pages.length);
    expect(new Set(index.posts.map((post) => post.url)).size).toBe(pages.length);

    for (const post of index.posts) {
      expect(post.url.startsWith('https://bpmtech.no/')).toBe(true);
      expect(post.title).toBeTruthy();
      expect(post.summary).toBeTruthy();
      expect(post.published).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
      expect(post.md).toMatch(/^\/agentprose\/posts\/.+\.md$/);
      expect(post.text.length).toBeGreaterThan(100);
      expect(post.text.length).toBeLessThanOrEqual(1500);
    }
  });

  test('maps page paths to Markdown files', () => {
    expect(getAgentproseMarkdownPath('/')).toBe('/agentprose/posts/index.md');
    expect(getAgentproseMarkdownPath('/bpm/128')).toBe('/agentprose/posts/bpm/128.md');
    expect(getAgentproseMarkdownPath('/no/verktoy/metronom')).toBe(
      '/agentprose/posts/no/verktoy/metronom.md'
    );
  });

  test('renders a page as Markdown with its sections, tables and FAQ', () => {
    const page = findPublishingPageByPath('/bpm/128');
    const markdown = pageToMarkdown(page);

    expect(markdown.startsWith(`# ${page.heading}\n`)).toBe(true);
    for (const section of page.sections) {
      expect(markdown).toContain(`## ${section.heading}`);
    }
    expect(markdown).toMatch(/^\| .+ \|$/m);
    if (page.faqs?.length) {
      expect(markdown).toContain(`### ${page.faqs[0].question}`);
    }
  });

  test('tags Norwegian pages and keeps their language', () => {
    const post = index.posts.find((entry) => entry.url === 'https://bpmtech.no/no');
    expect(post.lang).toBe('nb');
    expect(post.tags).toContain('norsk');
  });

  test('llms.txt links every page exactly once', () => {
    const llms = createLlmsTxt(pages);
    expect(llms.startsWith('# BPM Techno\n')).toBe(true);
    for (const page of pages) {
      const url = new URL(page.path, 'https://bpmtech.no').toString();
      expect(llms.split(`](${url}):`).length - 1).toBe(1);
    }
  });
});

describe('agentprose script tag', () => {
  test('is loaded once, deferred, from the shared HTML template', () => {
    const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');
    const tags = html.match(/<script[^>]*agentprose\.min\.js[^>]*>/g) ?? [];

    expect(tags).toHaveLength(1);
    expect(tags[0]).toContain('data-key="pk_JP9mt7CmqeRJR9HE"');
    expect(tags[0]).toContain('data-cloud="https://agentprose.cloud"');
    expect(tags[0]).toContain('src="https://agentprose.cloud/v/0/agentprose.min.js"');
    expect(tags[0]).toMatch(/\sdefer\b/);
  });
});

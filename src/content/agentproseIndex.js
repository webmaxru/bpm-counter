import { getPageStrings } from '../i18n.js';
import { SITE_ORIGIN } from '../seoData.js';

// Builds the agentprose index (https://agentprose.cloud/docs/content-discovery)
// from the same content modules that render every page, so the Markdown that AI
// agents and agentprose Cloud read always matches the HTML readers see.

export const AGENTPROSE_INDEX_PATH = '/agentprose.json';
export const AGENTPROSE_POSTS_DIRECTORY = 'agentprose/posts';
export const SITE_NAME = 'BPM Techno';
export const SITE_DESCRIPTION =
  'Free online real-time BPM counter for DJs and producers, with tap tempo, a metronome, BPM converters, per-tempo reference pages and guides.';

const TEXT_EXCERPT_LENGTH = 1500;

const CATEGORY_TAGS = Object.freeze({
  tool: ['tool'],
  guide: ['guide'],
  tempo: ['tempo', 'bpm'],
  hub: ['hub'],
  about: ['about'],
  legal: ['legal'],
});

function absoluteUrl(path) {
  return new URL(path, SITE_ORIGIN).toString();
}

function toIsoDate(date) {
  return `${date}T00:00:00.000Z`;
}

function escapeTableCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

export function getAgentproseMarkdownPath(pagePath) {
  const slug = pagePath === '/' ? 'index' : pagePath.replace(/^\/+|\/+$/g, '');
  return `/${AGENTPROSE_POSTS_DIRECTORY}/${slug}.md`;
}

function sectionToMarkdown(section) {
  const blocks = [`## ${section.heading}`];

  for (const paragraph of section.paragraphs ?? []) {
    blocks.push(paragraph);
  }

  if (section.steps?.length) {
    blocks.push(section.steps.map((step, index) => `${index + 1}. ${step}`).join('\n'));
  }

  if (section.bullets?.length) {
    blocks.push(section.bullets.map((bullet) => `- ${bullet}`).join('\n'));
  }

  if (section.links?.length) {
    blocks.push(
      section.links
        .map((link) => `- [${link.label}](${absoluteUrl(link.href)})`)
        .join('\n')
    );
  }

  if (section.table) {
    const { headers, rows } = section.table;
    blocks.push(
      [
        `| ${headers.map(escapeTableCell).join(' | ')} |`,
        `| ${headers.map(() => '---').join(' | ')} |`,
        ...rows.map((row) => `| ${row.map(escapeTableCell).join(' | ')} |`),
      ].join('\n')
    );
  }

  return blocks.join('\n\n');
}

export function pageToMarkdown(page) {
  const strings = getPageStrings(page);
  const blocks = [`# ${page.heading}`, page.lede, `${strings.updated} ${page.updatedDate}`];

  if (page.category === 'tool' || page.category === 'tempo') {
    blocks.push(`${strings.toolPlaceholder} ${absoluteUrl(page.path)}`);
  }

  for (const section of page.sections ?? []) {
    blocks.push(sectionToMarkdown(section));
  }

  if (page.faqs?.length) {
    blocks.push(
      [
        `## ${strings.faq}`,
        ...page.faqs.map((faq) => `### ${faq.question}\n\n${faq.answer}`),
      ].join('\n\n')
    );
  }

  return `${blocks.filter(Boolean).join('\n\n')}\n`;
}

function markdownToPlainText(markdown) {
  return markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\|?\s*-{3}.*$/gm, '')
    .replace(/[|*_`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pageToAgentprosePost(page) {
  const markdown = pageToMarkdown(page);
  const date = toIsoDate(page.publishedDate ?? page.updatedDate);

  return {
    url: absoluteUrl(page.path),
    title: page.heading,
    summary: page.description,
    published: date,
    updated: toIsoDate(page.updatedDate),
    authors: ['Maxim Salnikov'],
    tags: [...(CATEGORY_TAGS[page.category] ?? []), ...(page.lang === 'nb' ? ['norsk'] : [])],
    ...(page.lang ? { lang: page.lang } : {}),
    text: markdownToPlainText(markdown).slice(0, TEXT_EXCERPT_LENGTH),
    md: getAgentproseMarkdownPath(page.path),
  };
}

export function createAgentproseIndex(pages, { generated = new Date().toISOString() } = {}) {
  return {
    version: 1,
    generator: 'bpm-counter scripts/generate-static-pages.js',
    generated,
    site: {
      name: SITE_NAME,
      url: `${SITE_ORIGIN}/`,
      description: SITE_DESCRIPTION,
      language: 'en',
    },
    posts: pages.map(pageToAgentprosePost),
  };
}

const LLMS_SECTIONS = Object.freeze([
  ['Tools', (page) => page.category === 'tool' && page.lang !== 'nb'],
  ['Guides', (page) => page.category === 'guide'],
  ['Hubs', (page) => page.category === 'hub' && page.lang !== 'nb'],
  ['Norsk (Norwegian)', (page) => page.lang === 'nb'],
  ['BPM by tempo', (page) => page.category === 'tempo'],
  ['Optional', (page) => page.category === 'about' || page.category === 'legal'],
]);

export function createLlmsTxt(pages) {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `Every page below is also available as Markdown (see ${absoluteUrl(AGENTPROSE_INDEX_PATH)} for the full index with summaries, dates and Markdown paths).`,
  ];
  const listed = new Set();

  for (const [heading, matches] of LLMS_SECTIONS) {
    const sectionPages = pages.filter((page) => !listed.has(page.path) && matches(page));

    if (!sectionPages.length) {
      continue;
    }

    lines.push('', `## ${heading}`, '');

    for (const page of sectionPages) {
      listed.add(page.path);
      lines.push(`- [${page.heading}](${absoluteUrl(page.path)}): ${page.description}`);
    }
  }

  const rest = pages.filter((page) => !listed.has(page.path));

  if (rest.length) {
    lines.push('', '## Other pages', '');
    for (const page of rest) {
      lines.push(`- [${page.heading}](${absoluteUrl(page.path)}): ${page.description}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

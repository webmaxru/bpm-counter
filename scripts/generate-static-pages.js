import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  findPublishingPageByPath,
  getRelatedPages,
  publishingPages,
} from '../src/content/publishingPages.js';
import {
  getStaticDocumentPath,
  STATIC_PUBLISHING_ROUTES,
} from '../src/content/publicRoutes.js';
import { createStructuredData, SITE_ORIGIN } from '../src/seoData.js';

const buildDirectory = path.resolve('build');
const templatePath = path.join(buildDirectory, 'index.html');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderList(items, ordered = false) {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('')}</${tag}>`;
}

function renderTable(table) {
  const header = table.headers
    .map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`)
    .join('');
  const rows = table.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeHtml(cell)}</td>`)
          .join('')}</tr>`
    )
    .join('');

  return `<div class="publishing-table-wrapper"><table class="publishing-table"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderSection(section) {
  const paragraphs = (section.paragraphs ?? [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
  const steps = section.steps ? renderList(section.steps, true) : '';
  const bullets = section.bullets ? renderList(section.bullets) : '';
  const links = section.links
    ? `<ul class="publishing-section__links">${section.links
        .map(
          (link) =>
            `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`
        )
        .join('')}</ul>`
    : '';
  const table = section.table ? renderTable(section.table) : '';

  return `<section class="publishing-section"><h3 class="publishing-section__title">${escapeHtml(section.heading)}</h3>${paragraphs}${steps}${bullets}${links}${table}</section>`;
}

function renderFaq(page) {
  if (!page.faqs?.length) {
    return '';
  }

  return `<section class="publishing-faq"><h3 class="publishing-section__title">Frequently asked questions</h3><dl>${page.faqs
    .map(
      (faq) =>
        `<dt>${escapeHtml(faq.question)}</dt><dd>${escapeHtml(faq.answer)}</dd>`
    )
    .join('')}</dl></section>`;
}

function renderRelatedPages(page) {
  const relatedPages = getRelatedPages(page);

  if (!relatedPages.length) {
    return '';
  }

  return `<nav class="publishing-related" aria-label="Related BPM resources"><h3 class="publishing-section__title">Related BPM resources</h3><div class="publishing-related__grid">${relatedPages
    .map(
      (relatedPage) =>
        `<a class="publishing-related__link" href="${escapeHtml(relatedPage.path)}"><strong>${escapeHtml(relatedPage.heading)}</strong><span>${escapeHtml(relatedPage.description)}</span></a>`
    )
    .join('')}</div></nav>`;
}

function renderToolPlaceholder(page) {
  if (page.category !== 'tool') {
    return '';
  }

  return `<section class="tool-panel"><p><strong>${escapeHtml(page.heading)}</strong></p><p>The interactive tool loads when JavaScript is available. The complete guide remains readable below.</p></section>`;
}

function renderPublishingPage(page) {
  return `<main class="content publishing-page"><article><header class="publishing-header"><h2 class="publishing-header__title">${escapeHtml(page.heading)}</h2><p class="publishing-header__lede">${escapeHtml(page.lede)}</p><p class="publishing-header__updated">Updated ${escapeHtml(page.updatedDate)}</p></header>${renderToolPlaceholder(page)}${page.sections
    .map(renderSection)
    .join('')}${renderFaq(page)}</article>${renderRelatedPages(page)}</main>`;
}

function renderPrimaryNavigation() {
  const links = [
    ['/', 'Listen'],
    ['/upload', 'Audio URL'],
    ['/tools/tap-tempo', 'Tap tempo'],
    ['/tools/bpm-to-ms', 'BPM to ms'],
    ['/guides/beatmatching', 'Beatmatching'],
  ];

  return `<nav class="site-nav" aria-label="Primary">${links
    .map(
      ([href, label]) =>
        `<a class="site-nav__link" href="${href}">${label}</a>`
    )
    .join('')}</nav>`;
}

function renderRelatedNavigation() {
  return '<aside class="related-nav" aria-label="Popular BPM resources"><h2>Popular resources</h2><a href="/tools/bpm-converter">Half/double BPM</a><a href="/guides/genre-bpm-ranges">Genre BPM ranges</a><a href="/guides/how-bpm-detection-works">How detection works</a></aside>';
}

function renderStaticShell(page) {
  return `<header class="site-header"><h1 class="site-brand"><a class="site-brand__link" href="/"><svg class="site-brand__mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M5 23v-6M11 29V11M17 25V15M23 34V6M29 27V13M35 22v-4"></path></svg><span class="site-brand__copy"><span class="site-brand__name">BPM Techno</span><span class="site-brand__descriptor">Free · Offline · BPM tools for DJs</span></span></a></h1></header><div class="body">${renderPrimaryNavigation()}${renderPublishingPage(page)}${renderRelatedNavigation()}</div><footer class="site-footer"><div class="site-footer__inner"><p class="site-footer__credit">Made for DJs in Norway by <a href="https://twitter.com/webmaxru/">Maxim Salnikov</a></p><nav class="site-footer__nav" aria-label="Legal and project"><a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a><a href="/affiliate-disclosure">Affiliate disclosure</a></nav></div></footer>`;
}

function setMetaContent(html, attribute, key, content) {
  const pattern = new RegExp(
    `<meta(?=[^>]*${attribute}="${key}")[^>]*>`,
    'i'
  );

  return html.replace(pattern, (tag) => {
    if (/content="[^"]*"/i.test(tag)) {
      return tag.replace(
        /content="[^"]*"/i,
        `content="${escapeHtml(content)}"`
      );
    }

    return tag.replace(/>$/, ` content="${escapeHtml(content)}">`);
  });
}

function createRouteHtml(templateHtml, page) {
  const canonicalUrl = new URL(page.path, SITE_ORIGIN).toString();
  let html = templateHtml.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(page.title)}</title>`
  );

  html = setMetaContent(html, 'name', 'description', page.description);
  html = setMetaContent(html, 'property', 'og:title', page.title);
  html = setMetaContent(
    html,
    'property',
    'og:description',
    page.description
  );
  html = setMetaContent(html, 'property', 'og:url', canonicalUrl);
  html = setMetaContent(html, 'name', 'twitter:title', page.title);
  html = setMetaContent(
    html,
    'name',
    'twitter:description',
    page.description
  );
  html = html.replace(
    '</head>',
    `    <link rel="canonical" href="${canonicalUrl}" />\n    <script id="route-structured-data" type="application/ld+json">${JSON.stringify(createStructuredData(page))}</script>\n  </head>`
  );
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${renderStaticShell(page)}</div>`
  );

  return html;
}

function createSitemap() {
  const urls = publishingPages
    .map((page) => {
      const location = new URL(page.path, SITE_ORIGIN).toString();
      return `  <url><loc>${location}</loc><lastmod>${page.updatedDate}</lastmod></url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function validateStaticWebAppConfig(config) {
  const normalizedRoutes = new Map();

  for (const rule of config.routes ?? []) {
    const normalizedRoute =
      rule.route === '/' ? '/' : rule.route.replace(/\/+$/, '');
    const duplicateRoute = normalizedRoutes.get(normalizedRoute);

    if (duplicateRoute) {
      throw new Error(
        `Duplicate Static Web Apps route after trailing-slash normalization: ${duplicateRoute} and ${rule.route}`
      );
    }

    normalizedRoutes.set(normalizedRoute, rule.route);
  }
}

const templateHtml = await readFile(templatePath, 'utf8');

for (const route of STATIC_PUBLISHING_ROUTES) {
  const page = findPublishingPageByPath(route);

  if (!page) {
    throw new Error(`Missing publishing content for static route: ${route}`);
  }

  const documentPath = getStaticDocumentPath(route).replace(/^\//, '');
  const outputPath = path.join(buildDirectory, documentPath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, createRouteHtml(templateHtml, page), 'utf8');
}

await writeFile(
  path.join(buildDirectory, 'sitemap.xml'),
  createSitemap(),
  'utf8'
);
const staticWebAppConfigPath = path.resolve('src/staticwebapp.config.json');
const staticWebAppConfig = JSON.parse(
  await readFile(staticWebAppConfigPath, 'utf8')
);
validateStaticWebAppConfig(staticWebAppConfig);
await copyFile(
  staticWebAppConfigPath,
  path.join(buildDirectory, 'staticwebapp.config.json')
);

console.log(
  `Generated ${STATIC_PUBLISHING_ROUTES.length} prerendered routes and sitemap.xml.`
);

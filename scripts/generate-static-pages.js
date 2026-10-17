import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  findPublishingPageByPath,
  getAllPublishingPages,
  getRelatedPages,
} from '../src/content/publishingPages.js';
import {
  getStaticDocumentPath,
  PRERENDERED_ROUTES,
} from '../src/content/publicRoutes.js';
import { getHreflangAlternates } from '../src/content/norwegianPages.js';
import { createStructuredData, SITE_ORIGIN } from '../src/seoData.js';
import { getPageStrings, getStrings } from '../src/i18n.js';

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
    ? `<ul class="publishing-section__links${section.linkGrid ? ' publishing-section__links--grid' : ''}">${section.links
        .map(
          (link) =>
            `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`
        )
        .join('')}</ul>`
    : '';
  const table = section.table ? renderTable(section.table) : '';

  return `<section class="publishing-section"><h2 class="publishing-section__title">${escapeHtml(section.heading)}</h2>${paragraphs}${steps}${bullets}${links}${table}</section>`;
}

function renderFaq(page) {
  if (!page.faqs?.length) {
    return '';
  }

  return `<section class="publishing-faq"><h2 class="publishing-section__title">${escapeHtml(getPageStrings(page).faq)}</h2><dl>${page.faqs
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

  const relatedLabel = escapeHtml(getPageStrings(page).related);

  return `<nav class="publishing-related" aria-label="${relatedLabel}"><h2 class="publishing-section__title">${relatedLabel}</h2><div class="publishing-related__grid">${relatedPages
    .map(
      (relatedPage) =>
        `<a class="publishing-related__link" href="${escapeHtml(relatedPage.path)}"><strong>${escapeHtml(relatedPage.heading)}</strong><span>${escapeHtml(relatedPage.description)}</span></a>`
    )
    .join('')}</div></nav>`;
}

function renderToolPlaceholder(page) {
  if (page.category !== 'tool' && page.category !== 'tempo') {
    return '';
  }

  return `<section class="tool-panel"><p><strong>${escapeHtml(page.heading)}</strong></p><p>${escapeHtml(getPageStrings(page).toolPlaceholder)}</p></section>`;
}

function renderPublishingPage(page) {
  const strings = getPageStrings(page);

  return `<main class="content publishing-page"${page.lang ? ` lang="${page.lang}"` : ''}><article><header class="publishing-header"><h1 class="publishing-header__title">${escapeHtml(page.heading)}</h1><p class="publishing-header__lede">${escapeHtml(page.lede)}</p><p class="publishing-header__updated">${escapeHtml(strings.updated)} ${escapeHtml(page.updatedDate)}</p></header>${renderToolPlaceholder(page)}${page.sections
    .map(renderSection)
    .join('')}${renderFaq(page)}</article>${renderRelatedPages(page)}</main>`;
}

function renderPrimaryNavigation(page) {
  const strings = getPageStrings(page);
  const locale = page.lang === 'nb' ? 'nb' : 'en';
  const { languageSwitch } = getStrings(locale);
  const alternate = getHreflangAlternates(page.path).find(
    (entry) => entry.hreflang === languageSwitch.lang
  );
  const switchHref = alternate?.path ?? languageSwitch.fallback;

  return `<nav class="site-nav" aria-label="${escapeHtml(strings.primaryNavLabel)}">${strings.nav
    .map(
      ([href, label]) =>
        `<a class="site-nav__link" href="${href}">${escapeHtml(label)}</a>`
    )
    .join('')}<a class="site-nav__link site-nav__lang" href="${switchHref}" hreflang="${languageSwitch.lang}" lang="${languageSwitch.lang}">${escapeHtml(languageSwitch.label)}</a></nav>`;
}

function renderRelatedNavigation(page) {
  const strings = getPageStrings(page);

  return `<aside class="related-nav" aria-label="${escapeHtml(strings.popularLabel)}"><h2>${escapeHtml(strings.popularHeading)}</h2>${strings.popular
    .map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`)
    .join('')}</aside>`;
}

function renderStaticShell(page) {
  const strings = getPageStrings(page);
  const homePath = page.lang === 'nb' ? '/no' : '/';

  return `<header class="site-header"><div class="site-brand"><a class="site-brand__link" href="${homePath}"><svg class="site-brand__mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M5 23v-6M11 29V11M17 25V15M23 34V6M29 27V13M35 22v-4"></path></svg><span class="site-brand__copy"><span class="site-brand__name">BPM Techno</span><span class="site-brand__descriptor">${escapeHtml(strings.brandDescriptor)}</span></span></a></div></header><div class="body">${renderPrimaryNavigation(page)}${renderPublishingPage(page)}${renderRelatedNavigation(page)}</div><footer class="site-footer"><div class="site-footer__inner"><p class="site-footer__credit">${escapeHtml(strings.footerCredit)} <a href="https://twitter.com/webmaxru/">Maxim Salnikov</a></p><nav class="site-footer__nav" aria-label="${escapeHtml(strings.footerNavLabel)}">${strings.footerLinks
    .map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`)
    .join('')}</nav></div></footer>`;
}

function renderAlternateLinks(page) {
  return getHreflangAlternates(page.path)
    .map(
      ({ hreflang, path: alternatePath }) =>
        `    <link rel="alternate" hreflang="${hreflang}" href="${new URL(alternatePath, SITE_ORIGIN).toString()}" />\n`
    )
    .join('');
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
  if (page.lang === 'nb') {
    html = html.replace(/<html lang="[^"]*"/i, '<html lang="nb"');
  }
  html = html.replace(
    '</head>',
    `    <link rel="canonical" href="${canonicalUrl}" />\n${renderAlternateLinks(page)}    <script id="route-structured-data" type="application/ld+json">${JSON.stringify(createStructuredData(page))}</script>\n  </head>`
  );
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${renderStaticShell(page)}</div>`
  );

  return html;
}

function createSitemap() {
  const urls = getAllPublishingPages()
    .map((page) => {
      const location = new URL(page.path, SITE_ORIGIN).toString();
      const alternates = getHreflangAlternates(page.path)
        .map(
          ({ hreflang, path: alternatePath }) =>
            `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${new URL(alternatePath, SITE_ORIGIN).toString()}"/>`
        )
        .join('');
      return `  <url><loc>${location}</loc><lastmod>${page.updatedDate}</lastmod>${alternates}</url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
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

for (const route of PRERENDERED_ROUTES) {
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
  `Generated ${PRERENDERED_ROUTES.length} prerendered routes and sitemap.xml.`
);

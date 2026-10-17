export const SITE_ORIGIN = 'https://bpmtech.no';

const BREADCRUMB_PARENTS = Object.freeze({
  '/tools/': { name: 'Tools', path: '/tools' },
  '/guides/': { name: 'Guides', path: '/guides' },
  '/bpm/': { name: 'BPM by tempo', path: '/bpm' },
  '/no/verktoy/': { name: 'Verktøy', path: '/no/verktoy' },
});

export function createBreadcrumbList(page, url) {
  const homePath = page.lang === 'nb' ? '/no' : '/';

  if (page.path === homePath) {
    return null;
  }

  const items = [{ name: 'BPM Techno', path: homePath }];
  const parentPrefix = Object.keys(BREADCRUMB_PARENTS).find((prefix) =>
    page.path.startsWith(prefix)
  );

  if (parentPrefix) {
    items.push(BREADCRUMB_PARENTS[parentPrefix]);
  }

  items.push({ name: page.heading, path: page.path });

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path === page.path ? url : new URL(item.path, SITE_ORIGIN).toString(),
    })),
  };
}

export function createStructuredData(page) {
  const url = new URL(page.path, SITE_ORIGIN).toString();
  let primaryEntity;

  if (page.structuredDataType === 'WebApplication') {
    primaryEntity = {
      '@type': 'WebApplication',
      name: page.heading,
      description: page.description,
      url,
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Any',
      ...(page.lang ? { inLanguage: page.lang } : {}),
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    };
  } else if (page.structuredDataType === 'Article') {
    primaryEntity = {
      '@type': 'Article',
      headline: page.heading,
      description: page.description,
      ...(page.publishedDate ? { datePublished: page.publishedDate } : {}),
      dateModified: page.updatedDate,
      mainEntityOfPage: url,
      author: {
        '@type': 'Person',
        name: 'Maxim Salnikov',
        url: 'https://twitter.com/webmaxru',
      },
      publisher: {
        '@type': 'Organization',
        name: 'BPM Techno',
        url: SITE_ORIGIN,
      },
    };
  } else {
    primaryEntity = {
      '@type': page.structuredDataType || 'WebPage',
      name: page.heading,
      description: page.description,
      url,
      dateModified: page.updatedDate,
    };
  }

  const graph = [primaryEntity];

  const breadcrumb = createBreadcrumbList(page, url);

  if (breadcrumb) {
    graph.push(breadcrumb);
  }

  if (page.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

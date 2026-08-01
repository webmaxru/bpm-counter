export const SITE_ORIGIN = 'https://bpmtech.no';

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

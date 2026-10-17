import React from 'react';
import { render, waitFor } from '@testing-library/react';
import Seo from './Seo';
import { getPublishingPage } from './content/publishingPages';
import { createStructuredData } from './seoData';

afterEach(() => {
  document.head.querySelector('link[rel="canonical"]')?.remove();
  document.head.querySelector('meta[name="robots"]')?.remove();
  document.getElementById('route-structured-data')?.remove();
});

describe('Seo', () => {
  it('updates route metadata and structured data', async () => {
    const page = getPublishingPage('tap-tempo');
    render(<Seo page={page} />);

    await waitFor(() => {
      expect(document.title).toBe(page.title);
    });

    expect(
      document.head.querySelector('meta[name="description"]')
    ).toHaveAttribute('content', page.description);
    expect(
      document.head.querySelector('link[rel="canonical"]')
    ).toHaveAttribute('href', 'https://bpmtech.no/tools/tap-tempo');

    const structuredData = JSON.parse(
      document.getElementById('route-structured-data').textContent
    );
    expect(structuredData['@graph'][0]).toEqual(
      expect.objectContaining({
        '@type': 'WebApplication',
        name: page.heading,
      })
    );
  });

  it('marks missing pages noindex and restores indexing on navigation', async () => {
    const missingPage = {
      ...getPublishingPage('tap-tempo'),
      path: '/missing',
      title: 'Page Not Found | BPM Techno',
      noindex: true,
    };
    const validPage = getPublishingPage('bpm-to-ms');
    const { rerender } = render(<Seo page={missingPage} />);

    await waitFor(() => {
      expect(
        document.head.querySelector('meta[name="robots"]')
      ).toHaveAttribute('content', 'noindex, nofollow');
    });
    expect(document.getElementById('route-structured-data')).toBeNull();

    rerender(<Seo page={validPage} />);

    await waitFor(() => {
      expect(
        document.head.querySelector('meta[name="robots"]')
      ).toHaveAttribute('content', 'index, follow');
    });
    expect(document.getElementById('route-structured-data')).not.toBeNull();
  });
});

describe('Seo hreflang', () => {
  it('sets the document language and reciprocal alternates on paired pages', async () => {
    render(<Seo page={getPublishingPage('metronome-nb')} />);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('lang', 'nb');
    });

    const alternates = [
      ...document.head.querySelectorAll('link[rel="alternate"][hreflang]'),
    ].map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')]);

    expect(alternates).toEqual([
      ['en', 'https://bpmtech.no/tools/metronome'],
      ['nb', 'https://bpmtech.no/no/verktoy/metronom'],
      ['x-default', 'https://bpmtech.no/tools/metronome'],
    ]);
  });

  it('removes alternates on pages without a translation', async () => {
    render(<Seo page={getPublishingPage('guides-hub')} />);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('lang', 'en');
    });
    expect(document.head.querySelectorAll('link[rel="alternate"][hreflang]')).toHaveLength(0);
  });
});

describe('createStructuredData', () => {
  const article = {
    path: '/guides/example',
    structuredDataType: 'Article',
    heading: 'Example guide',
    description: 'Example description',
    updatedDate: '2026-10-16',
  };

  it('omits datePublished when no publication date is known', () => {
    const [entity] = createStructuredData(article)['@graph'];

    expect(entity).not.toHaveProperty('datePublished');
    expect(entity.dateModified).toBe('2026-10-16');
  });

  it('emits datePublished from a real publication date', () => {
    const [entity] = createStructuredData({
      ...article,
      publishedDate: '2026-04-02',
    })['@graph'];

    expect(entity.datePublished).toBe('2026-04-02');
    expect(entity.dateModified).toBe('2026-10-16');
  });
});

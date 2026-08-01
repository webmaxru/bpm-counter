import React from 'react';
import { render, waitFor } from '@testing-library/react';
import Seo from './Seo';
import { getPublishingPage } from './content/publishingPages';

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

import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Seo from './Seo';

function NotFound() {
  const location = useLocation();
  const page = useMemo(
    () => ({
      id: 'not-found',
      path: location.pathname,
      category: 'system',
      structuredDataType: 'WebPage',
      title: 'Page Not Found | BPM Techno',
      description:
        'The requested BPM Techno page is not available. Browse the real-time counter, calculators, and original BPM guides.',
      heading: 'Page not found',
      noindex: true,
    }),
    [location.pathname]
  );

  return (
    <main className="content publishing-page">
      <Seo page={page} />
      <header className="publishing-header">
        <h2 className="publishing-header__title">Page not found</h2>
        <p className="publishing-header__lede">{page.description}</p>
      </header>
      <p>
        The requested page is not available. Return to the{' '}
        <Link to="/">real-time BPM counter</Link> or choose a tool from the
        navigation.
      </p>
    </main>
  );
}

export default NotFound;

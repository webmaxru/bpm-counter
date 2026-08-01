import React, { useEffect } from 'react';
import { createStructuredData, SITE_ORIGIN } from './seoData';

const STRUCTURED_DATA_ID = 'route-structured-data';

function setMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
}

function setCanonical(href) {
  let canonical = document.head.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }

  canonical.setAttribute('href', href);
}

function Seo({ page }) {
  useEffect(() => {
    const canonicalUrl = new URL(page.path, SITE_ORIGIN).toString();

    document.title = page.title;
    setCanonical(canonicalUrl);
    setMeta('meta[name="description"]', {
      name: 'description',
      content: page.description,
    });
    setMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: page.title,
    });
    setMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: page.description,
    });
    setMeta('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl,
    });
    setMeta('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: page.title,
    });
    setMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: page.description,
    });
    setMeta('meta[name="robots"]', {
      name: 'robots',
      content: page.noindex ? 'noindex, nofollow' : 'index, follow',
    });

    let script = document.getElementById(STRUCTURED_DATA_ID);
    if (page.noindex) {
      script?.remove();
      return;
    }

    const structuredData = createStructuredData(page);
    if (!script) {
      script = document.createElement('script');
      script.id = STRUCTURED_DATA_ID;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }, [page]);

  return null;
}

export default Seo;

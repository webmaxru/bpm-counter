import React from 'react';
import Seo from './Seo';
import {
  MultiplexAd,
  PublishingFaq,
  PublishingHeader,
  PublishingSections,
  RelatedPublishingPages,
} from './PublishingPage';
import { getPublishingPage } from './content/publishingPages';
import { useContentTelemetry } from './useContentTelemetry';
import { getInArticleSectionIndex } from './adPlacement';
import './Publishing.css';

/**
 * Layout for pages with an interactive tool above the article. The tool is
 * rendered first; the in-article unit keeps at least two content sections
 * between itself and the controls (see adPlacement.js), and the multiplex unit
 * sits after the FAQ.
 */
function ToolPageLayout({ pageId, page: pageProp, children }) {
  const page = pageProp ?? getPublishingPage(pageId);
  useContentTelemetry(page);

  return (
    <main className="content publishing-page" lang={page.lang}>
      <Seo page={page} />
      <article>
        <PublishingHeader page={page} />
        {children}
        <PublishingSections
          page={page}
          adAfterSection={getInArticleSectionIndex(page, {
            hasInteractiveTool: true,
          })}
        />
        <PublishingFaq page={page} />
      </article>
      <MultiplexAd page={page} />
      <RelatedPublishingPages page={page} />
    </main>
  );
}

export default ToolPageLayout;

import React from 'react';
import Seo from './Seo';
import {
  PublishingFaq,
  PublishingHeader,
  PublishingSections,
  RelatedPublishingPages,
} from './PublishingPage';
import { getPublishingPage } from './content/publishingPages';
import { useContentTelemetry } from './useContentTelemetry';
import './Publishing.css';

function ToolPageLayout({ pageId, children }) {
  const page = getPublishingPage(pageId);
  useContentTelemetry(page);

  return (
    <main className="content publishing-page">
      <Seo page={page} />
      <article>
        <PublishingHeader page={page} />
        {children}
        <PublishingSections page={page} />
        <PublishingFaq page={page} />
      </article>
      <RelatedPublishingPages page={page} />
    </main>
  );
}

export default ToolPageLayout;

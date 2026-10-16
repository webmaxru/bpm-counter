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
import AdSlot from './AdSlot';
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
        <PublishingSections page={page} adAfterSection={1} />
        <PublishingFaq page={page} />
      </article>
      <AdSlot name="multiplex" format="autorelaxed" minHeight={320} />
      <RelatedPublishingPages page={page} />
    </main>
  );
}

export default ToolPageLayout;

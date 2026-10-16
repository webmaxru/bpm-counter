import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Seo from './Seo';
import {
  findPublishingPageByPath,
  getPublishingPage,
  getRelatedPages,
} from './content/publishingPages';
import { useContentTelemetry } from './useContentTelemetry';
import NotFound from './NotFound';
import AdSlot from './AdSlot';
import './Publishing.css';

export function PublishingHeader({ page }) {
  return (
    <header className="publishing-header">
      <h1 className="publishing-header__title">{page.heading}</h1>
      <p className="publishing-header__lede">{page.lede}</p>
      <p className="publishing-header__updated">
        Updated {page.updatedDate}
      </p>
    </header>
  );
}

export function PublishingSections({ page, adAfterSection = -1 }) {
  return (
    <>
      {page.sections.map((section, index) => (
        <React.Fragment key={section.heading}>
        {index === adAfterSection ? (
          <AdSlot
            key={`${page.id}-in-article`}
            name="inArticle"
            format="fluid"
            layout="in-article"
          />
        ) : null}
        <section className="publishing-section">
          <h2 className="publishing-section__title">{section.heading}</h2>

          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          {section.steps ? (
            <ol>
              {section.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}

          {section.bullets ? (
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}

          {section.links ? (
            <ul className="publishing-section__links">
              {section.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          ) : null}

          {section.table ? (
            <div className="publishing-table-wrapper">
              <table className="publishing-table">
                <thead>
                  <tr>
                    {section.table.headers.map((header) => (
                      <th key={header} scope="col">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row) => (
                    <tr key={row.join('-')}>
                      {row.map((cell) => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
        </React.Fragment>
      ))}
    </>
  );
}

export function PublishingFaq({ page }) {
  if (!page.faqs?.length) {
    return null;
  }

  return (
    <section className="publishing-faq">
      <h2 className="publishing-section__title">
        Frequently asked questions
      </h2>
      <dl>
        {page.faqs.map((faq) => (
          <React.Fragment key={faq.question}>
            <dt>{faq.question}</dt>
            <dd>{faq.answer}</dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );
}

export function RelatedPublishingPages({ page }) {
  const relatedPages = getRelatedPages(page);

  if (!relatedPages.length) {
    return null;
  }

  return (
    <nav className="publishing-related" aria-label="Related BPM resources">
      <h2 className="publishing-section__title">Related BPM resources</h2>
      <div className="publishing-related__grid">
        {relatedPages.map((relatedPage) => (
          <Link
            className="publishing-related__link"
            key={relatedPage.id}
            to={relatedPage.path}
          >
            <strong>{relatedPage.heading}</strong>
            <span>{relatedPage.description}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function PublishingArticle({ page }) {
  useContentTelemetry(page);

  return (
    <main className="content publishing-page">
      <Seo page={page} />
      <article>
        <PublishingHeader page={page} />
        <PublishingSections
          page={page}
          adAfterSection={page.category === 'guide' ? 1 : -1}
        />
        <PublishingFaq page={page} />
      </article>
      {page.category === 'guide' ? (
        <AdSlot
          key={`${page.id}-multiplex`}
          name="multiplex"
          format="autorelaxed"
          minHeight={320}
        />
      ) : null}
      <RelatedPublishingPages page={page} />
    </main>
  );
}

function PublishingPage({ pageId }) {
  return <PublishingArticle page={getPublishingPage(pageId)} />;
}

export function GuidePage() {
  const { slug } = useParams();
  const page = findPublishingPageByPath(`/guides/${slug}`);

  if (!page || page.category !== 'guide') {
    return <NotFound />;
  }

  return <PublishingArticle page={page} />;
}

export default PublishingPage;

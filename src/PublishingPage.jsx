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
import { getInArticleSectionIndex, shouldShowMultiplex } from './adPlacement';
import { getPageStrings } from './i18n';
import './Publishing.css';

export function PublishingHeader({ page }) {
  const strings = getPageStrings(page);

  return (
    <header className="publishing-header">
      <h1 className="publishing-header__title">{page.heading}</h1>
      <p className="publishing-header__lede">{page.lede}</p>
      <p className="publishing-header__updated">
        {strings.updated}{' '}
        <time dateTime={page.updatedDate}>{page.updatedDate}</time>
      </p>
    </header>
  );
}

export function InArticleAd({ page }) {
  return (
    <AdSlot
      key={`${page.id}-in-article`}
      name="inArticle"
      format="fluid"
      layout="in-article"
      label={getPageStrings(page).adLabel}
    />
  );
}

export function MultiplexAd({ page }) {
  if (!shouldShowMultiplex(page)) {
    return null;
  }

  return (
    <AdSlot
      key={`${page.id}-multiplex`}
      name="multiplex"
      format="autorelaxed"
      minHeight={320}
      label={getPageStrings(page).adLabel}
    />
  );
}

export function PublishingSections({ page, adAfterSection = -1 }) {
  return (
    <>
      {page.sections.map((section, index) => (
        <React.Fragment key={section.heading}>
        {index === adAfterSection ? <InArticleAd page={page} /> : null}
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
            <ul
              className={`publishing-section__links${
                section.linkGrid ? ' publishing-section__links--grid' : ''
              }`}
            >
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
                  {section.table.rows.map((row, rowIndex) => (
                    <tr key={`${rowIndex}-${row.join('-')}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${cellIndex}-${cell}`}>{cell}</td>
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
        {getPageStrings(page).faq}
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
  const strings = getPageStrings(page);

  if (!relatedPages.length) {
    return null;
  }

  return (
    <nav className="publishing-related" aria-label={strings.related}>
      <h2 className="publishing-section__title">{strings.related}</h2>
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
    <main className="content publishing-page" lang={page.lang}>
      <Seo page={page} />
      <article>
        <PublishingHeader page={page} />
        <PublishingSections
          page={page}
          adAfterSection={getInArticleSectionIndex(page)}
        />
        <PublishingFaq page={page} />
      </article>
      <MultiplexAd page={page} />
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

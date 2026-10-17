import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { getHreflangAlternates } from './content/norwegianPages';
import { getLocaleForPath, getStrings } from './i18n';

const navLinkClassName = ({ isActive }) =>
  isActive ? 'site-nav__link site-nav__link--active' : 'site-nav__link';

/** The other-language version of a path, or that language's home page. */
export function getLanguageSwitch(path) {
  const locale = getLocaleForPath(path);
  const { languageSwitch } = getStrings(locale);
  const alternate = getHreflangAlternates(path).find(
    (entry) => entry.hreflang === languageSwitch.lang
  );

  return {
    href: alternate?.path ?? languageSwitch.fallback,
    label: languageSwitch.label,
    lang: languageSwitch.lang,
  };
}

function useLocaleStrings() {
  const { pathname } = useLocation();
  const locale = getLocaleForPath(pathname);
  return { pathname, strings: getStrings(locale) };
}

export function SiteNav() {
  const { pathname, strings } = useLocaleStrings();
  const languageSwitch = getLanguageSwitch(pathname);

  return (
    <nav className="site-nav" aria-label={strings.primaryNavLabel}>
      {strings.nav.map(([href, label, end]) => (
        <NavLink key={href} className={navLinkClassName} end={end} to={href}>
          {label}
        </NavLink>
      ))}
      <Link
        className="site-nav__link site-nav__lang"
        to={languageSwitch.href}
        hrefLang={languageSwitch.lang}
        lang={languageSwitch.lang}
      >
        {languageSwitch.label}
      </Link>
    </nav>
  );
}

export function PopularNav() {
  const { strings } = useLocaleStrings();

  return (
    <aside className="related-nav" aria-label={strings.popularLabel}>
      <h2>{strings.popularHeading}</h2>
      {strings.popular.map(([href, label]) => (
        <Link key={href} to={href}>
          {label}
        </Link>
      ))}
    </aside>
  );
}

export function SiteFooterContent() {
  const { strings } = useLocaleStrings();

  return (
    <div className="site-footer__inner">
      <p className="site-footer__credit">
        {strings.footerCredit}{' '}
        <a href="https://twitter.com/webmaxru/">Maxim Salnikov</a>
      </p>
      <nav className="site-footer__nav" aria-label={strings.footerNavLabel}>
        {strings.footerLinks.map(([href, label]) => (
          <Link key={href} to={href}>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function SiteBrand() {
  const { strings } = useLocaleStrings();

  return (
    <div className="site-brand">
      <Link className="site-brand__link" to={strings.homePath}>
        <svg className="site-brand__mark" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M5 23v-6M11 29V11M17 25V15M23 34V6M29 27V13M35 22v-4" />
        </svg>
        <span className="site-brand__copy">
          <span className="site-brand__name">BPM Techno</span>
          <span className="site-brand__descriptor">{strings.brandDescriptor}</span>
        </span>
      </Link>
    </div>
  );
}

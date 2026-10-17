import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getLanguageSwitch, SiteBrand, SiteNav } from './SiteChrome';

describe('getLanguageSwitch', () => {
  it.each([
    ['/tools/metronome', '/no/verktoy/metronom', 'nb'],
    ['/tools/metronome/', '/no/verktoy/metronom', 'nb'],
    ['/no/verktoy/metronom', '/tools/metronome', 'en'],
    ['/no/verktoy/metronom/', '/tools/metronome', 'en'],
    ['/', '/no', 'nb'],
    ['/no', '/', 'en'],
    ['/no/', '/', 'en'],
    ['/tools/', '/no/verktoy', 'nb'],
    ['/no/verktoy/', '/tools', 'en'],
  ])('switches %s to %s', (path, href, lang) => {
    expect(getLanguageSwitch(path)).toMatchObject({ href, lang });
  });

  it('falls back to the other language home page without a translation', () => {
    expect(getLanguageSwitch('/guides/beatmatching/')).toMatchObject({
      href: '/no',
      lang: 'nb',
    });
  });
});

describe('SiteNav', () => {
  it('keeps the language switch on trailing-slash URLs', () => {
    render(
      <MemoryRouter initialEntries={['/no/verktoy/metronom/']}>
        <SiteNav />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute(
      'href',
      '/tools/metronome'
    );
  });
});

describe('SiteBrand', () => {
  it.each([
    ['/', '/', /Free · Offline · BPM tools for DJs/],
    ['/tools/metronome', '/', /Free · Offline · BPM tools for DJs/],
    ['/no', '/no', /Gratis · Virker uten nett/],
    ['/no/verktoy/metronom/', '/no', /Gratis · Virker uten nett/],
  ])('on %s links home to %s', (path, href, descriptor) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <SiteBrand />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /BPM Techno/ });
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveTextContent(descriptor);
  });
});

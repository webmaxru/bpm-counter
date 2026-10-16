import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import AdSlot from './AdSlot';
import { GuidePage } from './PublishingPage';

const mockSlots = vi.hoisted(() => ({}));

vi.mock('./ads', () => ({
  adsConfig: { adsense: { clientId: 'ca-pub-0000000000000000' } },
  getAdSenseSlot: (name) => mockSlots[name] || '',
  isAdSenseEnabled: () => true,
}));

vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

beforeEach(() => {
  mockSlots.inArticle = '1111111111';
  mockSlots.multiplex = '2222222222';
  window.adsbygoogle = [];
});

afterEach(() => {
  delete window.adsbygoogle;
});

describe('AdSlot', () => {
  it('renders nothing for an unknown unit name', () => {
    const { container } = render(<AdSlot name="unknown" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a known unit without a configured slot', () => {
    mockSlots.inArticle = '';

    const { container } = render(
      <AdSlot name="inArticle" format="fluid" layout="in-article" />
    );

    expect(container).toBeEmptyDOMElement();
    expect(window.adsbygoogle).toHaveLength(0);
  });

  it('renders the in-article unit with the configured slot and in-article layout', () => {
    const { container } = render(<AdSlot name="inArticle" format="fluid" layout="in-article" />);
    const ins = container.querySelector('ins.adsbygoogle');

    expect(ins).not.toBeNull();
    expect(ins.getAttribute('data-ad-client')).toBe('ca-pub-0000000000000000');
    expect(ins.getAttribute('data-ad-slot')).toBe('1111111111');
    expect(ins.getAttribute('data-ad-format')).toBe('fluid');
    expect(ins.getAttribute('data-ad-layout')).toBe('in-article');
    expect(ins.hasAttribute('data-full-width-responsive')).toBe(false);
    expect(container.textContent).toContain('Advertisements');
    expect(window.adsbygoogle).toHaveLength(1);
  });

  it('renders the multiplex unit with the configured slot', () => {
    const { container } = render(<AdSlot name="multiplex" format="autorelaxed" />);
    const ins = container.querySelector('ins.adsbygoogle');

    expect(ins).not.toBeNull();
    expect(ins.getAttribute('data-ad-slot')).toBe('2222222222');
    expect(ins.getAttribute('data-ad-format')).toBe('autorelaxed');
  });
});

describe('AdSlot on guide pages', () => {
  function NavigateTo({ to }) {
    const navigate = useNavigate();

    return (
      <button type="button" onClick={() => navigate(to)}>
        Next guide
      </button>
    );
  }

  it('requests a new multiplex ad when navigating between guides', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/guides/beatmatching']}>
        <NavigateTo to="/guides/genre-bpm-ranges" />
        <Routes>
          <Route path="/guides/:slug" element={<GuidePage />} />
        </Routes>
      </MemoryRouter>
    );
    const multiplexSelector = '.ad-slot--multiplex ins.adsbygoogle';
    const firstUnit = container.querySelector(multiplexSelector);
    const requestsOnFirstGuide = window.adsbygoogle.length;

    expect(firstUnit).not.toBeNull();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Next guide' }));
    });

    const secondUnit = container.querySelector(multiplexSelector);

    expect(secondUnit).not.toBeNull();
    expect(secondUnit).not.toBe(firstUnit);
    expect(window.adsbygoogle.length).toBe(requestsOnFirstGuide * 2);
  });
});

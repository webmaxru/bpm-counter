import React from 'react';
import { render } from '@testing-library/react';
import AdSlot from './AdSlot';

describe('AdSlot', () => {
  it('renders nothing for an unknown unit name', () => {
    const { container } = render(<AdSlot name="unknown" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the in-article unit with the configured slot and in-article layout', () => {
    const { container } = render(<AdSlot name="inArticle" format="fluid" layout="in-article" />);
    const ins = container.querySelector('ins.adsbygoogle');

    expect(ins).not.toBeNull();
    expect(ins.getAttribute('data-ad-slot')).toBe('4250080584');
    expect(ins.getAttribute('data-ad-format')).toBe('fluid');
    expect(ins.getAttribute('data-ad-layout')).toBe('in-article');
    expect(ins.hasAttribute('data-full-width-responsive')).toBe(false);
    expect(container.textContent).toContain('Advertisements');
  });

  it('renders the multiplex unit with the configured slot', () => {
    const { container } = render(<AdSlot name="multiplex" format="autorelaxed" />);
    const ins = container.querySelector('ins.adsbygoogle');

    expect(ins.getAttribute('data-ad-slot')).toBe('3563684870');
    expect(ins.getAttribute('data-ad-format')).toBe('autorelaxed');
  });
});

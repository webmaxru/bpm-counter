import React from 'react';
import { render, screen } from '@testing-library/react';
import AdLink from './AdLink';

// Mock react-ga4
jest.mock('react-ga4', () => ({
  event: jest.fn(),
  initialize: jest.fn(),
  send: jest.fn(),
}));

describe('AdLink', () => {
  it('renders a link for "item-music-prod" ad', () => {
    render(<AdLink ad="item-music-prod" appInsights={null} />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('amazon.com')
    );
  });

  it('renders a link for "item-sample-pack" ad', () => {
    render(<AdLink ad="item-sample-pack" appInsights={null} />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('amazon.com')
    );
  });

  it('renders a link for "search-dj-controllers" ad', () => {
    render(<AdLink ad="search-dj-controllers" appInsights={null} />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('amazon.com')
    );
  });

  it('link text is not empty', () => {
    render(<AdLink ad="item-music-prod" appInsights={null} />);
    const link = screen.getByRole('link');
    expect(link.textContent.length).toBeGreaterThan(0);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import About from './About';

// Mock react-ga4 (imported by sub-components if any)
jest.mock('react-ga4', () => ({
  event: jest.fn(),
  initialize: jest.fn(),
  send: jest.fn(),
}));

describe('About', () => {
  it('renders "3-in-1 project" heading', () => {
    render(<About appInsights={null} />);
    expect(screen.getByText(/3-in-1 project/i)).toBeInTheDocument();
  });

  it('shows author name "Maxim Salnikov"', () => {
    render(<About appInsights={null} />);
    const matches = screen.getAllByText(/Maxim Salnikov/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('has "Fetch user account data" button', () => {
    render(<About appInsights={null} />);
    expect(
      screen.getByRole('button', { name: /Fetch user account data/i })
    ).toBeInTheDocument();
  });

  it('has link for Azure Static Web Apps', () => {
    render(<About appInsights={null} />);
    expect(
      screen.getByRole('link', { name: 'Azure Static Web Apps (SWA)' })
    ).toBeInTheDocument();
  });

  it('mentions Progressive Web App', () => {
    render(<About appInsights={null} />);
    expect(screen.getByText(/Progressive Web App/)).toBeInTheDocument();
  });
});

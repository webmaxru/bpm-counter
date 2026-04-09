import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Account from './Account';

describe('Account', () => {
  const mockPrincipal = {
    identityProvider: 'github',
    userId: 'abc-123',
    userDetails: 'testuser',
    userRoles: ['anonymous', 'authenticated'],
  };

  afterEach(() => {
    delete global.fetch;
  });

  it('shows "Loading..." initially before fetch completes', () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // never resolves
    render(<Account />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows user info when authenticated', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ clientPrincipal: mockPrincipal }),
      })
    );

    render(<Account />);

    await waitFor(() => {
      expect(screen.getByText(/identityProvider/)).toBeInTheDocument();
    });

    expect(screen.getByText(/abc-123/)).toBeInTheDocument();
    expect(screen.getByText(/testuser/)).toBeInTheDocument();
    expect(screen.getByText(/anonymous, authenticated/)).toBeInTheDocument();
  });

  it('shows "Not logged in" with login link when no clientPrincipal', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      })
    );

    render(<Account />);

    await waitFor(() => {
      expect(screen.getByText(/Not logged in/)).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Log in/i })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('shows logout and purge links when authenticated', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ clientPrincipal: mockPrincipal }),
      })
    );

    render(<Account />);

    await waitFor(() => {
      expect(screen.getByText(/Log out/)).toBeInTheDocument();
    });

    expect(
      screen.getByRole('link', { name: /Remove personal information for Twitter/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Remove personal information for GitHub/i })
    ).toBeInTheDocument();
  });

  it('warns on console when fetch fails on localhost', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Simulate localhost
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hostname: 'localhost' },
      writable: true,
    });

    render(<Account />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Can't access the auth endpoint")
    );

    warnSpy.mockRestore();
  });

  it('logs error when fetch fails on non-localhost', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Server error')));

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    Object.defineProperty(window, 'location', {
      value: { ...window.location, hostname: 'bpmtechno.com' },
      writable: true,
    });

    render(<Account />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to unpack JSON'),
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });

  it('renders the "Account" heading', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({}),
      })
    );

    render(<Account />);

    expect(screen.getByRole('heading', { name: /Account/i })).toBeInTheDocument();
  });
});

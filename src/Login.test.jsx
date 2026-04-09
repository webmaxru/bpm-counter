import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from './Login';

describe('Login', () => {
  it('renders "Log in" heading', () => {
    render(<Login />);
    expect(screen.getByRole('heading', { name: /Log in/i })).toBeInTheDocument();
  });

  it('has Twitter login link', () => {
    render(<Login />);
    expect(
      screen.getByRole('link', { name: /Log in with Twitter$/i })
    ).toHaveAttribute('href', '.auth/login/twitter');
  });

  it('has GitHub login link', () => {
    render(<Login />);
    expect(
      screen.getByRole('link', { name: /Log in with GitHub$/i })
    ).toHaveAttribute('href', '.auth/login/github');
  });

  it('has Azure Active Directory login link', () => {
    render(<Login />);
    expect(
      screen.getByRole('link', { name: /Log in with Azure Active Directory/i })
    ).toHaveAttribute('href', '.auth/login/aad');
  });

  it('has Twitter login with redirect to /account', () => {
    render(<Login />);
    expect(
      screen.getByRole('link', { name: /Log in with Twitter with redirect/i })
    ).toHaveAttribute(
      'href',
      '/.auth/login/twitter?post_login_redirect_uri=/account'
    );
  });

  it('has GitHub login with redirect', () => {
    render(<Login />);
    expect(
      screen.getByRole('link', { name: /Log in with GitHub with redirect/i })
    ).toHaveAttribute(
      'href',
      '/.auth/login/github?post_login_redirect_uri=/account'
    );
  });
});

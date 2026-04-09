import React from 'react';
import { render, screen } from '@testing-library/react';
import Admin from './Admin';

describe('Admin', () => {
  it('renders "Admin" heading', () => {
    render(<Admin />);
    expect(screen.getByRole('heading', { name: /Admin/i })).toBeInTheDocument();
  });

  it('has link to /account', () => {
    render(<Admin />);
    const link = screen.getByRole('link', { name: /Account/i });
    expect(link).toHaveAttribute('href', '/account');
  });

  it('has logout link', () => {
    render(<Admin />);
    const link = screen.getByRole('link', { name: /Log out/i });
    expect(link).toHaveAttribute('href', '.auth/logout');
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BpmToHz, { bpmToHz, calculateRates, hzToBpm } from './BpmToHz';

vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

describe('bpmToHz', () => {
  it('converts tempo to beat frequency', () => {
    expect(bpmToHz(120)).toBe(2);
    expect(hzToBpm(2)).toBe(120);
    expect(bpmToHz(0)).toBeNull();
  });

  it('derives note-value rates', () => {
    const byLabel = Object.fromEntries(
      calculateRates(120).map((rate) => [rate.label, rate])
    );

    expect(byLabel['Quarter note (one beat)'].hertz).toBe(2);
    expect(byLabel['1 bar (whole note)'].hertz).toBe(0.5);
    expect(byLabel['Eighth note'].milliseconds).toBe(250);
    expect(byLabel['4 bars'].milliseconds).toBe(8000);
  });
});

describe('BpmToHz', () => {
  it('updates the table when BPM changes', () => {
    render(
      <MemoryRouter>
        <BpmToHz />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Tempo in BPM/i }), {
      target: { value: '60' },
    });

    expect(screen.getByText('1 Hz')).toBeInTheDocument();
  });
});

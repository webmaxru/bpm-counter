import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TapTempo, { calculateTapBpm } from './TapTempo';

vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

describe('calculateTapBpm', () => {
  it('averages tap intervals into BPM', () => {
    expect(calculateTapBpm([0, 500, 1000, 1500])).toBe(120);
  });

  it('requires at least two valid taps', () => {
    expect(calculateTapBpm([])).toBeNull();
    expect(calculateTapBpm([100])).toBeNull();
    expect(calculateTapBpm([100, 100])).toBeNull();
  });
});

describe('TapTempo', () => {
  it('calculates BPM from button taps and can reset', () => {
    let currentTime = 0;
    vi.spyOn(window.performance, 'now').mockImplementation(
      () => currentTime
    );

    render(
      <MemoryRouter>
        <TapTempo />
      </MemoryRouter>
    );

    const tapButton = screen.getByRole('button', { name: /Tap beat/i });
    [0, 500, 1000, 1500].forEach((tapTime) => {
      currentTime = tapTime;
      fireEvent.click(tapButton);
    });

    expect(screen.getByText('120')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(screen.getByText('--')).toBeInTheDocument();
  });
});

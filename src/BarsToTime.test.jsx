import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BarsToTime, {
  barsToSeconds,
  formatDuration,
  secondsToBars,
} from './BarsToTime';

vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

describe('barsToSeconds', () => {
  it('converts bars to seconds in 4/4', () => {
    expect(barsToSeconds(120, 1)).toBe(2);
    expect(barsToSeconds(128, 16)).toBeCloseTo(30, 5);
    expect(barsToSeconds(174, 32, 4)).toBeCloseTo(44.138, 2);
  });

  it('rejects invalid input', () => {
    expect(barsToSeconds(0, 4)).toBeNull();
    expect(barsToSeconds('x', 4)).toBeNull();
    expect(secondsToBars(120, 0)).toBeNull();
  });

  it('converts seconds back to bars', () => {
    expect(secondsToBars(120, 60)).toBe(30);
  });

  it('formats durations', () => {
    expect(formatDuration(30)).toBe('30 s');
    expect(formatDuration(90)).toBe('1:30.0 min');
    expect(formatDuration(null)).toBe('-');
  });
});

describe('BarsToTime', () => {
  it('recalculates when the tempo changes', () => {
    render(
      <MemoryRouter>
        <BarsToTime />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Tempo in BPM/i }), {
      target: { value: '120' },
    });

    expect(
      screen.getByText('16 bars', { selector: '.tool-result-card__label' })
        .nextSibling
    ).toHaveTextContent('32 s');
  });
});

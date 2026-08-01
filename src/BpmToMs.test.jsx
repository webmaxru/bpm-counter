import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BpmToMs, { calculateNoteDurations } from './BpmToMs';

vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

describe('calculateNoteDurations', () => {
  it('calculates common note durations at 120 BPM', () => {
    const durations = calculateNoteDurations(120);
    const byLabel = Object.fromEntries(
      durations.map((duration) => [duration.label, duration.milliseconds])
    );

    expect(byLabel['Whole note']).toBe(2000);
    expect(byLabel['Quarter note']).toBe(500);
    expect(byLabel['Eighth note']).toBe(250);
    expect(byLabel['Sixteenth note']).toBe(125);
  });

  it('rejects invalid tempos', () => {
    expect(calculateNoteDurations(0)).toEqual([]);
    expect(calculateNoteDurations('not-a-number')).toEqual([]);
  });
});

describe('BpmToMs', () => {
  it('updates note durations when BPM changes', () => {
    render(
      <MemoryRouter>
        <BpmToMs />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Tempo in BPM/i }), {
      target: { value: '100' },
    });

    expect(screen.getByText('600 ms')).toBeInTheDocument();
    expect(screen.getByText('300 ms')).toBeInTheDocument();
  });
});

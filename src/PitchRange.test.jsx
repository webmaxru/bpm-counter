import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PitchRange, {
  pitchPercent,
  pitchRangeBounds,
  semitoneShift,
} from './PitchRange';

vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

describe('pitch range maths', () => {
  it('computes fader bounds', () => {
    expect(pitchRangeBounds(100, 8)).toEqual({ min: 92, max: 108 });
    expect(pitchRangeBounds(0, 8)).toBeNull();
  });

  it('computes the pitch percentage and semitone shift', () => {
    expect(pitchPercent(126, 130)).toBeCloseTo(3.17, 2);
    expect(semitoneShift(120, 240)).toBe(12);
    expect(semitoneShift(100, 105.95)).toBeCloseTo(1, 1);
  });
});

describe('PitchRange', () => {
  it('reports whether a target tempo is reachable', () => {
    render(
      <MemoryRouter>
        <PitchRange />
      </MemoryRouter>
    );

    fireEvent.change(
      screen.getByRole('spinbutton', { name: /Target BPM/i }),
      { target: { value: '150' } }
    );

    expect(screen.getByText('Within ±8%?').nextSibling).toHaveTextContent('No');
  });
});

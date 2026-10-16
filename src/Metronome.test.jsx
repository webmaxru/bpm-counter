import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Metronome, { clampBpm, nextBeatTime } from './Metronome';

vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

describe('metronome maths', () => {
  it('clamps tempos to the supported range', () => {
    expect(clampBpm(20)).toBe(30);
    expect(clampBpm(400)).toBe(300);
    expect(clampBpm('abc')).toBe(120);
    expect(clampBpm(127.46)).toBe(127.5);
  });

  it('schedules the next beat one period later', () => {
    expect(nextBeatTime(1, 120)).toBe(1.5);
  });
});

describe('Metronome', () => {
  it('adjusts the tempo with the step buttons', () => {
    render(
      <MemoryRouter>
        <Metronome />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '+5' }));

    expect(screen.getByRole('spinbutton', { name: /Tempo in BPM/i })).toHaveValue(
      125
    );
  });
});

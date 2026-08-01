import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BpmConverter, { calculateTempoFamily } from './BpmConverter';

vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

describe('calculateTempoFamily', () => {
  it('calculates half-time and double-time values', () => {
    expect(calculateTempoFamily(128)).toEqual({
      halfTime: 64,
      original: 128,
      doubleTime: 256,
    });
  });

  it('rejects invalid tempos', () => {
    expect(calculateTempoFamily(0)).toBeNull();
    expect(calculateTempoFamily('invalid')).toBeNull();
  });
});

describe('BpmConverter', () => {
  it('updates the tempo family when BPM changes', () => {
    render(
      <MemoryRouter>
        <BpmConverter />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Tempo in BPM/i }), {
      target: { value: '174' },
    });

    expect(screen.getByText('87 BPM')).toBeInTheDocument();
    expect(screen.getByText('174 BPM')).toBeInTheDocument();
    expect(screen.getByText('348 BPM')).toBeInTheDocument();
  });
});

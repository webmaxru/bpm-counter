import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TempoPage, { compareTappedTempo } from './TempoPage';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/bpm/:tempo" element={<TempoPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TempoPage', () => {
  it('renders the tempo page with the metronome preset to that tempo', () => {
    renderAt('/bpm/128');

    expect(screen.getByRole('heading', { level: 1, name: '128 BPM' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tempo in BPM')).toHaveValue(128);
    expect(screen.getByRole('button', { name: 'Tap beat' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Half-time: 64 BPM' })).toHaveAttribute('href', '/bpm/64');
  });

  it('shows the not-found page outside 60–200 BPM', () => {
    renderAt('/bpm/59');

    expect(screen.queryByRole('heading', { level: 1, name: '59 BPM' })).toBeNull();
  });
});

describe('compareTappedTempo', () => {
  it('recognises matches and half/double-time taps', () => {
    expect(compareTappedTempo(127.2, 128).kind).toBe('match');
    expect(compareTappedTempo(64.3, 128).kind).toBe('half');
    expect(compareTappedTempo(174, 87).kind).toBe('double');
  });

  it('suggests the nearest tempo page otherwise', () => {
    expect(compareTappedTempo(140.4, 128)).toEqual({ kind: 'other', difference: 12.4, nearest: 140 });
    expect(compareTappedTempo(230, 128).nearest).toBeNull();
    expect(compareTappedTempo(null, 128)).toBeNull();
  });
});

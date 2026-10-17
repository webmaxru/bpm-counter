import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import AdRouteGuard from './AdRouteGuard';
import { areAdScriptsLoaded } from './ads';

function renderAt(initialPath, onReloadRequired) {
  window.history.pushState({}, '', initialPath);

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AdRouteGuard onReloadRequired={onReloadRequired} />
      <Routes>
        <Route
          path="*"
          element={
            <nav>
              <Link to="/tools/metronome">Metronome</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/tools">Tools hub</Link>
            </nav>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

function navigate(name, path) {
  // MemoryRouter does not touch window.location; keep it in sync like
  // BrowserRouter does, since the deferred loader reads it.
  window.history.pushState({}, '', path);
  act(() => {
    screen.getByRole('link', { name }).click();
  });
}

afterEach(() => {
  document.getElementById('adsense-script')?.remove();
  window.history.pushState({}, '', '/');
});

describe('AdRouteGuard', () => {
  it('loads the ad script on an ad-eligible landing page', () => {
    const onReloadRequired = vi.fn();
    renderAt('/tools/metronome', onReloadRequired);

    expect(areAdScriptsLoaded()).toBe(true);
    expect(onReloadRequired).not.toHaveBeenCalled();
  });

  it('keeps Auto ads off a no-ad landing page', () => {
    const onReloadRequired = vi.fn();
    renderAt('/privacy', onReloadRequired);

    expect(areAdScriptsLoaded()).toBe(false);
    expect(onReloadRequired).not.toHaveBeenCalled();
  });

  it('starts ads when navigating from a no-ad page to an ad page', () => {
    const onReloadRequired = vi.fn();
    renderAt('/tools', onReloadRequired);

    navigate('Metronome', '/tools/metronome');

    expect(areAdScriptsLoaded()).toBe(true);
    expect(onReloadRequired).not.toHaveBeenCalled();
  });

  it('reloads the document when leaving an ad page for a no-ad page', () => {
    const onReloadRequired = vi.fn();
    renderAt('/tools/metronome', onReloadRequired);

    navigate('Privacy', '/privacy');

    expect(onReloadRequired).toHaveBeenCalledTimes(1);
  });
});

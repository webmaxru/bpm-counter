import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NativeShareButton from './NativeShareButton';
import { isNativeApp, shareBpm } from './nativePlatform';

vi.mock('./nativePlatform', () => ({
  isNativeApp: vi.fn(),
  shareBpm: vi.fn(),
}));

describe('NativeShareButton', () => {
  it('only appears in the native app and shares the result', async () => {
    isNativeApp.mockReturnValue(true);
    shareBpm.mockResolvedValue();

    render(<NativeShareButton bpm="128" mode="tap tempo" />);
    fireEvent.click(screen.getByRole('button', { name: /Share BPM/i }));

    await waitFor(() => {
      expect(shareBpm).toHaveBeenCalledWith({
        bpm: '128',
        mode: 'tap tempo',
      });
    });
  });

  it('does not add native-only UI to the website', () => {
    isNativeApp.mockReturnValue(false);

    render(<NativeShareButton bpm="128" mode="tap tempo" />);

    expect(
      screen.queryByRole('button', { name: /Share BPM/i })
    ).not.toBeInTheDocument();
  });
});

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Metronome, { clampBpm, nextBeatTime } from './Metronome';

vi.mock('react-ga4', () => ({
  default: { event: vi.fn(), initialize: vi.fn(), send: vi.fn() },
}));

class FakeAudioContext {
  static instances = [];

  static initialState = 'running';

  static pendingResume = false;

  constructor() {
    this.currentTime = 0;
    this.state = FakeAudioContext.initialState;
    this.destination = {};
    this.oscillators = [];
    this.resumeCalls = 0;
    this.closed = false;
    FakeAudioContext.instances.push(this);
  }

  createOscillator() {
    const oscillator = {
      type: '',
      frequency: { value: 0 },
      startTime: null,
      stopCalls: [],
      disconnected: false,
      onended: null,
      connect() {},
      disconnect() {
        oscillator.disconnected = true;
      },
      start(time) {
        oscillator.startTime = time;
      },
      stop(...args) {
        oscillator.stopCalls.push(args);
      },
    };

    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    return {
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
      disconnect() {},
    };
  }

  resume() {
    this.resumeCalls += 1;

    if (!FakeAudioContext.pendingResume) {
      this.state = 'running';
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.finishResume = () => {
        this.state = 'running';
        resolve();
      };
    });
  }

  close() {
    this.closed = true;
    this.state = 'closed';
    return Promise.resolve();
  }
}

const originalAudioContext = window.AudioContext;
const originalWebkitAudioContext = window.webkitAudioContext;

function renderMetronome() {
  return render(
    <MemoryRouter>
      <Metronome />
    </MemoryRouter>
  );
}

function latestContext() {
  return FakeAudioContext.instances[FakeAudioContext.instances.length - 1];
}

async function clickStart() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Start metronome' }));
  });
}

function advance(ms) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  FakeAudioContext.instances = [];
  FakeAudioContext.initialState = 'running';
  FakeAudioContext.pendingResume = false;
  window.AudioContext = FakeAudioContext;
  window.webkitAudioContext = FakeAudioContext;
});

afterEach(() => {
  vi.useRealTimers();
  window.AudioContext = originalAudioContext;
  window.webkitAudioContext = originalWebkitAudioContext;
});

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
    renderMetronome();

    fireEvent.click(screen.getByRole('button', { name: '+5' }));

    expect(screen.getByRole('spinbutton', { name: /Tempo in BPM/i })).toHaveValue(
      125
    );
    expect(screen.getByRole('slider', { name: 'Tempo slider' })).toHaveValue(
      '125'
    );
  });

  it('lets the tempo field be cleared and retyped without clamping each keystroke', async () => {
    const user = userEvent.setup();
    renderMetronome();
    const input = screen.getByRole('spinbutton', { name: /Tempo in BPM/i });

    await user.clear(input);

    expect(input).toHaveValue(null);
    expect(screen.getByText('Ready at 120 BPM, 4 beats per bar.')).toBeInTheDocument();

    await user.type(input, '180');

    expect(input).toHaveValue(180);
    expect(screen.getByText('Ready at 180 BPM, 4 beats per bar.')).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Tempo slider' })).toHaveValue('180');
  });

  it('clamps or restores the tempo when the field is committed', async () => {
    const user = userEvent.setup();
    renderMetronome();
    const input = screen.getByRole('spinbutton', { name: /Tempo in BPM/i });

    await user.clear(input);
    await user.type(input, '400');
    expect(input).toHaveValue(400);

    await user.tab();
    expect(input).toHaveValue(300);
    expect(screen.getByText('Ready at 300 BPM, 4 beats per bar.')).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, '{Enter}');
    expect(input).toHaveValue(300);
  });

  it('accepts decimal tempos', async () => {
    const user = userEvent.setup();
    renderMetronome();
    const input = screen.getByRole('spinbutton', { name: /Tempo in BPM/i });

    expect(input).toHaveAttribute('step', '0.1');
    expect(input).toHaveAttribute('inputmode', 'decimal');

    await user.clear(input);
    await user.type(input, '127.5');

    expect(input).toHaveValue(127.5);
    expect(screen.getByText('Ready at 127.5 BPM, 4 beats per bar.')).toBeInTheDocument();
  });

  it('skips beats that expired while the timer was delayed', async () => {
    vi.useFakeTimers();
    renderMetronome();
    await clickStart();
    const context = latestContext();

    context.currentTime = 10;
    advance(25);

    expect(context.oscillators).toHaveLength(1);
    expect(context.oscillators[0].startTime).toBeGreaterThanOrEqual(10);
    expect(context.oscillators[0].startTime).toBeCloseTo(10.05, 5);
    // 20 beats were skipped, so the bar position is back on the accented downbeat.
    expect(context.oscillators[0].frequency.value).toBe(1760);
  });

  it('cancels queued clicks and beat highlights on stop', async () => {
    vi.useFakeTimers();
    const { container } = renderMetronome();
    await clickStart();
    const context = latestContext();

    advance(25);
    expect(context.oscillators).toHaveLength(1);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    });

    const [click] = context.oscillators;
    expect(click.stopCalls).toContainEqual([]);
    expect(click.disconnected).toBe(true);

    context.currentTime = 2;
    advance(2000);

    expect(context.oscillators).toHaveLength(1);
    expect(container.querySelector('.metronome__beat--active')).toBeNull();
    expect(screen.getByRole('button', { name: 'Start metronome' })).toBeInTheDocument();
  });

  it('starts only one scheduler while resume() is pending', async () => {
    vi.useFakeTimers();
    FakeAudioContext.initialState = 'suspended';
    FakeAudioContext.pendingResume = true;
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    renderMetronome();

    await clickStart();
    await clickStart();
    const context = latestContext();

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(context.resumeCalls).toBe(1);

    await act(async () => {
      context.finishResume();
    });

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    });
    const scheduledBeforeStop = context.oscillators.length;
    context.currentTime = 5;
    advance(1000);

    expect(context.oscillators).toHaveLength(scheduledBeforeStop);
    setIntervalSpy.mockRestore();
  });

  it('does not start after unmounting while resume() is pending', async () => {
    vi.useFakeTimers();
    FakeAudioContext.initialState = 'suspended';
    FakeAudioContext.pendingResume = true;
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    const { unmount } = renderMetronome();

    await clickStart();
    const context = latestContext();
    unmount();

    await act(async () => {
      context.finishResume();
    });

    expect(context.closed).toBe(true);
    expect(setIntervalSpy).not.toHaveBeenCalled();
    setIntervalSpy.mockRestore();
  });

  it('keeps the changing beat counter out of the live region', async () => {
    vi.useFakeTimers();
    const { container } = renderMetronome();
    await clickStart();

    advance(25);
    advance(100);

    expect(container.querySelector('.metronome__beat--active')).not.toBeNull();
    const liveRegion = container.querySelector('.metronome [aria-live="polite"]');
    expect(liveRegion).toHaveTextContent('Playing 120 BPM in 4/4.');
    expect(liveRegion.textContent).not.toMatch(/Beat/);
  });
});

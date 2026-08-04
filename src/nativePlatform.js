import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export async function performTapHaptic() {
  if (!isNativeApp()) {
    return;
  }

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    console.warn('Tap haptic feedback was unavailable.', error);
  }
}

export async function shareBpm({ bpm, mode }) {
  if (!isNativeApp()) {
    return;
  }

  await Share.share({
    title: 'BPM Techno result',
    text: `${bpm} BPM measured with BPM Techno${mode ? ` (${mode})` : ''}.`,
    url: 'https://bpmtech.no',
    dialogTitle: 'Share BPM result',
  });
}

export async function openExternalUrl(url) {
  if (!isNativeApp()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  await Browser.open({
    url,
    presentationStyle: 'popover',
  });
}

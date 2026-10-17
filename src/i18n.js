// UI strings for the two site languages. English is the default; Norwegian
// (bokmål) is used on /no pages. Page content lives in src/content.
import { isNorwegianPath } from './content/norwegianPages.js';

export const STRINGS = Object.freeze({
  en: {
    htmlLang: 'en',
    updated: 'Updated',
    faq: 'Frequently asked questions',
    related: 'Related BPM resources',
    // AdSense permits only "Advertisements" or "Sponsored Links" as labels
    // (support.google.com/adsense/answer/1346295).
    adLabel: 'Advertisements',
    toolPlaceholder:
      'The interactive tool loads when JavaScript is available. The complete guide remains readable below.',
    brandDescriptor: 'Free · Offline · BPM tools for DJs',
    primaryNavLabel: 'Primary',
    nav: [
      ['/', 'Listen', true],
      ['/upload', 'Audio file', false],
      ['/tools/tap-tempo', 'Tap tempo', false],
      ['/tools/metronome', 'Metronome', false],
      ['/tools', 'All tools', true],
      ['/bpm', 'BPM chart', true],
      ['/guides', 'Guides', true],
    ],
    languageSwitch: { label: 'Norsk', lang: 'nb', fallback: '/no' },
    popularHeading: 'Popular resources',
    popularLabel: 'Popular BPM resources',
    popular: [
      ['/tools/bpm-to-ms', 'BPM to ms'],
      ['/tools/bars-to-time', 'Bars to seconds'],
      ['/tools/bpm-converter', 'Half/double BPM'],
      ['/guides/genre-bpm-ranges', 'Genre BPM ranges'],
      ['/guides/beatmatching', 'Beatmatching'],
      ['/bpm/128', '128 BPM in ms'],
      ['/guides/bpm-reference-table', 'BPM reference table'],
    ],
    footerCredit: 'Made for DJs in Norway by',
    footerNavLabel: 'Legal and project',
    footerLinks: [
      ['/about', 'About'],
      ['/privacy', 'Privacy'],
      ['/terms', 'Terms'],
      ['/contact', 'Contact'],
      ['/affiliate-disclosure', 'Affiliate disclosure'],
    ],
    tempoInput: 'Tempo in BPM',
    enterPositiveBpm: 'Enter a BPM value greater than zero.',
    noteValues: {
      'Whole note': 'Whole note',
      'Half note': 'Half note',
      'Quarter note': 'Quarter note',
      'Dotted eighth': 'Dotted eighth',
      'Quarter triplet': 'Quarter triplet',
      'Eighth note': 'Eighth note',
      'Sixteenth note': 'Sixteenth note',
    },
    halfTime: 'Half-time',
    original: 'Original',
    doubleTime: 'Double-time',
    tapBeat: 'Tap beat',
    reset: 'Reset',
    tapHint: 'Use the button with a pointer, touch, Enter, or Space.',
    recentTaps: (count, max) => `${count} of ${max} recent taps`,
    metronome: {
      slider: 'Tempo slider',
      adjust: 'Adjust tempo',
      beatsPerBar: 'Beats per bar',
      stop: 'Stop',
      start: 'Start metronome',
      unsupported:
        'This browser does not support the Web Audio API, so the metronome cannot play clicks here.',
      playing: (bpm, beats) => `Playing ${bpm} BPM in ${beats}/4.`,
      ready: (bpm, beats) => `Ready at ${bpm} BPM, ${beats} beats per bar.`,
    },
    home: {
      title: 'Find the BPM',
      intro: 'Point your device toward the speakers and let the beat settle.',
      hint: 'Start listening, then allow a few seconds for the tempo to stabilize.',
      start: 'Start listening',
      permission: 'Microphone permission is requested when you start.',
      privacyStrong: 'No audio is sent to any server.',
      privacyRest: 'Analysis stays on this device.',
      locked: 'Tempo locked',
      analyzing: 'Analyzing the beat',
      listening: 'Listening. Wait...',
      last: 'Last: ',
      startOver: 'Start over',
      hideSample: 'Hide sample file',
      trySample: 'Try a 120 BPM sample',
      sampleHint:
        'Play the sample through a speaker. Detection usually stabilizes within 5–30 seconds at 120 BPM.',
      spectrum: 'Live audio spectrum',
      guideTitle: 'Measure and understand tempo',
    },
  },
  nb: {
    htmlLang: 'nb',
    updated: 'Oppdatert',
    faq: 'Ofte stilte spørsmål',
    related: 'Relaterte BPM-sider',
    // The Norwegian AdSense policy page lists «Annonser» or «Sponsede linker»
    // as the permitted labels (support.google.com/adsense/answer/1346295?hl=no).
    adLabel: 'Annonser',
    toolPlaceholder:
      'Verktøyet lastes når JavaScript er tilgjengelig. Hele veiledningen kan leses nedenfor.',
    brandDescriptor: 'Gratis · Virker uten nett · BPM-verktøy for DJ-er',
    primaryNavLabel: 'Hovedmeny',
    nav: [
      ['/no', 'Lytt', true],
      ['/no/verktoy/tap-tempo', 'Tap tempo', false],
      ['/no/verktoy/metronom', 'Metronom', false],
      ['/no/verktoy/bpm-til-ms', 'BPM til ms', false],
      ['/no/verktoy', 'Alle verktøy', true],
      ['/bpm', 'BPM-tabell (engelsk)', true],
    ],
    languageSwitch: { label: 'English', lang: 'en', fallback: '/' },
    popularHeading: 'Populært',
    popularLabel: 'Populære BPM-sider',
    popular: [
      ['/no/verktoy/bpm-til-ms', 'BPM til ms'],
      ['/no/verktoy/bpm-konverterer', 'Halv og dobbel takt'],
      ['/no/verktoy/metronom', 'Metronom'],
      ['/bpm/128', '128 BPM (engelsk)'],
      ['/guides/genre-bpm-ranges', 'BPM per sjanger (engelsk)'],
    ],
    footerCredit: 'Laget for DJ-er i Norge av',
    footerNavLabel: 'Om nettstedet',
    footerLinks: [
      ['/about', 'Om'],
      ['/privacy', 'Personvern'],
      ['/terms', 'Vilkår'],
      ['/contact', 'Kontakt'],
      ['/affiliate-disclosure', 'Affiliate-lenker'],
    ],
    tempoInput: 'Tempo i BPM',
    enterPositiveBpm: 'Skriv inn et BPM-tall større enn null.',
    noteValues: {
      'Whole note': 'Helnote',
      'Half note': 'Halvnote',
      'Quarter note': 'Fjerdedelsnote',
      'Dotted eighth': 'Punktert åttendedel',
      'Quarter triplet': 'Fjerdedelstriol',
      'Eighth note': 'Åttendedelsnote',
      'Sixteenth note': 'Sekstendedelsnote',
    },
    halfTime: 'Halv takt',
    original: 'Opprinnelig',
    doubleTime: 'Dobbel takt',
    tapBeat: 'Trykk i takt',
    reset: 'Nullstill',
    tapHint: 'Bruk knappen med mus, berøring, Enter eller mellomrom.',
    recentTaps: (count, max) => `${count} av ${max} siste trykk`,
    metronome: {
      slider: 'Tempo-slider',
      adjust: 'Juster tempo',
      beatsPerBar: 'Slag per takt',
      stop: 'Stopp',
      start: 'Start metronom',
      unsupported:
        'Denne nettleseren støtter ikke Web Audio API, så metronomen kan ikke spille klikk her.',
      playing: (bpm, beats) => `Spiller ${bpm} BPM i ${beats}/4.`,
      ready: (bpm, beats) => `Klar på ${bpm} BPM, ${beats} slag per takt.`,
    },
    home: {
      title: 'Finn BPM',
      intro: 'Rett enheten mot høyttalerne og la beatet stabilisere seg.',
      hint: 'Start lyttingen og gi tempoet noen sekunder til å stabilisere seg.',
      start: 'Start lytting',
      permission: 'Du blir bedt om tilgang til mikrofonen når du starter.',
      privacyStrong: 'Ingen lyd sendes til noen server.',
      privacyRest: 'Analysen skjer på denne enheten.',
      locked: 'Tempoet er funnet',
      analyzing: 'Analyserer beatet',
      listening: 'Lytter. Vent litt …',
      last: 'Forrige: ',
      startOver: 'Start på nytt',
      hideSample: 'Skjul eksempelfilen',
      trySample: 'Prøv et eksempel på 120 BPM',
      sampleHint:
        'Spill eksempelet gjennom en høyttaler. Ved 120 BPM stabiliserer målingen seg vanligvis i løpet av 5–30 sekunder.',
      spectrum: 'Lydspekter i sanntid',
      guideTitle: 'Mål og forstå tempo',
    },
  },
});

export function getLocaleForPath(path) {
  return isNorwegianPath(path) ? 'nb' : 'en';
}

export function getStrings(locale) {
  return STRINGS[locale] ?? STRINGS.en;
}

export function getPageStrings(page) {
  return getStrings(page?.lang === 'nb' ? 'nb' : 'en');
}

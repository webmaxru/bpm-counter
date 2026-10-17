// Programmatic per-tempo landing pages (/bpm/60 … /bpm/200) and the /bpm hub.
//
// Every number on a tempo page is computed from the tempo, and the prose is
// assembled from facts that differ between tempos (whole-millisecond beats,
// phrase lengths, where the tempo sits inside each genre range, which
// half-time/double-time readings land in another genre, pitch-fader reach),
// so no two pages say the same thing with one number swapped.

export const TEMPO_MIN = 60;
export const TEMPO_MAX = 200;
export const TEMPO_HUB_PATH = '/bpm';

const tempoUpdatedDate = '2026-10-17';

// Typical ranges as practised by DJs and producers. They overlap on purpose
// and describe common practice, not a formal classification. Ranges that
// already appear in the genre guide (/guides/genre-bpm-ranges) are kept
// identical so the site does not contradict itself.
export const GENRE_RANGES = Object.freeze([
  { name: 'ambient/downtempo', min: 60, max: 100, note: 'beatless ambient may not have a useful BPM at all' },
  { name: 'hip-hop', min: 70, max: 100, note: 'boom-bap often sits around 85–95' },
  { name: 'reggae/dub', min: 70, max: 100, note: 'the off-beat skank can make the pulse feel faster than it is' },
  { name: 'reggaeton/dembow', min: 88, max: 100, note: 'the dembow rhythm repeats every beat, so the tempo is easy to hear' },
  { name: 'pop', min: 90, max: 130, note: 'a wide band; the genre is defined by songwriting, not tempo' },
  { name: 'disco', min: 105, max: 130, note: 'steady four-on-the-floor sections are easy to count' },
  { name: 'house', min: 118, max: 130, note: 'most club house clusters around 120–128' },
  { name: 'UK garage/breakbeat', min: 125, max: 140, note: 'shuffled and broken drums can make the count ambiguous' },
  { name: 'techno', min: 125, max: 150, note: 'from restrained 125 to fast, hard styles near 150' },
  { name: 'trance', min: 128, max: 145, note: 'a regular kick usually gives a clear pulse' },
  { name: 'dubstep', min: 135, max: 145, note: 'usually counted around 140 but felt at half-time, near 70' },
  { name: 'hardstyle', min: 145, max: 160, note: 'most releases sit near 150' },
  { name: 'footwork/juke', min: 155, max: 165, note: 'built around 160 with half-time and triplet patterns' },
  { name: 'drum and bass', min: 160, max: 180, note: 'modern releases mostly sit at 170–176; often felt at half-time' },
  { name: 'hardcore/gabber', min: 160, max: 200, note: 'speedcore and some gabber go well beyond 200' },
]);

const DELAY_NOTES = Object.freeze([
  ['1/1 (one 4/4 bar)', 4],
  ['1/2', 2],
  ['1/4 (one beat)', 1],
  ['1/8', 0.5],
  ['1/16', 0.25],
  ['1/32', 0.125],
]);

const PHRASES = Object.freeze([
  ['1 beat', 1],
  ['1 bar (4 beats)', 4],
  ['4 bars', 16],
  ['8 bars', 32],
  ['16 bars', 64],
  ['32 bars', 128],
  ['64 bars', 256],
]);

export function roundTo(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function formatMs(milliseconds) {
  return `${roundTo(milliseconds, 2)} ms`;
}

export function formatDuration(seconds) {
  if (seconds < 10) {
    return `${roundTo(seconds, 3)} s`;
  }
  if (seconds < 60) {
    return `${roundTo(seconds, 2)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = roundTo(seconds - minutes * 60, 1);
  const restText = rest < 10 ? `0${rest}` : `${rest}`;

  return `${minutes}:${restText.includes('.') ? restText : `${restText}.0`} min`;
}

export function isValidTempo(value) {
  return (
    Number.isInteger(value) && value >= TEMPO_MIN && value <= TEMPO_MAX
  );
}

export function parseTempoSlug(slug) {
  if (!/^\d{2,3}$/.test(String(slug ?? ''))) {
    return null;
  }

  const tempo = Number(slug);
  return isValidTempo(tempo) ? tempo : null;
}

export function getTempoPath(bpm) {
  return `${TEMPO_HUB_PATH}/${bpm}`;
}

export function getTempoFacts(bpm) {
  const beatMs = 60000 / bpm;

  return {
    bpm,
    beatMs,
    barMs: beatMs * 4,
    beatHz: bpm / 60,
    barsPerMinute: bpm / 4,
    wholeMsBeat: Number.isInteger(roundTo(beatMs, 6)),
    halfTime: bpm / 2,
    doubleTime: bpm * 2,
  };
}

export function getDelayRows(bpm) {
  const beatMs = 60000 / bpm;

  return DELAY_NOTES.map(([label, beats]) => {
    const straight = beatMs * beats;

    return {
      label,
      straight,
      dotted: straight * 1.5,
      triplet: (straight * 2) / 3,
      hertz: 1000 / straight,
    };
  });
}

function describePosition(bpm, range) {
  const span = range.max - range.min;
  const position = (bpm - range.min) / span;

  if (bpm === range.min) {
    return 'at the bottom of';
  }
  if (bpm === range.max) {
    return 'at the top of';
  }
  if (position < 0.3) {
    return 'near the low end of';
  }
  if (position > 0.7) {
    return 'near the upper end of';
  }
  return 'in the middle of';
}

export function getGenreMatches(bpm) {
  const inRange = (value, range) => value >= range.min && value <= range.max;

  return {
    direct: GENRE_RANGES.filter((range) => inRange(bpm, range)).map(
      (range) => ({ ...range, position: describePosition(bpm, range) })
    ),
    asDoubleTime: GENRE_RANGES.filter((range) => inRange(bpm * 2, range)),
    asHalfTime: GENRE_RANGES.filter((range) => inRange(bpm / 2, range)),
  };
}

export function getPitchShift(fromBpm, toBpm) {
  const ratio = toBpm / fromBpm;

  return {
    percent: (ratio - 1) * 100,
    semitones: 12 * Math.log2(ratio),
  };
}

function signed(value, digits = 2) {
  const rounded = roundTo(value, digits);
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : '±'}${Math.abs(rounded)}`;
}

function listWords(items) {
  if (items.length <= 1) {
    return items.join('');
  }
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function tempoFeel(bpm) {
  if (bpm < 76) {
    return 'a slow tempo; many listeners will also hear it at double-time';
  }
  if (bpm < 100) {
    return 'a relaxed, mid-slow tempo';
  }
  if (bpm < 118) {
    return 'a moderate tempo, a little below the usual club range';
  }
  if (bpm <= 135) {
    return 'squarely in the most common club and dance-music range';
  }
  if (bpm <= 155) {
    return 'in the up-tempo, high-energy range';
  }
  if (bpm < 180) {
    return 'a fast tempo that is often felt at half-time';
  }
  return 'a very fast tempo, usually heard at half-time unless the style is hardcore';
}

export function getNeighbourTempos(bpm) {
  const candidates = [bpm - 2, bpm - 1, bpm + 1, bpm + 2];
  const roundDown = Math.floor((bpm - 1) / 5) * 5;
  const roundUp = Math.ceil((bpm + 1) / 5) * 5;
  candidates.push(roundDown, roundUp);

  return [...new Set(candidates)]
    .filter((value) => value !== bpm && isValidTempo(value))
    .sort((a, b) => a - b);
}

function beatSentence(facts) {
  const { bpm, beatMs } = facts;
  const parts = [
    `At ${bpm} BPM one beat lasts ${formatMs(beatMs)} and a 4/4 bar lasts ${formatDuration(facts.barMs / 1000)}.`,
  ];

  if (facts.wholeMsBeat) {
    parts.push(
      `That beat is a whole number of milliseconds, so delay and gate times can be typed in exactly, without rounding.`
    );
  } else {
    parts.push(
      `The beat is not a whole number of milliseconds, so round to the nearest 0.1 ms when you type times in by hand, or use your plugin's tempo sync.`
    );
  }

  if (bpm % 60 === 0) {
    parts.push(
      `${bpm} BPM is exactly ${bpm / 60} beat${bpm === 60 ? '' : 's'} per second, which makes it a handy reference for counting along with a clock.`
    );
  } else {
    parts.push(
      `That is ${roundTo(facts.beatHz, 3)} beats per second, or ${roundTo(facts.barsPerMinute, 2)} bars of 4/4 per minute.`
    );
  }

  return parts.join(' ');
}

function phraseSentence(bpm) {
  const sixteen = (64 * 60) / bpm;
  const thirtyTwo = (128 * 60) / bpm;
  const atReference = (64 * 60) / 120;
  const difference = roundTo(sixteen - atReference, 2);
  const comparison =
    bpm === 120
      ? '120 BPM is the reference point many producers use: 16 bars last exactly 32 seconds.'
      : `That is ${Math.abs(difference)} s ${difference < 0 ? 'shorter' : 'longer'} than the same 16 bars at 120 BPM.`;
  const sixMinuteBars = Math.round((6 * bpm) / 4);

  return `Dance tracks are usually arranged in 8-, 16- and 32-bar phrases. At ${bpm} BPM a 16-bar phrase takes ${formatDuration(sixteen)} and a 32-bar intro or outro takes ${formatDuration(thirtyTwo)}. ${comparison} A six-minute track at this tempo contains about ${sixMinuteBars} bars.`;
}

function genreParagraphs(bpm) {
  const { direct, asDoubleTime, asHalfTime } = getGenreMatches(bpm);
  const paragraphs = [];

  if (direct.length) {
    const descriptions = direct.map(
      (range) => `${range.position} the ${range.name} range (${range.min}–${range.max})`
    );
    paragraphs.push(
      `${bpm} BPM is ${tempoFeel(bpm)}. It sits ${listWords(descriptions)}.`
    );
  } else {
    paragraphs.push(
      `${bpm} BPM is ${tempoFeel(bpm)}. It falls between the usual genre ranges, which is common for live recordings, film music and tracks in transition between styles.`
    );
  }

  const readings = [];
  if (asDoubleTime.length) {
    readings.push(
      `counted at double-time (${bpm * 2} BPM) it matches ${listWords(asDoubleTime.map((range) => range.name))}`
    );
  }
  if (asHalfTime.length) {
    readings.push(
      `heard at half-time (${roundTo(bpm / 2, 1)} BPM) it lines up with ${listWords(asHalfTime.map((range) => range.name))}`
    );
  }
  if (readings.length) {
    paragraphs.push(
      `${capitalize(listWords(readings))}. A detector or a tag in your library may report either reading, so check by ear which one the drums suggest.`
    );
  }

  paragraphs.push(
    'These ranges are common practice rather than rules: genre is decided by rhythm, sound and scene as much as by tempo, and plenty of tracks sit outside the usual numbers.'
  );

  return { paragraphs, direct };
}

function mixingRows(bpm) {
  const offsets = [-6, -4, -2, -1, 1, 2, 4, 6];

  return offsets
    .map((offset) => bpm + offset)
    .filter((target) => target > 0)
    .map((target) => {
      const shift = getPitchShift(target, bpm);
      return [
        `${target} BPM`,
        `${signed(shift.percent)} %`,
        `${signed(shift.semitones)} st`,
      ];
    });
}

function buildFaqs(bpm, facts, delayRows, direct) {
  const eighth = delayRows.find((row) => row.label === '1/8');
  const quarter = delayRows.find((row) => row.label.startsWith('1/4'));
  const genreAnswer = direct.length
    ? `${capitalize(listWords(direct.map((range) => range.name)))} commonly use${direct.length === 1 ? 's' : ''} ${bpm} BPM. Genre ranges overlap, so the drum pattern and sound decide the style more than the number does.`
    : `${bpm} BPM is outside the most common genre ranges. At half-time or double-time it may still match a style; see the genre section on this page.`;

  return [
    {
      question: `How many milliseconds is one beat at ${bpm} BPM?`,
      answer: `One beat (a quarter note) at ${bpm} BPM is 60,000 ÷ ${bpm} = ${formatMs(facts.beatMs)}. A 4/4 bar is four beats, ${formatMs(facts.barMs)}.`,
    },
    {
      question: `What is the dotted eighth delay time at ${bpm} BPM?`,
      answer: `A dotted 1/8 delay at ${bpm} BPM is ${formatMs(eighth.dotted)}: an eighth note (${formatMs(eighth.straight)}) multiplied by 1.5. A straight quarter-note delay is ${formatMs(quarter.straight)} and a quarter-note triplet is ${formatMs(quarter.triplet)}.`,
    },
    {
      question: `What genre is ${bpm} BPM?`,
      answer: genreAnswer,
    },
    {
      question: `What is ${bpm} BPM in Hz?`,
      answer: `${bpm} BPM is ${roundTo(facts.beatHz, 4)} Hz when one cycle equals one beat. An LFO synced to one bar runs at ${roundTo(facts.beatHz / 4, 4)} Hz, and one synced to sixteenth notes at ${roundTo(facts.beatHz * 4, 3)} Hz.`,
    },
  ];
}

export function createTempoPage(bpm) {
  if (!isValidTempo(bpm)) {
    throw new Error(`Tempo page out of range: ${bpm}`);
  }

  const facts = getTempoFacts(bpm);
  const delayRows = getDelayRows(bpm);
  const { paragraphs: genreText, direct } = genreParagraphs(bpm);
  const neighbours = getNeighbourTempos(bpm);
  const genreShort = direct.length
    ? listWords(direct.slice(0, 2).map((range) => range.name))
    : 'half- and double-time readings';
  const sixtyFourth = facts.beatMs / 16;
  const thirtySecond = facts.beatMs / 8;

  const relatedTempoLinks = [];
  const halfLabel = roundTo(facts.halfTime, 1);
  if (isValidTempo(facts.halfTime)) {
    relatedTempoLinks.push({
      href: getTempoPath(facts.halfTime),
      label: `Half-time: ${facts.halfTime} BPM`,
    });
  } else if (facts.halfTime >= TEMPO_MIN) {
    [Math.floor(facts.halfTime), Math.ceil(facts.halfTime)].forEach((value) => {
      relatedTempoLinks.push({
        href: getTempoPath(value),
        label: `Near half-time: ${value} BPM`,
      });
    });
  }
  if (isValidTempo(facts.doubleTime)) {
    relatedTempoLinks.push({
      href: getTempoPath(facts.doubleTime),
      label: `Double-time: ${facts.doubleTime} BPM`,
    });
  }
  neighbours.forEach((value) => {
    relatedTempoLinks.push({ href: getTempoPath(value), label: `${value} BPM` });
  });

  const halfDoubleText = [
    `Half-time of ${bpm} BPM is ${halfLabel} BPM and double-time is ${facts.doubleTime} BPM.`,
  ];
  const outside = [];
  if (facts.halfTime < TEMPO_MIN) {
    outside.push(`${halfLabel} BPM`);
  }
  if (facts.doubleTime > TEMPO_MAX) {
    outside.push(`${facts.doubleTime} BPM`);
  }
  if (outside.length) {
    halfDoubleText.push(
      `${listWords(outside)} ${outside.length === 1 ? 'is' : 'are'} outside the 60–200 range of these pages; the half/double-time converter works with any value.`
    );
    relatedTempoLinks.push({ href: '/tools/bpm-converter', label: 'Half/double-time converter' });
  }
  if (!Number.isInteger(facts.halfTime) && facts.halfTime >= TEMPO_MIN) {
    halfDoubleText.push(
      `${halfLabel} BPM falls between two whole tempos, so the nearest pages, ${Math.floor(facts.halfTime)} and ${Math.ceil(facts.halfTime)} BPM, are linked instead.`
    );
  }
  halfDoubleText.push(
    `Each 1 BPM step at this tempo changes the beat by about ${roundTo(60000 / bpm - 60000 / (bpm + 1), 2)} ms, so neighbouring tempos are close enough to beatmatch with a small pitch move.`
  );
  relatedTempoLinks.push({ href: TEMPO_HUB_PATH, label: 'All tempos from 60 to 200 BPM' });

  return {
    id: `tempo-${bpm}`,
    path: getTempoPath(bpm),
    category: 'tempo',
    bpm,
    structuredDataType: 'WebPage',
    title: `${bpm} BPM: ms per Beat, Delay Times & Genres | BPM Techno`,
    description: `${bpm} BPM = ${formatMs(facts.beatMs)} per beat, ${formatDuration(facts.barMs / 1000)} per bar, ${roundTo(facts.beatHz, 3)} Hz. Dotted and triplet delays, reverb times, genres (${genreShort}) and a ${bpm} BPM metronome.`,
    heading: `${bpm} BPM`,
    lede: `${bpm} beats per minute is one beat every ${formatMs(facts.beatMs)}. Below: bar and phrase lengths, delay and reverb times, LFO rates, the genres that use this tempo, and the pitch change needed to mix in from nearby tempos. Start the metronome or tap along to a track to check it is really ${bpm}.`,
    updatedDate: tempoUpdatedDate,
    sections: [
      {
        heading: `Beat, bar and phrase lengths at ${bpm} BPM`,
        paragraphs: [beatSentence(facts), phraseSentence(bpm)],
        table: {
          headers: ['Length', 'Time', 'Milliseconds'],
          rows: PHRASES.map(([label, beats]) => [
            label,
            formatDuration((facts.beatMs * beats) / 1000),
            formatMs(facts.beatMs * beats),
          ]),
        },
      },
      {
        heading: `Delay times at ${bpm} BPM`,
        paragraphs: [
          `Straight values follow the beat; dotted values are 1.5 times as long and triplets are two-thirds as long. At ${bpm} BPM the popular dotted-eighth delay is ${formatMs(delayRows[3].dotted)} and a quarter-note slapback is ${formatMs(delayRows[2].straight)}. The Hz column is the matching rate for an LFO, tremolo or auto-pan synced to the straight note.`,
        ],
        table: {
          headers: ['Note', 'Straight', 'Dotted', 'Triplet', 'Rate (straight)'],
          rows: delayRows.map((row) => [
            row.label,
            formatMs(row.straight),
            formatMs(row.dotted),
            formatMs(row.triplet),
            `${roundTo(row.hertz, 3)} Hz`,
          ]),
        },
      },
      {
        heading: `Reverb times at ${bpm} BPM`,
        paragraphs: [
          `A common way to keep a reverb in time is to tie its pre-delay to a short note value and let the tail fade within a longer one. At ${bpm} BPM a 1/64-note pre-delay is ${formatMs(sixtyFourth)} and a 1/32-note pre-delay is ${formatMs(thirtySecond)}.`,
          'The decay control on most reverbs is RT60, the time it takes the tail to fall by 60 dB, so the audible tail ends earlier than the number shown. Treat these values as starting points and adjust by ear.',
        ],
        table: {
          headers: ['Reverb character', 'Pre-delay', 'Decay (RT60)'],
          rows: [
            ['Tight room on drums', formatMs(sixtyFourth), formatMs(facts.beatMs)],
            ['Medium plate on vocals', formatMs(thirtySecond), formatMs(facts.beatMs * 2)],
            ['Large hall or pad wash', formatMs(thirtySecond), formatMs(facts.barMs)],
            ['Ambient tail over two bars', formatMs(facts.beatMs / 4), formatMs(facts.barMs * 2)],
          ],
        },
      },
      {
        heading: `Genres at ${bpm} BPM`,
        paragraphs: genreText,
        bullets: direct.map(
          (range) => `${capitalize(range.name)}: typically ${range.min}–${range.max} BPM — ${range.note}.`
        ),
      },
      {
        heading: `Mixing into ${bpm} BPM`,
        paragraphs: [
          `To bring a track at another tempo up or down to ${bpm} BPM, move its pitch fader by the percentage below. Without key lock the key moves too, by the number of semitones shown; about 6 % is one semitone, so changes beyond that are where key lock (master tempo) starts to matter.`,
          `A ±8 % pitch fader on a track at ${bpm} BPM reaches ${roundTo(bpm * 0.92, 1)}–${roundTo(bpm * 1.08, 1)} BPM; a ±16 % range reaches ${roundTo(bpm * 0.84, 1)}–${roundTo(bpm * 1.16, 1)} BPM.`,
        ],
        table: {
          headers: ['Track tempo', 'Pitch change to reach ' + bpm, 'Key shift without key lock'],
          rows: mixingRows(bpm),
        },
      },
      {
        heading: 'Half-time, double-time and nearby tempos',
        paragraphs: halfDoubleText,
        links: relatedTempoLinks,
      },
    ],
    faqs: buildFaqs(bpm, facts, delayRows, direct),
    relatedPageIds: ['metronome', 'bpm-to-ms', 'genre-guide', 'bpm-to-hz'],
  };
}

const HUB_BANDS = Object.freeze([
  {
    min: 60,
    max: 89,
    heading: 'Slow tempos: 60 to 89 BPM',
    text: 'Ballads, ambient, downtempo, reggae, dub and much hip-hop live here. Many of these tempos are also counted at double-time, so 87 BPM hip-hop and 174 BPM drum and bass share the same grid.',
  },
  {
    min: 90,
    max: 117,
    heading: 'Mid tempos: 90 to 117 BPM',
    text: 'Reggaeton, a lot of pop, slower disco and nu-disco, and warm-up sets. These tempos are comfortable to dance to without the push of the club range.',
  },
  {
    min: 118,
    max: 135,
    heading: 'Club tempos: 118 to 135 BPM',
    text: 'The core range for house, disco edits, tech house, most techno and trance. Small differences matter here: 2 BPM is roughly a 1.6 % pitch change.',
  },
  {
    min: 136,
    max: 159,
    heading: 'Up-tempo: 136 to 159 BPM',
    text: 'Faster techno and trance, dubstep around 140 (felt at half-time), and hardstyle near 150.',
  },
  {
    min: 160,
    max: 200,
    heading: 'Fast tempos: 160 to 200 BPM',
    text: 'Drum and bass, jungle, footwork and hardcore. Most of these are felt at half-time, so a detector may report 85 instead of 170.',
  },
]);

export function createTempoHubPage() {
  return {
    id: 'bpm-hub',
    path: TEMPO_HUB_PATH,
    category: 'hub',
    structuredDataType: 'CollectionPage',
    title: 'BPM Chart 60–200: ms per Beat, Delay Times by Tempo | BPM Techno',
    description:
      'Pick any tempo from 60 to 200 BPM for its beat and bar length in ms, straight, dotted and triplet delay times, reverb settings, LFO rates, typical genres and a metronome.',
    heading: 'Every tempo from 60 to 200 BPM',
    lede:
      'Each tempo has its own page with the numbers you need while producing or mixing: milliseconds per beat and bar, delay and reverb times, Hz, the genres that use it, and a metronome set to that tempo.',
    updatedDate: tempoUpdatedDate,
    sections: HUB_BANDS.map((band) => ({
      heading: band.heading,
      paragraphs: [band.text],
      links: Array.from({ length: band.max - band.min + 1 }, (_, index) => {
        const bpm = band.min + index;
        return { href: getTempoPath(bpm), label: `${bpm}` };
      }),
      linkGrid: true,
    })),
    relatedPageIds: ['bpm-reference-table', 'bpm-to-ms', 'genre-guide'],
  };
}

export const TEMPO_ROUTES = Object.freeze(
  Array.from({ length: TEMPO_MAX - TEMPO_MIN + 1 }, (_, index) =>
    getTempoPath(TEMPO_MIN + index)
  )
);

const tempoPageCache = new Map();

/** Tempo pages are generated on first use so the app does not build 141 pages at startup. */
export function getTempoPage(bpm) {
  if (!isValidTempo(bpm)) {
    return null;
  }
  if (!tempoPageCache.has(bpm)) {
    tempoPageCache.set(bpm, Object.freeze(createTempoPage(bpm)));
  }
  return tempoPageCache.get(bpm);
}

export function getTempoPageByPath(path) {
  const match = /^\/bpm\/(\d{2,3})$/.exec(String(path ?? ''));
  return match ? getTempoPage(parseTempoSlug(match[1])) : null;
}

export function getAllTempoPages() {
  return Array.from({ length: TEMPO_MAX - TEMPO_MIN + 1 }, (_, index) =>
    getTempoPage(TEMPO_MIN + index)
  );
}

export const tempoHubPage = Object.freeze(createTempoHubPage());

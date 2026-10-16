const growthUpdatedDate = '2026-10-16';

const REFERENCE_TEMPOS = Object.freeze([
  60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 118, 120, 122, 124, 125,
  126, 128, 130, 132, 135, 138, 140, 145, 150, 155, 160, 165, 170, 172, 174,
  175, 180, 185, 190, 200,
]);

function formatSeconds(seconds) {
  if (seconds < 60) {
    return `${(Math.round(seconds * 100) / 100).toString()} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = (seconds - minutes * 60).toFixed(1).padStart(4, '0');

  return `${minutes}:${rest}`;
}

export function createTempoReferenceRows(tempos = REFERENCE_TEMPOS) {
  return tempos.map((bpm) => {
    const beatSeconds = 60 / bpm;

    return [
      `${bpm}`,
      `${(Math.round(beatSeconds * 100000) / 100).toString()} ms`,
      `${(Math.round(beatSeconds * 4 * 1000) / 1000).toString()} s`,
      formatSeconds(beatSeconds * 4 * 16),
      formatSeconds(beatSeconds * 4 * 32),
      `${(Math.round((bpm / 60) * 1000) / 1000).toString()} Hz`,
      `${bpm / 2} / ${bpm * 2}`,
    ];
  });
}

export const growthPages = Object.freeze([
  {
    id: 'tools-hub',
    path: '/tools',
    category: 'hub',
    structuredDataType: 'CollectionPage',
    title: 'Free BPM Tools for DJs and Producers | BPM Techno',
    description:
      'All BPM Techno tools in one place: real-time BPM counter, audio file analysis, tap tempo, metronome, BPM to ms, BPM to Hz, bars to seconds, pitch range and half/double-time converter.',
    heading: 'BPM tools',
    lede:
      'Every tool on BPM Techno runs inside your browser, works offline once loaded, and never uploads your audio. Pick the one that matches the question you have right now.',
    updatedDate: growthUpdatedDate,
    sections: [
      {
        heading: 'Find the tempo of music',
        paragraphs: [
          'Start here when you do not know the BPM yet. The live counter listens through the microphone, the file analyzer reads a track from your device or a direct URL, and tap tempo turns your own taps into a tempo reading.',
        ],
        links: [
          { href: '/', label: 'Real-time BPM counter (microphone)' },
          { href: '/upload', label: 'Analyze BPM from an audio file or URL' },
          { href: '/tools/tap-tempo', label: 'Tap tempo BPM counter' },
        ],
      },
      {
        heading: 'Convert a tempo you already know',
        paragraphs: [
          'Once you have a BPM, these calculators turn it into the numbers you type into a delay, an LFO, a sampler or a set plan: milliseconds, hertz, seconds per bar and the length of a 16- or 32-bar phrase.',
        ],
        links: [
          { href: '/tools/bpm-to-ms', label: 'BPM to milliseconds (delay times)' },
          { href: '/tools/bpm-to-hz', label: 'BPM to Hz (LFO and modulation rates)' },
          { href: '/tools/bars-to-time', label: 'Bars to seconds and seconds to bars' },
          { href: '/tools/bpm-converter', label: 'Half-time and double-time converter' },
        ],
      },
      {
        heading: 'Practice and mix',
        paragraphs: [
          'The metronome gives you a clean click for practicing beatmatching or counting phrases, and the pitch range calculator shows how far a pitch fader can take a track and what happens to its key on the way.',
        ],
        links: [
          { href: '/tools/metronome', label: 'Online metronome (30 to 300 BPM)' },
          { href: '/tools/pitch-range', label: 'Pitch range and key change calculator' },
          { href: '/guides', label: 'Guides: beatmatching, genre tempos, how detection works' },
        ],
      },
    ],
    relatedPageIds: ['home', 'guides-hub', 'metronome'],
  },
  {
    id: 'guides-hub',
    path: '/guides',
    category: 'hub',
    structuredDataType: 'CollectionPage',
    title: 'BPM and Beatmatching Guides for DJs | BPM Techno',
    description:
      'Short, practical guides on tempo: how BPM detection works, typical BPM by genre, beatmatching basics, analyzing audio URLs and a BPM reference table for ms, Hz and bar lengths.',
    heading: 'BPM guides',
    lede:
      'Plain explanations of the tempo questions DJs and producers actually run into, written to be read in a few minutes and used right away with the tools.',
    updatedDate: growthUpdatedDate,
    sections: [
      {
        heading: 'Understanding tempo',
        paragraphs: [
          'These guides explain what a BPM number does and does not tell you, why detectors sometimes report half or double the tempo you hear, and which ranges each genre tends to live in.',
        ],
        links: [
          { href: '/guides/how-bpm-detection-works', label: 'How browser BPM detection works' },
          { href: '/guides/genre-bpm-ranges', label: 'Typical BPM ranges by music genre' },
          { href: '/guides/bpm-reference-table', label: 'BPM reference table: ms, Hz and bar lengths' },
        ],
      },
      {
        heading: 'Using the tools well',
        paragraphs: [
          'Step-by-step notes on getting a stable reading from the live counter and on analyzing a file or a direct audio link without uploading anything.',
        ],
        links: [
          { href: '/guides/real-time-bpm-counter', label: 'How to use a real-time BPM counter' },
          { href: '/guides/analyze-audio-url', label: 'How to analyze BPM from an audio URL' },
        ],
      },
      {
        heading: 'Mixing',
        paragraphs: [
          'Beatmatching by ear is still the fastest way to understand what sync is doing for you. The beginner guide covers the method, and the pitch range calculator shows the limits of the fader.',
        ],
        links: [
          { href: '/guides/beatmatching', label: 'Beatmatching guide for beginners' },
          { href: '/tools/pitch-range', label: 'Pitch range and key change calculator' },
        ],
      },
    ],
    relatedPageIds: ['tools-hub', 'beatmatching-guide', 'genre-guide'],
  },
  {
    id: 'bars-to-time',
    path: '/tools/bars-to-time',
    category: 'tool',
    structuredDataType: 'WebApplication',
    title: 'Bars to Seconds Calculator: How Long Is 16 or 32 Bars at Any BPM | BPM Techno',
    description:
      'Convert bars to seconds and seconds to bars at any tempo. See how long one beat, one bar, 16 bars and 32 bars last at 128 BPM, 140 BPM, 174 BPM or any BPM you enter.',
    heading: 'Bars to seconds calculator',
    lede:
      'Enter a tempo and the calculator shows how long a beat, a bar and a 16- or 32-bar phrase last, and how many bars fit into a given number of seconds. Useful for planning transitions, timing intros and building edits.',
    updatedDate: growthUpdatedDate,
    sections: [
      {
        heading: 'How the calculation works',
        paragraphs: [
          'One beat lasts 60 divided by the BPM seconds. At 120 BPM a beat is exactly 0.5 seconds, so a 4/4 bar is 2 seconds and 16 bars take 32 seconds. At 128 BPM a beat is 0.46875 seconds, a bar is 1.875 seconds and 16 bars come to exactly 30 seconds, which is why so many house and techno phrases line up neatly with half-minute marks.',
          'The reverse direction divides a duration by the bar length. Sixty seconds at 174 BPM contains about 43.5 bars, so a one-minute intro in drum and bass is not a round number of phrases; a 32-bar intro at that tempo lasts about 44 seconds.',
        ],
        steps: [
          'Type the tempo of the track. The live counter, the file analyzer or tap tempo can give you this number.',
          'Set beats per bar. Almost all club music is 4, waltz-time material is 3 and some drum and bass edits use 2 if you count half-time.',
          'Read the beat, bar and phrase durations, or enter a custom bar count.',
          'Enter a duration in seconds to see how many bars and beats it holds at that tempo.',
        ],
      },
      {
        heading: 'Why DJs care about phrase lengths',
        paragraphs: [
          'Most dance tracks are arranged in phrases of 8, 16 or 32 bars. Intros, breakdowns and drops usually start at a phrase boundary, so knowing that 32 bars is 60 seconds at 128 BPM tells you that a 60-second intro gives you exactly one phrase to mix in. If the outgoing track has a 30-second outro, you know you have 16 bars at that tempo before the music ends.',
          'The same arithmetic helps when preparing edits: looping 8 bars of a break at 140 BPM gives you 13.7 seconds, and extending an intro by 16 bars adds 27.4 seconds.',
        ],
      },
      {
        heading: 'Common conversions',
        table: {
          headers: ['Tempo', '1 bar (4/4)', '8 bars', '16 bars', '32 bars'],
          rows: [
            ['100 BPM', '2.4 s', '19.2 s', '38.4 s', '1:16.8'],
            ['120 BPM', '2 s', '16 s', '32 s', '1:04.0'],
            ['125 BPM', '1.92 s', '15.36 s', '30.72 s', '1:01.4'],
            ['128 BPM', '1.875 s', '15 s', '30 s', '1:00.0'],
            ['130 BPM', '1.846 s', '14.77 s', '29.54 s', '59.08 s'],
            ['140 BPM', '1.714 s', '13.71 s', '27.43 s', '54.86 s'],
            ['150 BPM', '1.6 s', '12.8 s', '25.6 s', '51.2 s'],
            ['174 BPM', '1.379 s', '11.03 s', '22.07 s', '44.14 s'],
          ],
        },
        paragraphs: [
          'Values are rounded to the nearest hundredth of a second. For other tempos use the calculator above or the full BPM reference table.',
        ],
      },
      {
        heading: 'Related calculations',
        bullets: [
          'Delay and reverb pre-delay times in milliseconds: use the BPM to ms calculator.',
          'LFO and tremolo rates in hertz: use the BPM to Hz converter.',
          'Unsure whether a track is 87 or 174 BPM? The half-time and double-time converter lists the related tempos.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How long is 16 bars at 128 BPM?',
        answer:
          'Exactly 30 seconds in 4/4 time. One beat at 128 BPM is 0.46875 seconds, a bar is 1.875 seconds and 16 bars are 30 seconds. 32 bars take one minute.',
      },
      {
        question: 'How many bars are in a 3-minute track at 140 BPM?',
        answer:
          'About 105 bars. A bar at 140 BPM lasts 1.714 seconds, and 180 seconds divided by 1.714 is 105. In practice, intros and outros are usually trimmed so that the arrangement works out to whole phrases.',
      },
      {
        question: 'Does the calculator handle 3/4 or 6/8 time?',
        answer:
          'Yes. Set beats per bar to 3 or 6. The calculator treats each beat as a quarter note at the given BPM, so 6/8 music counted in dotted quarters should be entered with 2 beats per bar at the dotted-quarter tempo.',
      },
    ],
    relatedPageIds: ['bpm-to-ms', 'bpm-reference-table', 'beatmatching-guide'],
  },
  {
    id: 'bpm-to-hz',
    path: '/tools/bpm-to-hz',
    category: 'tool',
    structuredDataType: 'WebApplication',
    title: 'BPM to Hz Converter for LFO, Tremolo and Delay Rates | BPM Techno',
    description:
      'Convert BPM to Hz and Hz to BPM. See the frequency and period of whole notes, quarter notes, eighths, sixteenths, dotted and triplet values at any tempo for tempo-synced LFOs and effects.',
    heading: 'BPM to Hz converter',
    lede:
      'Many synths, tremolo pedals and lighting controllers take a rate in hertz rather than a note value. Enter the tempo and read the frequency for each musical division, or enter a frequency to find the tempo it implies.',
    updatedDate: growthUpdatedDate,
    sections: [
      {
        heading: 'The formula',
        paragraphs: [
          'Hertz means cycles per second, and BPM means beats per minute, so one beat per second is 60 BPM and the conversion is simply BPM divided by 60. At 120 BPM the quarter-note pulse is 2 Hz. A whole bar of 4/4 at 120 BPM repeats every 2 seconds, which is 0.5 Hz, and sixteenth notes run at 8 Hz.',
          'To go the other way, multiply hertz by 60. An LFO running at 1.5 Hz is pulsing at 90 cycles per minute, which lines up with quarter notes at 90 BPM, eighth notes at 45 BPM or half notes at 180 BPM.',
        ],
      },
      {
        heading: 'Where BPM-to-Hz comes up',
        bullets: [
          'LFO rate on a synth filter or a sidechain-style tremolo when the LFO cannot be synced to the host tempo.',
          'Tremolo, auto-pan and chorus pedals with a rate knob in hertz.',
          'Strobe and lighting effects that should pulse on the beat.',
          'Rhythmic gating or sample-and-hold patterns that need to land on eighths or sixteenths.',
          'Checking whether a tempo-synced value in a plugin matches the rate shown in another plugin that only displays hertz.',
        ],
      },
      {
        heading: 'Reading the table',
        paragraphs: [
          'The table lists each note value with its frequency in hertz and its period in milliseconds. The period is just 1000 divided by the frequency, so it doubles as a delay time: a quarter-note delay at 120 BPM is 500 ms and the matching LFO rate is 2 Hz.',
          'Dotted values are 1.5 times longer than the plain note, so their frequency is lower by a factor of two thirds. Triplet values divide the beat into three, so a quarter triplet is two thirds of a quarter note and its rate is 1.5 times higher.',
        ],
      },
      {
        heading: 'Quick reference at common tempos',
        table: {
          headers: ['Tempo', 'Quarter note', 'Eighth note', 'Sixteenth', '1 bar (4/4)'],
          rows: [
            ['90 BPM', '1.5 Hz', '3 Hz', '6 Hz', '0.375 Hz'],
            ['100 BPM', '1.667 Hz', '3.333 Hz', '6.667 Hz', '0.417 Hz'],
            ['120 BPM', '2 Hz', '4 Hz', '8 Hz', '0.5 Hz'],
            ['128 BPM', '2.133 Hz', '4.267 Hz', '8.533 Hz', '0.533 Hz'],
            ['140 BPM', '2.333 Hz', '4.667 Hz', '9.333 Hz', '0.583 Hz'],
            ['174 BPM', '2.9 Hz', '5.8 Hz', '11.6 Hz', '0.725 Hz'],
          ],
        },
      },
    ],
    faqs: [
      {
        question: 'What is 120 BPM in Hz?',
        answer:
          '2 Hz for quarter notes. Divide BPM by 60: 120 / 60 = 2 cycles per second. Eighth notes at 120 BPM are 4 Hz and a full 4/4 bar is 0.5 Hz.',
      },
      {
        question: 'How do I convert an LFO rate in Hz back to BPM?',
        answer:
          'Multiply by 60. A 2.5 Hz LFO matches quarter notes at 150 BPM. If the LFO is meant to run at eighth notes, halve the result: 2.5 Hz is eighths at 75 BPM.',
      },
    ],
    relatedPageIds: ['bpm-to-ms', 'bars-to-time', 'bpm-reference-table'],
  },
  {
    id: 'pitch-range',
    path: '/tools/pitch-range',
    category: 'tool',
    structuredDataType: 'WebApplication',
    title: 'DJ Pitch Range Calculator: BPM Limits and Key Change | BPM Techno',
    description:
      'See the slowest and fastest BPM a pitch fader can reach at ±6, ±8, ±10, ±16 or wide range, the exact pitch percentage needed to match another track, and the key shift in semitones without key lock.',
    heading: 'Pitch range calculator',
    lede:
      'Enter a track tempo and your pitch fader range to see the BPM limits, then enter the tempo you want to match. The calculator gives the pitch adjustment in percent and the key change you would hear with key lock off.',
    updatedDate: growthUpdatedDate,
    sections: [
      {
        heading: 'How pitch faders change tempo',
        paragraphs: [
          'A pitch fader scales playback speed by a percentage. At +8% a 125 BPM track plays at 135 BPM; at −8% it plays at 115 BPM. The fader range decides how far apart two tracks can be and still be matched: a ±8% range from 126 BPM covers roughly 116 to 136 BPM, while ±16% stretches that to about 106 to 146 BPM.',
          'To match track A to track B, the adjustment needed is (B − A) / A × 100 percent. Going from 126 to 130 BPM takes +3.17%, well within any range; going from 126 to 140 BPM needs +11.1%, which a ±8% or ±10% fader cannot reach without switching to a wider range.',
        ],
      },
      {
        heading: 'What happens to the key',
        paragraphs: [
          'Without key lock (also called master tempo), speeding a track up raises its pitch. The shift in semitones is 12 × log2(new tempo / old tempo). A +6% change is almost exactly one semitone (12 × log2(1.06) = 1.01), which is why ±6% is a popular range for DJs who mix in key: the whole fader stays within a semitone.',
          'With key lock on, the player time-stretches the audio so the key stays put. Small adjustments of a few percent usually sound clean; large stretches of 10% or more can smear transients and add artifacts, especially on vocals, so many DJs turn key lock off for big changes and accept the pitch shift.',
        ],
      },
      {
        heading: 'Choosing a range',
        bullets: [
          '±6%: finest control per millimetre of fader travel; ideal for harmonic mixing in one genre with tight tempos.',
          '±8%: the classic turntable range; enough to bridge most house and techno sets.',
          '±10% and ±16%: common on digital players; ±16% covers jumps between genres, for example 128 to 140 BPM, at the cost of coarser control.',
          'Wide (up to ±100% on some players): for creative tempo changes and half-time tricks; precise beatmatching becomes difficult.',
        ],
      },
      {
        heading: 'Tempo jumps between genres',
        table: {
          headers: ['From', 'To', 'Pitch needed', 'Key change (no key lock)'],
          rows: [
            ['124 BPM house', '128 BPM house', '+3.23%', '+0.55 semitones'],
            ['128 BPM house', '132 BPM techno', '+3.13%', '+0.53 semitones'],
            ['128 BPM house', '140 BPM dubstep grid', '+9.38%', '+1.55 semitones'],
            ['140 BPM', '150 BPM hard techno', '+7.14%', '+1.19 semitones'],
            ['87 BPM half-time', '174 BPM drum and bass', 'none: same grid', 'none'],
          ],
        },
        paragraphs: [
          'For jumps beyond the fader range, DJs usually bridge with a track in between, use a half-time or double-time relationship, or cut rather than blend.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How much pitch change is one semitone?',
        answer:
          'About +5.95% to go up a semitone and −5.61% to go down one. Twelve equal semitones multiply the speed by 2, so each semitone is a factor of 2 to the power of 1/12, which is 1.0595.',
      },
      {
        question: 'Does key lock affect the BPM?',
        answer:
          'No. Key lock keeps the musical key constant while the tempo changes with the fader. The BPM you read on the display is the same with key lock on or off; only the pitch of the audio differs.',
      },
      {
        question: 'Why does my mix sound off even though the BPMs match?',
        answer:
          'Matching BPM aligns the tempo, not the beats or the phrases. The beatmatching guide covers nudging the beats into alignment and starting the incoming track on a phrase boundary.',
      },
    ],
    relatedPageIds: ['beatmatching-guide', 'bpm-converter', 'genre-guide'],
  },
  {
    id: 'metronome',
    path: '/tools/metronome',
    category: 'tool',
    structuredDataType: 'WebApplication',
    title: 'Free Online Metronome, 30 to 300 BPM | BPM Techno',
    description:
      'A free online metronome with an accented downbeat, 2 to 7 beats per bar, a tempo slider and ±1/±5 BPM buttons. Runs in the browser with sample-accurate timing from the Web Audio API; works offline after the first load.',
    heading: 'Online metronome',
    lede:
      'Set a tempo, pick the beats per bar and press start. The click is scheduled by the browser audio engine rather than a timer, so it stays steady even when the tab is busy.',
    updatedDate: growthUpdatedDate,
    sections: [
      {
        heading: 'Using the metronome',
        steps: [
          'Type a BPM or drag the slider. The ±1 and ±5 buttons make small corrections easy on a phone.',
          'Choose beats per bar. The first beat of each bar is accented with a higher click.',
          'Press Start. On phones the first start may need a tap because browsers only allow audio after a user gesture.',
          'Watch the beat indicator or listen with headphones while you practice counting bars, tapping or beatmatching.',
        ],
      },
      {
        heading: 'Why the timing is steady',
        paragraphs: [
          'A metronome built on setInterval drifts, because JavaScript timers run late whenever the browser is busy. This metronome uses the Web Audio API clock instead: a short lookahead loop schedules each click a fraction of a second before it is due, at an exact time on the audio clock, so the spacing between clicks does not depend on how quickly the page is running.',
          'Audio is generated locally and nothing is recorded or sent anywhere. Once the page has loaded, the metronome keeps working without a network connection.',
        ],
      },
      {
        heading: 'Practice ideas for DJs',
        bullets: [
          'Count phrases: run the click at the tempo of a track and count 8, 16 and 32 bars to learn where drops and breakdowns tend to land.',
          'Beatmatch by ear: play a track on one deck and match it to the metronome before trying two tracks.',
          'Check a tempo you measured: start the click at the detected BPM and listen whether it locks with the music, or drifts to half or double time.',
          'Tap practice: use the tap tempo tool alongside the click to see how close your taps land.',
        ],
      },
      {
        heading: 'Tempo markings',
        table: {
          headers: ['Marking', 'Typical BPM', 'Dance-music equivalent'],
          rows: [
            ['Adagio', '66 to 76', 'Downtempo, slow hip-hop'],
            ['Andante', '76 to 108', 'Hip-hop, reggae, trap at half-time'],
            ['Moderato', '108 to 120', 'Disco, deep house'],
            ['Allegro', '120 to 156', 'House, techno, trance'],
            ['Vivace', '156 to 176', 'Hardstyle, drum and bass'],
            ['Presto', '168 to 200', 'Drum and bass, hardcore, footwork'],
          ],
        },
        paragraphs: [
          'Classical tempo markings are ranges rather than exact values; the table shows common interpretations so you can relate them to club tempos.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Why is there no sound when I press start?',
        answer:
          'Browsers block audio until the page receives a user gesture, and some phones route sound to the silent switch. Tap Start once more, check that the device is not in silent mode and that media volume is up.',
      },
      {
        question: 'Can I use a tempo with decimals?',
        answer:
          'Yes. Type a value such as 127.5 in the number field. The slider moves in whole BPM steps, but the typed value is used exactly.',
      },
    ],
    relatedPageIds: ['tap-tempo', 'bars-to-time', 'beatmatching-guide'],
  },
  {
    id: 'bpm-reference-table',
    path: '/guides/bpm-reference-table',
    category: 'guide',
    structuredDataType: 'Article',
    title: 'BPM Reference Table: Beat Length in ms, Hz and Bar Durations | BPM Techno',
    description:
      'Lookup table from 60 to 200 BPM with the length of one beat in milliseconds, one bar in seconds, 16 and 32 bars, the beat frequency in Hz and the half-time and double-time tempos.',
    heading: 'BPM reference table',
    lede:
      'The numbers DJs and producers keep recalculating, in one table: beat length, bar length, phrase lengths, beat frequency and the related half- and double-time tempos for the tempos that come up most.',
    updatedDate: growthUpdatedDate,
    sections: [
      {
        heading: 'How to read the table',
        paragraphs: [
          'Each row is one tempo. The beat column is 60,000 divided by the BPM in milliseconds and doubles as a quarter-note delay time. The bar column assumes 4/4 time, so it is four beats. The 16- and 32-bar columns are the two most common phrase lengths in club music. Hz is the beat frequency, BPM divided by 60, for LFOs and effects that want a rate instead of a note value.',
          'The last column lists the half-time and double-time tempos. A BPM detector may report either of them for the same track, so if a result looks wrong by a factor of two, check this column before re-measuring.',
        ],
      },
      {
        heading: 'Reference values from 60 to 200 BPM',
        table: {
          headers: [
            'BPM',
            '1 beat',
            '1 bar (4/4)',
            '16 bars',
            '32 bars',
            'Beat frequency',
            'Half / double',
          ],
          rows: createTempoReferenceRows(),
        },
      },
      {
        heading: 'Patterns worth remembering',
        bullets: [
          '120 BPM is the round one: 500 ms per beat, 2 s per bar, 32 s per 16 bars.',
          '128 BPM gives exactly 30 s for 16 bars and 60 s for 32 bars, which makes set timing easy in house and techno.',
          '150 BPM is 400 ms per beat and 1.6 s per bar; 32 bars are 51.2 s.',
          '174 BPM drum and bass runs at 345 ms per beat; its half-time, 87 BPM, is what many detectors report.',
          'Doubling the tempo halves every duration and doubles every frequency.',
        ],
      },
      {
        heading: 'Calculators for values that are not in the table',
        links: [
          { href: '/tools/bpm-to-ms', label: 'BPM to milliseconds with dotted and triplet values' },
          { href: '/tools/bpm-to-hz', label: 'BPM to Hz for every note division' },
          { href: '/tools/bars-to-time', label: 'Bars to seconds and seconds to bars at any tempo' },
          { href: '/tools/bpm-converter', label: 'Half-time and double-time converter' },
        ],
      },
    ],
    faqs: [
      {
        question: 'How many milliseconds is one beat at 128 BPM?',
        answer:
          '468.75 ms. Divide 60,000 by 128. An eighth note is 234.38 ms and a sixteenth is 117.19 ms.',
      },
      {
        question: 'How long is a 4/4 bar at 140 BPM?',
        answer:
          'About 1.714 seconds. One beat at 140 BPM is 428.57 ms and a bar is four beats. 16 bars last 27.43 seconds.',
      },
      {
        question: 'Why does the table stop at 200 BPM?',
        answer:
          'Tempos above 200 BPM are usually counted at half-time: 220 BPM is the same grid as 110 BPM. Use the half-time row, or the calculators, for faster values.',
      },
    ],
    relatedPageIds: ['bpm-to-ms', 'genre-guide', 'bpm-converter'],
  },
]);

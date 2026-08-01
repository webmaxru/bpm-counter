const updatedDate = '2026-07-31';

export const publishingPages = Object.freeze([
  {
    id: 'home',
    path: '/',
    category: 'tool',
    structuredDataType: 'WebApplication',
    title: 'Free Real-Time BPM Counter for DJs | BPM Techno',
    description:
      'Measure the tempo of music playing near your microphone with a private, browser-based real-time BPM counter.',
    heading: 'Free real-time BPM counter',
    lede:
      'Measure the tempo of a track playing in the room without uploading or recording the audio. BPM Techno analyzes the microphone stream inside your browser and shows a stable beats-per-minute estimate.',
    updatedDate,
    sections: [
      {
        heading: 'How to measure BPM in real time',
        paragraphs: [
          'Start the counter, allow microphone access, and play a section with a clear and steady beat. The detector listens for repeated rhythmic events and compares several possible tempo patterns before it presents a stable result.',
          'A useful sample usually contains drums or other clear transients. Long intros, breakdowns, speech, crowd noise, and heavily syncopated passages give the detector less reliable timing information.',
        ],
        steps: [
          'Place the device where it can hear the music clearly without clipping.',
          'Select Start listening and approve microphone access.',
          'Play a steady section and wait while the estimate stabilizes.',
          'Compare the result with what you hear, including possible half-time or double-time interpretations.',
        ],
      },
      {
        heading: 'What the BPM result means',
        paragraphs: [
          'BPM describes how many beats occur in one minute. A result of 120 BPM means the detected pulse repeats about twice per second. Music can support more than one valid rhythmic interpretation, so a detector may report 70 BPM for a track a DJ counts as 140 BPM, or the reverse.',
          'Use the result as a strong starting point rather than a replacement for listening. If the tempo feels exactly half or double what you expect, use the BPM converter to compare the related values.',
        ],
      },
      {
        heading: 'Improve detection accuracy',
        bullets: [
          'Use a section with a consistent kick, snare, clap, or hi-hat pattern.',
          'Reduce nearby speech, tapping, and other competing sounds.',
          'Avoid placing the microphone directly against a loud speaker where the signal distorts.',
          'Let the detector hear several bars instead of judging the first interim number.',
          'Try another section when the arrangement changes tempo or rhythm.',
        ],
      },
      {
        heading: 'Microphone privacy',
        paragraphs: [
          'The live audio stream is processed locally with the Web Audio API. BPM Techno does not send the microphone audio to its server. Browser permission is still required because the browser protects access to the microphone.',
          'You can revoke microphone permission at any time in the browser site settings. Starting over reloads the page and ends the current listening session.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Why does BPM detection take several seconds?',
        answer:
          'A longer sample lets the analyzer compare repeated beat intervals and reject unstable tempo candidates. Waiting through several bars usually produces a more useful result than reacting to the first estimate.',
      },
      {
        question: 'Why is the detected BPM half or double the expected value?',
        answer:
          'Many rhythms have strong pulses at more than one metrical level. Both 70 and 140 BPM can describe the same timing grid, depending on whether you count the slower pulse or every subdivision.',
      },
    ],
    relatedPageIds: ['tap-tempo', 'bpm-converter', 'real-time-guide'],
  },
  {
    id: 'upload',
    path: '/upload',
    category: 'tool',
    structuredDataType: 'WebApplication',
    title: 'Analyze BPM from an Audio URL | BPM Techno',
    description:
      'Fetch a browser-accessible MP3 or WAV URL and estimate its BPM locally with the Web Audio API.',
    heading: 'Analyze BPM from an audio URL',
    lede:
      'Paste a direct URL to an audio file. Your browser fetches and decodes the file, then BPM Techno estimates its tempo locally.',
    updatedDate,
    sections: [
      {
        heading: 'The URL must point to audio',
        paragraphs: [
          'Use a direct link to a file that the browser can decode, rather than a streaming service page or a download page containing HTML. The sample link in the form demonstrates the expected format.',
          'MP3 and WAV are commonly supported, but the exact codecs available depend on the browser and operating system.',
        ],
      },
      {
        heading: 'Why some remote files cannot be fetched',
        paragraphs: [
          'Browsers enforce Cross-Origin Resource Sharing, usually called CORS. The server hosting the audio must allow bpmtech.no to read the response. A file can play in a browser tab and still reject programmatic access if its CORS headers do not permit it.',
          'If a remote host blocks the request, use a file hosted with suitable CORS headers or the included sample. BPM Techno cannot bypass the remote server policy.',
        ],
      },
      {
        heading: 'Accuracy and useful sections',
        bullets: [
          'Use a full-quality file when possible; severe compression can soften rhythmic transients.',
          'Tracks with a stable electronic beat are generally easier than live performances with tempo drift.',
          'A detected value may represent half-time or double-time.',
          'Silence, ambient intros, and beatless material reduce confidence.',
        ],
      },
      {
        heading: 'How the audio is handled',
        paragraphs: [
          'The URL is fetched directly by your browser. The decoded audio is analyzed in browser memory and is not uploaded to the BPM Techno feedback API.',
          'Submitting the optional accuracy feedback sends the detected BPM, the analysis mode, and whether you marked the result correct. It does not send the audio file.',
        ],
      },
    ],
    relatedPageIds: ['audio-url-guide', 'how-detection-works', 'bpm-converter'],
  },
  {
    id: 'tap-tempo',
    path: '/tools/tap-tempo',
    category: 'tool',
    structuredDataType: 'WebApplication',
    title: 'Tap Tempo BPM Counter | BPM Techno',
    description:
      'Tap along with a beat to calculate BPM from your timing, with practical guidance for consistent manual tempo measurement.',
    heading: 'Tap tempo BPM counter',
    lede:
      'Tap the button in time with the beat. The tool averages your recent intervals and turns them into a BPM estimate without using the microphone.',
    updatedDate,
    sections: [
      {
        heading: 'How tap tempo works',
        paragraphs: [
          'The time between two taps is one beat interval. Dividing 60,000 milliseconds by that interval produces BPM. Because a single interval is easy to mistime, this tool averages a short rolling set of recent taps.',
          'A long pause starts a new measurement automatically so an old session does not distort the next tempo.',
        ],
      },
      {
        heading: 'How to tap consistently',
        bullets: [
          'Follow one repeated element, such as the kick or snare, instead of switching between instruments.',
          'Tap for at least four beats; eight beats usually gives a steadier average.',
          'Use the same physical motion and avoid correcting a late tap with an early one.',
          'Reset and try again when the music changes tempo or enters a breakdown.',
        ],
      },
      {
        heading: 'When manual tapping is useful',
        paragraphs: [
          'Tap tempo works well when microphone access is unavailable, the recording is noisy, or the rhythm is obvious to a listener but difficult for automatic onset detection. It is also useful for checking whether an automatic result should be interpreted at half-time or double-time.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How many taps are enough?',
        answer:
          'Two taps produce a number, but four to eight consistent taps are more reliable because one early or late movement has less influence on the average.',
      },
      {
        question: 'Does tap tempo listen to the microphone?',
        answer:
          'No. The tool only measures the timing of button presses in the browser.',
      },
    ],
    relatedPageIds: ['home', 'bpm-converter', 'beatmatching-guide'],
  },
  {
    id: 'bpm-to-ms',
    path: '/tools/bpm-to-ms',
    category: 'tool',
    structuredDataType: 'WebApplication',
    title: 'BPM to Milliseconds and Delay Calculator | BPM Techno',
    description:
      'Convert BPM to note durations in milliseconds for tempo-synced delay, modulation, sequencing, and production.',
    heading: 'BPM to milliseconds calculator',
    lede:
      'Enter a tempo to calculate whole, half, quarter, eighth, sixteenth, dotted, and triplet note durations in milliseconds.',
    updatedDate,
    sections: [
      {
        heading: 'The BPM-to-milliseconds formula',
        paragraphs: [
          'One minute contains 60,000 milliseconds. Dividing 60,000 by BPM gives the duration of one quarter-note beat in common 4/4 timing. Other note values are simple multiples or fractions of that beat.',
          'At 120 BPM, a quarter note lasts 500 ms, an eighth note lasts 250 ms, and a half note lasts 1,000 ms.',
        ],
      },
      {
        heading: 'Using the values in music production',
        bullets: [
          'Set delay time to an eighth or dotted eighth for repeats that follow the groove.',
          'Use longer half- or whole-note values for spacious echoes and automation cycles.',
          'Use sixteenth-note values for rhythmic gates, tremolo, or fast modulation.',
          'Choose triplets when the musical phrase uses a three-part subdivision rather than straight or dotted timing.',
        ],
      },
      {
        heading: 'Plugin sync versus manual milliseconds',
        paragraphs: [
          'Many plugins can synchronize directly to the host tempo. Manual millisecond values remain useful when a device has no sync mode, when hardware receives no MIDI clock, or when you want a deliberately offset timing value.',
          'Real devices may round values, and analog-style effects can drift. Treat the calculated number as the exact grid value, then adjust by ear when the production benefits from movement.',
        ],
      },
    ],
    relatedPageIds: ['bpm-converter', 'genre-guide', 'beatmatching-guide'],
  },
  {
    id: 'bpm-converter',
    path: '/tools/bpm-converter',
    category: 'tool',
    structuredDataType: 'WebApplication',
    title: 'Half-Time and Double-Time BPM Converter | BPM Techno',
    description:
      'Compare half-time, original, and double-time BPM values to interpret ambiguous tempo results and rhythmic feels.',
    heading: 'Half-time and double-time BPM converter',
    lede:
      'Enter a BPM value to see the related half-time and double-time tempos that share the same underlying timing grid.',
    updatedDate,
    sections: [
      {
        heading: 'Why one track can have two plausible BPM values',
        paragraphs: [
          'Tempo depends on which rhythmic level you count. A track labeled 70 BPM may contain hi-hats or snares that make DJs and software interpret it as 140 BPM. Neither value changes the actual timing of the recording.',
          'Automatic detectors choose the strongest repeated pulse, which may differ from a genre convention or the beat grid you want to use.',
        ],
      },
      {
        heading: 'Using tempo families',
        bullets: [
          'Check the half-time value when a detector feels too fast for the musical pulse.',
          'Check the double-time value when a result feels too slow for beatmatching or grid placement.',
          'Compare waveform transients across bars before changing a DJ software beat grid.',
          'Keep the value that makes bar counting and phrase alignment easiest.',
        ],
      },
      {
        heading: 'Examples',
        table: {
          headers: ['Detected BPM', 'Half-time', 'Double-time', 'Common interpretation'],
          rows: [
            ['70', '35', '140', 'Hip-hop or drum and bass half/double relationship'],
            ['87.5', '43.75', '175', 'Fast breakbeat interpreted on a slower pulse'],
            ['128', '64', '256', 'House tempo with a possible half-time grid'],
          ],
        },
      },
    ],
    relatedPageIds: ['home', 'tap-tempo', 'genre-guide'],
  },
  {
    id: 'real-time-guide',
    path: '/guides/real-time-bpm-counter',
    category: 'guide',
    structuredDataType: 'Article',
    title: 'How to Use a Real-Time BPM Counter | BPM Techno',
    description:
      'A practical guide to microphone placement, stable beat sections, tempo interpretation, and troubleshooting real-time BPM detection.',
    heading: 'How to use a real-time BPM counter',
    lede:
      'Real-time detection is most reliable when the browser hears a clear, repeated rhythm for several bars. This guide explains how to prepare the signal and interpret the result.',
    updatedDate,
    sections: [
      {
        heading: 'Choose the right part of the track',
        paragraphs: [
          'Start with a section where the main groove is established. Four-on-the-floor kick drums, regular snares, and clear hi-hats provide repeated timing events. Intros made from pads, vocals, or effects may contain no dependable pulse.',
          'If the track has a tempo change or a freely played introduction, measure a later section and treat different sections separately.',
        ],
      },
      {
        heading: 'Position the microphone',
        paragraphs: [
          'The detector does not need studio-quality sound, but it needs a clean rhythmic signal. Place the phone or laptop where the music is audible and competing sounds are reduced.',
          'Very loud playback can overload a built-in microphone and flatten the transients used for timing. Moving farther from the speaker can be more accurate than increasing volume.',
        ],
      },
      {
        heading: 'Wait for stabilization',
        paragraphs: [
          'Interim values are useful feedback that the analyzer is hearing a rhythm, but they can move as more beats arrive. A stable estimate requires enough repeated intervals to distinguish a lasting pulse from a short coincidence.',
          'Let several bars play before deciding that a value is wrong. If the number continues to jump, choose a simpler section or reduce background noise.',
        ],
      },
      {
        heading: 'Interpret half-time and double-time',
        paragraphs: [
          'A result that is exactly half or double the expected tempo is a metrical interpretation, not necessarily a detection failure. For example, 174 BPM drum and bass can produce a strong 87 BPM pulse.',
          'Use the converter and count bars aloud. The most useful value is the one that aligns with your DJ grid, production session, or musical notation.',
        ],
      },
      {
        heading: 'Troubleshooting checklist',
        bullets: [
          'Confirm microphone permission is allowed for bpmtech.no.',
          'Close another app that may be holding exclusive access to the microphone.',
          'Reload the page after changing the selected input device.',
          'Try a private browser window if an old permission or service worker is interfering.',
          'Use tap tempo when the source is too quiet, noisy, or rhythmically irregular.',
        ],
      },
    ],
    relatedPageIds: ['home', 'tap-tempo', 'how-detection-works'],
  },
  {
    id: 'how-detection-works',
    path: '/guides/how-bpm-detection-works',
    category: 'guide',
    structuredDataType: 'Article',
    title: 'How Browser BPM Detection Works | BPM Techno',
    description:
      'Learn how browser audio analysis turns rhythmic transients into BPM candidates, why results stabilize, and why half-time errors occur.',
    heading: 'How browser BPM detection works',
    lede:
      'BPM detection estimates a repeating pulse from audio. It does not read tempo metadata or recognize a song title; it measures timing patterns in the signal supplied by the browser.',
    updatedDate,
    sections: [
      {
        heading: '1. The browser provides an audio signal',
        paragraphs: [
          'For live mode, the MediaDevices API supplies a microphone stream after the user grants permission. For URL mode, the browser fetches the file and the Web Audio API decodes it into audio samples.',
          'The two modes use different analysis libraries, but both operate in the browser. The feedback endpoint receives only the result metadata you choose to submit.',
        ],
      },
      {
        heading: '2. Rhythmic events are identified',
        paragraphs: [
          'Tempo algorithms look for changes that may represent musical onsets: the beginning of a kick, snare, clap, note, or other transient. The exact implementation differs by library, but the objective is to build a timeline of likely rhythmic events.',
          'Compression, reverb, sustained pads, and noisy recordings can blur those event boundaries. That is why a clean drum section is easier than an ambient passage.',
        ],
      },
      {
        heading: '3. Intervals become tempo candidates',
        paragraphs: [
          'The analyzer compares distances between events and looks for intervals that repeat. An interval of 500 ms corresponds to 120 quarter-note beats per minute because 60,000 divided by 500 equals 120.',
          'Real music contains subdivisions and accents, so several candidates can be mathematically plausible. The algorithm ranks candidates based on their repeated support in the sample.',
        ],
      },
      {
        heading: '4. More audio improves stability',
        paragraphs: [
          'A short sample can support an accidental pattern. As additional bars arrive, persistent intervals gain evidence and unstable candidates lose influence. The real-time analyzer therefore exposes interim estimates before reporting a stable BPM.',
          'Stability does not guarantee that the selected metrical level matches a human label. Half-time and double-time remain common because both describe genuine repetition in the signal.',
        ],
      },
      {
        heading: 'Privacy boundaries',
        paragraphs: [
          'BPM Techno does not need to record or upload live microphone audio. Audio processing occurs in the browser tab. The browser still displays a permission prompt and may show a microphone indicator while the stream is active.',
          'Remote audio URLs are requested by the browser from the hosting server, so that server can receive the normal request information such as IP address and user agent.',
        ],
      },
    ],
    relatedPageIds: ['real-time-guide', 'audio-url-guide', 'bpm-to-ms'],
  },
  {
    id: 'genre-guide',
    path: '/guides/genre-bpm-ranges',
    category: 'guide',
    structuredDataType: 'Article',
    title: 'Typical BPM Ranges by Music Genre | BPM Techno',
    description:
      'Reference common BPM ranges for hip-hop, house, techno, trance, drum and bass, and other genres, with half-time interpretation notes.',
    heading: 'Typical BPM ranges by music genre',
    lede:
      'Genre ranges are useful clues, not rules. Producers cross styles, tracks change tempo, and listeners may count the same rhythm at half-time or double-time.',
    updatedDate,
    sections: [
      {
        heading: 'Quick reference',
        paragraphs: [
          'The ranges below describe common practice rather than a formal classification. Catalog metadata, DJ stores, and individual scenes can label the same track differently.',
        ],
        table: {
          headers: ['Genre or style', 'Typical BPM range', 'Interpretation note'],
          rows: [
            ['Downtempo / ambient beat', '60-100', 'Beatless ambient may have no useful BPM'],
            ['Hip-hop', '70-100', 'Often represented as 140-200 in double-time production grids'],
            ['Reggae / dub', '70-100', 'The perceived pulse can emphasize offbeats'],
            ['Disco', '105-130', 'Steady four-on-the-floor sections are detector-friendly'],
            ['House', '118-130', 'Subgenres commonly cluster around 120-128'],
            ['Techno', '125-150', 'Modern styles range from restrained to very fast'],
            ['Trance', '128-145', 'Regular kick patterns usually provide a clear pulse'],
            ['UK garage / breakbeat', '125-140', 'Syncopation can create competing candidates'],
            ['Drum and bass', '160-180', 'Frequently perceived and detected at 80-90 half-time'],
          ],
        },
      },
      {
        heading: 'Use genre as a sanity check',
        paragraphs: [
          'If a house track is detected at 64 BPM, 128 BPM is the likely DJ-grid interpretation. If drum and bass is detected near 87 BPM, compare the 174 BPM double-time value.',
          'Do not force every track into a typical range. Experimental productions, edits, transitions, and live recordings can sit outside the table.',
        ],
      },
      {
        heading: 'Why ranges overlap',
        paragraphs: [
          'Tempo alone does not define genre. House, techno, trance, and garage can share a BPM while differing in drum pattern, sound design, harmony, arrangement, and cultural context.',
          'Use BPM to plan transitions and timing, then use listening and musical structure to decide whether two tracks fit together.',
        ],
      },
      {
        heading: 'Building a DJ set',
        bullets: [
          'Sort by both BPM and musical energy instead of tempo alone.',
          'Check whether metadata uses half-time or double-time conventions.',
          'Use gradual tempo changes when preserving pitch and groove matters.',
          'Preview transitions at phrase boundaries before relying on sync.',
        ],
      },
    ],
    relatedPageIds: ['bpm-converter', 'beatmatching-guide', 'home'],
  },
  {
    id: 'beatmatching-guide',
    path: '/guides/beatmatching',
    category: 'guide',
    structuredDataType: 'Article',
    title: 'Beatmatching Guide for Beginners | BPM Techno',
    description:
      'Learn a practical beatmatching workflow: choose tracks, match tempo, align beats, correct drift, and mix on phrase boundaries.',
    heading: 'Beatmatching guide for beginners',
    lede:
      'Beatmatching combines tempo matching with precise beat and phrase alignment. A BPM value gets two tracks close; listening and small corrections keep them together.',
    updatedDate,
    sections: [
      {
        heading: '1. Choose compatible sections',
        paragraphs: [
          'Start with two tracks that have clear drums and similar tempos. Use an outro or a reduced section of the playing track and an intro with a predictable beat on the incoming track.',
          'Large tempo changes are possible, but learning with a small difference makes pitch adjustment and drift easier to hear.',
        ],
      },
      {
        heading: '2. Match the tempo',
        paragraphs: [
          'Use reliable metadata, BPM Techno, or tap tempo to estimate both tracks. Adjust the incoming deck pitch until its BPM is close to the playing track.',
          'The BPM display is a starting point. Small metadata errors, deck rounding, and live drumming can still produce drift.',
        ],
      },
      {
        heading: '3. Align the downbeats',
        paragraphs: [
          'Cue the first beat of a bar on the incoming track. Start it on the first beat of a bar in the playing track. Listen for doubled kicks or a flam, then nudge the incoming track until the transients meet.',
          'Headphones with split cue or a cue/master blend make it easier to compare the two rhythmic layers before the audience hears the transition.',
        ],
      },
      {
        heading: '4. Identify and correct drift',
        paragraphs: [
          'If the beats align and then separate, the tempos are not matched. Determine whether the incoming track moves ahead or falls behind. Correct the pitch slightly, then nudge back into alignment.',
          'A nudge fixes phase; the pitch control fixes ongoing tempo. Repeatedly nudging without adjusting pitch treats the symptom but not the cause.',
        ],
      },
      {
        heading: '5. Mix in phrases',
        paragraphs: [
          'Dance music commonly organizes changes in groups of 8, 16, or 32 bars. Starting a transition at a matching phrase boundary helps drops, breakdowns, vocals, and bass changes arrive in a musically intentional order.',
          'Count phrases and mark cue points during preparation. Sync can align beats, but it does not choose a good musical moment to mix.',
        ],
      },
      {
        heading: 'Common mistakes',
        bullets: [
          'Counting a half-time value on one track and a double-time value on the other.',
          'Trying to match during an intro without a stable rhythmic reference.',
          'Using EQ to hide a timing problem instead of correcting drift.',
          'Watching waveforms continuously instead of training the ears.',
          'Layering two full bass lines for too long and creating low-frequency masking.',
        ],
      },
    ],
    relatedPageIds: ['home', 'genre-guide', 'bpm-converter'],
  },
  {
    id: 'audio-url-guide',
    path: '/guides/analyze-audio-url',
    category: 'guide',
    structuredDataType: 'Article',
    title: 'How to Analyze BPM from an Audio URL | BPM Techno',
    description:
      'Understand direct audio URLs, browser codec support, CORS errors, local decoding, and BPM accuracy before analyzing a remote file.',
    heading: 'How to analyze BPM from an audio URL',
    lede:
      'The URL analyzer is useful when a file is publicly reachable and the hosting server allows browser access. Most failures are caused by the URL returning a web page, an unsupported codec, or missing CORS permission.',
    updatedDate,
    sections: [
      {
        heading: 'Use a direct file response',
        paragraphs: [
          'A direct URL returns audio bytes such as MPEG audio or WAV data. A link to a streaming-service track page usually returns HTML and cannot be decoded as audio.',
          'Open the URL in a private tab to inspect its behavior. If it presents a player page, sign-in screen, or expiring redirect, it may not be suitable for direct analysis.',
        ],
      },
      {
        heading: 'Understand CORS',
        paragraphs: [
          'The browser applies the remote server CORS policy before JavaScript can read the response. The server must include an Access-Control-Allow-Origin header that permits bpmtech.no or all origins.',
          'This is a browser security boundary. Changing the BPM Techno frontend cannot grant access to a server that refuses the cross-origin request.',
        ],
      },
      {
        heading: 'Codec and container support',
        paragraphs: [
          'A filename extension is only a hint. The browser must support the codec inside the file and the response should use a sensible content type. Common MP3 and uncompressed WAV files have broad support, while specialized or malformed files may fail.',
          'Browser support can differ across operating systems, so a URL that works in one browser is not guaranteed to decode everywhere.',
        ],
      },
      {
        heading: 'What happens after the fetch',
        paragraphs: [
          'The response is read into browser memory and decoded with the Web Audio API. The analyzer examines the decoded samples and returns a BPM estimate. BPM Techno does not proxy or permanently store the file.',
          'Large files take more time and memory. Use a representative excerpt when you control the source and do not need to analyze an entire long recording.',
        ],
      },
      {
        heading: 'Troubleshooting',
        bullets: [
          'Confirm the URL uses HTTPS and returns successfully without authentication.',
          'Check the browser developer console for a CORS or decoding error.',
          'Try the included sample to confirm that local analysis works.',
          'Use a conventional MP3 or WAV encoding.',
          'Host your own authorized file with appropriate CORS headers when necessary.',
        ],
      },
    ],
    relatedPageIds: ['upload', 'how-detection-works', 'real-time-guide'],
  },
  {
    id: 'privacy',
    path: '/privacy',
    category: 'legal',
    structuredDataType: 'WebPage',
    title: 'Privacy Policy | BPM Techno',
    description:
      'How BPM Techno handles microphone audio, remote audio URLs, feedback, analytics, authentication, and affiliate links.',
    heading: 'Privacy policy',
    lede:
      'This policy explains the data used by BPM Techno and the boundaries between browser-local audio processing, application telemetry, and third-party services.',
    updatedDate,
    sections: [
      {
        heading: 'Audio processing',
        paragraphs: [
          'Live microphone audio is processed inside the browser with the Web Audio API. BPM Techno does not upload or store the microphone stream on its server.',
          'When you analyze an audio URL, your browser requests the file directly from the hosting server. That server may receive normal request information such as your IP address and browser user agent. BPM Techno decodes the response in browser memory and does not permanently store the audio.',
        ],
      },
      {
        heading: 'Feedback data',
        paragraphs: [
          'If you use the thumbs-up or thumbs-down feedback control, the application sends the detected BPM, the analysis mode, and whether you marked the result correct to the BPM Techno API. Audio is not included.',
        ],
      },
      {
        heading: 'Analytics and diagnostics',
        paragraphs: [
          'BPM Techno uses Google Analytics 4 and Azure Application Insights to understand feature usage, performance, and errors. These services may process device, browser, page, network, and interaction information according to their own terms and privacy documentation.',
          'Analytics records the page route without query strings, and the direct audio-file request is excluded from automatic Application Insights dependency tracking. The analyzer URL is still visible to your browser, the audio host, and any infrastructure that handles the original page request.',
          'Do not include personal information in URLs submitted to the audio analyzer because URLs can appear in browser, hosting, or network logs.',
        ],
      },
      {
        heading: 'Authentication',
        paragraphs: [
          'Optional Azure Static Web Apps authentication is used only for protected demonstration routes. If you choose to sign in, the configured identity provider and Azure may process account identifiers needed to authenticate the session.',
        ],
      },
      {
        heading: 'Affiliate links and external sites',
        paragraphs: [
          'Some product recommendations are affiliate links. Following one sends you to an external merchant, which receives the normal request and may use its own cookies or identifiers. BPM Techno may earn a commission from a qualifying purchase.',
          'External sites control their own privacy practices. Review their policies before providing information or completing a purchase.',
        ],
      },
      {
        heading: 'Your choices and contact',
        bullets: [
          'Deny or revoke microphone permission in browser settings.',
          'Do not submit optional result feedback.',
          'Use browser privacy controls to manage cookies and site data.',
          'Report privacy questions through the project issue tracker on GitHub.',
        ],
      },
    ],
    relatedPageIds: ['contact', 'terms', 'affiliate-disclosure'],
  },
  {
    id: 'terms',
    path: '/terms',
    category: 'legal',
    structuredDataType: 'WebPage',
    title: 'Terms of Use | BPM Techno',
    description:
      'Terms for using the free BPM Techno browser tools, external links, and tempo estimates.',
    heading: 'Terms of use',
    lede:
      'BPM Techno provides free browser-based tempo tools for informational and creative use.',
    updatedDate,
    sections: [
      {
        heading: 'No guarantee of accuracy',
        paragraphs: [
          'Tempo detection is an estimate. Results can be affected by audio quality, rhythm, microphone placement, browser support, and half-time or double-time interpretation. Verify important timing decisions by listening and using appropriate production or DJ tools.',
        ],
      },
      {
        heading: 'Acceptable use',
        paragraphs: [
          'Use the service lawfully and do not attempt to disrupt the application, overload its API, bypass access controls, or submit audio URLs you are not authorized to access.',
          'You are responsible for complying with copyright, privacy, and other rights that apply to audio you play or analyze.',
        ],
      },
      {
        heading: 'Availability and changes',
        paragraphs: [
          'The service may change, become unavailable, or remove features without notice. Offline behavior depends on the installed service worker and previously cached application resources.',
        ],
      },
      {
        heading: 'External links',
        paragraphs: [
          'Links to merchants, documentation, social networks, and other external services are provided for convenience. BPM Techno does not control their content, availability, pricing, or policies.',
        ],
      },
    ],
    relatedPageIds: ['privacy', 'contact', 'affiliate-disclosure'],
  },
  {
    id: 'contact',
    path: '/contact',
    category: 'legal',
    structuredDataType: 'ContactPage',
    title: 'Contact BPM Techno | Support and Partnerships',
    description:
      'Report BPM Techno bugs, suggest improvements, ask privacy questions, or discuss sponsorship opportunities.',
    heading: 'Contact BPM Techno',
    lede:
      'The project is maintained publicly. Choose the channel that matches your request so it can be handled efficiently.',
    updatedDate,
    sections: [
      {
        heading: 'Bug reports and feature requests',
        paragraphs: [
          'Use the GitHub issue tracker for reproducible bugs and product suggestions. Include the browser, operating system, route, and steps needed to reproduce the problem. Do not attach copyrighted audio or personal information.',
        ],
        links: [
          {
            href: 'https://github.com/webmaxru/bpm-counter/issues',
            label: 'Open the GitHub issue tracker',
          },
        ],
      },
      {
        heading: 'Privacy and data questions',
        paragraphs: [
          'Use the issue tracker and clearly label the request as a privacy question. Avoid posting account identifiers, authentication tokens, or other sensitive data in a public issue.',
        ],
      },
      {
        heading: 'Sponsorship and partnerships',
        paragraphs: [
          'Relevant DJ, music-production, audio, and education brands may propose clearly labeled sponsorships. BPM Techno does not accept deceptive creatives or placements that imitate application controls.',
        ],
        links: [
          {
            href: 'https://twitter.com/webmaxru',
            label: 'Contact the maintainer on X',
          },
        ],
      },
    ],
    relatedPageIds: ['privacy', 'terms', 'affiliate-disclosure'],
  },
  {
    id: 'affiliate-disclosure',
    path: '/affiliate-disclosure',
    category: 'legal',
    structuredDataType: 'WebPage',
    title: 'Affiliate Disclosure | BPM Techno',
    description:
      'How affiliate recommendations support BPM Techno and how commissions affect product links.',
    heading: 'Affiliate disclosure',
    lede:
      'BPM Techno sometimes links to products that may be useful for DJs and music producers.',
    updatedDate,
    sections: [
      {
        heading: 'How affiliate links work',
        paragraphs: [
          'If you follow an affiliate link and make a purchase, BPM Techno may earn a commission at no additional cost to you. Affiliate relationships do not change the BPM results shown by the app and purchases are never required to use the tools.',
          'As an Amazon Associate I earn from qualifying purchases.',
        ],
      },
      {
        heading: 'How recommendations are selected',
        paragraphs: [
          'Recommendations are chosen for relevance to DJing, music production, listening, or the current tool context. A commercial relationship does not guarantee that a product is appropriate for every user.',
          'Product availability, specifications, and prices can change. Confirm current details with the merchant before buying.',
        ],
      },
      {
        heading: 'Identifying commercial links',
        paragraphs: [
          'Affiliate cards are labeled as affiliate recommendations and use sponsored link metadata. Direct sponsorships, if introduced, will also be clearly labeled.',
        ],
      },
    ],
    relatedPageIds: ['privacy', 'terms', 'contact'],
  },
]);

const publishingPagesById = new Map(
  publishingPages.map((page) => [page.id, page])
);
const publishingPagesByPath = new Map(
  publishingPages.map((page) => [page.path, page])
);

export function getPublishingPage(pageId) {
  const page = publishingPagesById.get(pageId);

  if (!page) {
    throw new Error(`Unknown publishing page: ${pageId}`);
  }

  return page;
}

export function findPublishingPageByPath(path) {
  return publishingPagesByPath.get(path) ?? null;
}

export function getRelatedPages(page) {
  return (page.relatedPageIds ?? []).map((pageId) =>
    getPublishingPage(pageId)
  );
}

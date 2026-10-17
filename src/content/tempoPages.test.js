import {
  createTempoPage,
  getAllTempoPages,
  getDelayRows,
  getGenreMatches,
  getNeighbourTempos,
  getPitchShift,
  getTempoPageByPath,
  parseTempoSlug,
  tempoHubPage,
  TEMPO_MAX,
  TEMPO_MIN,
} from './tempoPages';

describe('tempo page maths', () => {
  it('computes beat, delay and Hz values', () => {
    const rows = getDelayRows(120);
    const quarter = rows.find((row) => row.label.startsWith('1/4'));
    const eighth = rows.find((row) => row.label === '1/8');

    expect(quarter.straight).toBe(500);
    expect(quarter.hertz).toBe(2);
    expect(eighth.dotted).toBe(375);
    expect(quarter.triplet).toBeCloseTo(333.333, 3);
  });

  it('expresses pitch changes in percent and semitones', () => {
    const shift = getPitchShift(124, 128);

    expect(shift.percent).toBeCloseTo(3.2258, 3);
    expect(shift.semitones).toBeCloseTo(0.5497, 3);
  });

  it('finds direct and half/double-time genre readings', () => {
    const at174 = getGenreMatches(174);
    const at87 = getGenreMatches(87);

    expect(at174.direct.map((range) => range.name)).toContain('drum and bass');
    expect(at87.asDoubleTime.map((range) => range.name)).toContain('drum and bass');
    expect(getGenreMatches(140).asHalfTime.map((range) => range.name)).toContain('hip-hop');
  });

  it('only accepts whole tempos inside the covered range', () => {
    expect(parseTempoSlug('128')).toBe(128);
    expect(parseTempoSlug('59')).toBeNull();
    expect(parseTempoSlug('201')).toBeNull();
    expect(parseTempoSlug('128.5')).toBeNull();
    expect(parseTempoSlug('abc')).toBeNull();
    expect(getTempoPageByPath('/bpm/0128')).toBeNull();
    expect(getTempoPageByPath('/bpm/128').heading).toBe('128 BPM');
  });

  it('links only to tempos that have a page', () => {
    for (let bpm = TEMPO_MIN; bpm <= TEMPO_MAX; bpm += 1) {
      getNeighbourTempos(bpm).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(TEMPO_MIN);
        expect(value).toBeLessThanOrEqual(TEMPO_MAX);
      });
    }
  });
});

describe('tempo pages', () => {
  const pages = getAllTempoPages();

  it('covers every tempo from 60 to 200 once', () => {
    expect(pages).toHaveLength(141);
    expect(new Set(pages.map((page) => page.path)).size).toBe(141);
  });

  it('gives every page a unique title, description and opening text', () => {
    const unique = (values) => new Set(values).size;

    expect(unique(pages.map((page) => page.title))).toBe(141);
    expect(unique(pages.map((page) => page.description))).toBe(141);
    expect(unique(pages.map((page) => page.sections[0].paragraphs.join(' ')))).toBe(141);
    expect(unique(pages.map((page) => page.sections[3].paragraphs.join(' ')))).toBe(141);
  });

  it('keeps titles and descriptions within search-result lengths', () => {
    pages.forEach((page) => {
      expect(page.title.length, page.path).toBeLessThanOrEqual(65);
      expect(page.description.length, page.path).toBeLessThanOrEqual(200);
    });
  });

  it('states whole-millisecond beats only when they are exact', () => {
    expect(createTempoPage(125).sections[0].paragraphs[0]).toContain('whole number of milliseconds, so delay');
    expect(createTempoPage(128).sections[0].paragraphs[0]).toContain('is not a whole number');
  });

  it('lists every tempo on the hub', () => {
    const hubLinks = tempoHubPage.sections.flatMap((section) => section.links);

    expect(hubLinks).toHaveLength(141);
    expect(hubLinks[0].href).toBe('/bpm/60');
    expect(hubLinks.at(-1).href).toBe('/bpm/200');
  });
});

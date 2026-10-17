// Where the manual AdSense units go, kept in one place so every layout and
// the prerendered HTML follow the same rules:
// - one in-article unit per long page, never directly under an interactive
//   tool: at least two content sections sit between the tool and the ad, and
//   at least one section follows it (Publisher Policies: no ads "adjacent to
//   navigational or other action items", support.google.com/publisherpolicies/answer/10502938);
// - one multiplex unit at the end of the article;
// - nothing on hubs (navigation screens) or trust/legal pages, which the same
//   policy lists as screens without publisher content.

export const AD_PAGE_CATEGORIES = Object.freeze(['tool', 'guide', 'tempo']);
export const MIN_WORDS_FOR_IN_ARTICLE = 300;

function countWords(page) {
  const parts = [page.lede ?? ''];

  page.sections.forEach((section) => {
    parts.push(
      section.heading,
      ...(section.paragraphs ?? []),
      ...(section.steps ?? []),
      ...(section.bullets ?? []),
      ...(section.table?.headers ?? []),
      ...(section.table?.rows.flat() ?? [])
    );
  });
  (page.faqs ?? []).forEach((faq) => parts.push(faq.question, faq.answer));

  return parts.join(' ').trim().split(/\s+/).filter(Boolean).length;
}

export function isAdEligiblePage(page) {
  return Boolean(page) && AD_PAGE_CATEGORIES.includes(page.category);
}

/**
 * Index of the section the in-article unit is rendered before, or -1.
 * Pages with an interactive tool above the content keep two sections of
 * reading between the tool and the ad; article pages keep one.
 */
export function getInArticleSectionIndex(page, { hasInteractiveTool = false } = {}) {
  if (!isAdEligiblePage(page)) {
    return -1;
  }

  const sectionCount = page.sections.length;
  const minimumIndex = hasInteractiveTool ? 2 : 1;
  const index = Math.max(minimumIndex, Math.floor(sectionCount / 2));

  if (index > sectionCount - 1 || countWords(page) < MIN_WORDS_FOR_IN_ARTICLE) {
    return -1;
  }

  return index;
}

export function shouldShowMultiplex(page) {
  return isAdEligiblePage(page);
}

export { countWords };

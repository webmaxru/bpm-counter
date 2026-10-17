/**
 * Drops trailing slashes so `/tools/metronome/` and `/tools/metronome` resolve
 * to the same page. The root path stays `/`.
 */
export function normalizeRoutePath(path) {
  const trimmed = String(path ?? '').replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** Detect throwaway sequence names created during testing or accidental clicks. */

const JUNK_EXACT = new Set([
  'test',
  'testing',
  'test123',
  'asdf',
  'asdfasdf',
  'qwerty',
  'zxcv',
  'demo',
  'untitled',
  'sequence',
  'new sequence',
  'aaa',
  'bbb',
  'xxx',
  '123',
  '111',
  'abc',
  'temp',
  'tmp',
  'delete me',
  'junk',
  'foo',
  'bar',
  'baz',
  'sample',
  'draft',
  'cadence',
  'new cadence',
]);

export function normalizeSequenceName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function isJunkSequenceName(name: string): boolean {
  const normalized = normalizeSequenceName(name).toLowerCase();
  if (!normalized) return true;
  if (normalized.length < 3) return true;
  if (JUNK_EXACT.has(normalized)) return true;
  if (/^(test|demo|asdf|xxx|tmp|temp|draft|sample)(\s|\d|$)/.test(normalized)) return true;
  if (/^(asdf|qwerty|zxcv)/.test(normalized)) return true;
  if (/^(.)\1{2,}$/.test(normalized.replace(/\s/g, ''))) return true;
  if (/^[0-9\s\-_.]+$/.test(normalized)) return true;
  return false;
}

export function sequenceNameError(name: string): string | null {
  const normalized = normalizeSequenceName(name);
  if (!normalized) return 'Enter a sequence name.';
  if (normalized.length > 120) return 'Name must be 120 characters or fewer.';
  if (isJunkSequenceName(normalized)) {
    return 'Use a descriptive name (e.g. "3-touch outbound") — test names are not saved.';
  }
  return null;
}

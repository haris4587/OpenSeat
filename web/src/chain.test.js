import { describe, it, expect } from 'vitest';
import { hashText, pinnedURL, parseJSON } from './chain';
describe('evidence commitments', () => {
  it('hashes exact UTF-8 bytes', async () => expect(await hashText('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
  it('requires immutable GitHub commit URLs', () => {
    expect(pinnedURL('https://raw.githubusercontent.com/a/b/'+'a'.repeat(40)+'/proof.md')).toBe(true);
    expect(pinnedURL('https://raw.githubusercontent.com/a/b/main/proof.md')).toBe(false);
    expect(pinnedURL('https://raw.githubusercontent.com/a/b/'+'a'.repeat(40)+'/../proof.md')).toBe(false);
  });
  it('decodes finalized JSON responses without inventing rows', () => expect(parseJSON('[]')).toEqual([]));
});

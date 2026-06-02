import rawWords from '../../../word-lists/english.txt?raw';

const byLength = new Map<number, string[]>();

for (const line of rawWords.split('\n')) {
  const word = line.trim().toUpperCase();
  if (word.length >= 3 && /^[A-Z]+$/.test(word)) {
    const bucket = byLength.get(word.length) ?? [];
    bucket.push(word);
    byLength.set(word.length, bucket);
  }
}

// Remove duplicates per bucket
for (const [len, words] of byLength) {
  byLength.set(len, [...new Set(words)]);
}

export function matchPattern(pattern: string): string[] {
  const upper = pattern.toUpperCase();
  const candidates = byLength.get(upper.length) ?? [];
  return candidates.filter(word => {
    for (let i = 0; i < upper.length; i++) {
      if (upper[i] !== '_' && upper[i] !== word[i]) return false;
    }
    return true;
  });
}

export function wordListStats(): { total: number; lengths: number[] } {
  let total = 0;
  const lengths: number[] = [];
  for (const [len, words] of byLength) {
    total += words.length;
    lengths.push(len);
  }
  return { total, lengths: lengths.sort((a, b) => a - b) };
}

let cache: Map<number, string[]> | null = null;

async function getByLength(): Promise<Map<number, string[]>> {
  if (cache) return cache;
  const res = await fetch('/word-lists/english.txt');
  const raw = await res.text();
  const byLength = new Map<number, string[]>();
  const seen = new Map<number, Set<string>>();
  for (const line of raw.split('\n')) {
    const word = line.trim().toUpperCase();
    if (word.length < 3 || !/^[A-Z]+$/.test(word)) continue;
    const len = word.length;
    if (!seen.has(len)) { seen.set(len, new Set()); byLength.set(len, []); }
    const s = seen.get(len)!;
    if (!s.has(word)) { s.add(word); byLength.get(len)!.push(word); }
  }
  cache = byLength;
  return cache;
}

export async function matchPattern(pattern: string): Promise<string[]> {
  const byLength = await getByLength();
  const words = byLength.get(pattern.length) ?? [];
  const results: string[] = [];
  for (const word of words) {
    let ok = true;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] !== '_' && pattern[i] !== word[i]) { ok = false; break; }
    }
    if (ok) results.push(word);
  }
  return results;
}

export async function wordListStats(): Promise<{ total: number; lengths: number[] }> {
  const byLength = await getByLength();
  let total = 0;
  for (const words of byLength.values()) total += words.length;
  return { total, lengths: [...byLength.keys()].sort((a, b) => a - b) };
}

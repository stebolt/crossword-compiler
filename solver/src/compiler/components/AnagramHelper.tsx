'use client';
import { useState, useCallback } from 'react';

let cachedIndex: Map<string, string[]> | null = null;
let loadPromise: Promise<Map<string, string[]>> | null = null;

async function getWordIndex(): Promise<Map<string, string[]>> {
  if (cachedIndex) return cachedIndex;
  if (loadPromise) return loadPromise;

  loadPromise = fetch('/word-lists/english.txt')
    .then(r => {
      if (!r.ok) throw new Error('not found');
      return r.text();
    })
    .then(text => {
      const index = new Map<string, string[]>();
      for (const line of text.split('\n')) {
        const word = line.trim().toUpperCase();
        if (word.length < 2 || /[^A-Z]/.test(word)) continue;
        const key = [...word].sort().join('');
        if (!index.has(key)) index.set(key, []);
        index.get(key)!.push(word);
      }
      cachedIndex = index;
      return index;
    });

  return loadPromise;
}

export function AnagramHelper() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    const letters = input.toUpperCase().replace(/[^A-Z]/g, '');
    if (!letters) return;
    setLoading(true);
    setError(null);
    try {
      const index = await getWordIndex();
      const key = [...letters].sort().join('');
      setResults(index.get(key) ?? []);
    } catch {
      setError('Could not load word list.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <div className="px-3 py-2.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Letters or phrase…"
          className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1 outline-none focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-500"
        />
        <button
          onClick={search}
          disabled={loading || !input.trim()}
          className="px-3 py-1 text-sm bg-gray-900 dark:bg-gray-600 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-500 disabled:opacity-40 transition-colors"
        >
          {loading ? '…' : 'Find'}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {results !== null && (
        <div className="mt-2">
          {results.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">No anagrams found.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {results.map(w => (
                <span key={w} className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useCallback } from 'react';

let cachedIndex: Map<string, string[]> | null = null;
let loadPromise: Promise<Map<string, string[]>> | null = null;

async function getWordIndex(): Promise<Map<string, string[]>> {
  if (cachedIndex) return cachedIndex;
  if (loadPromise) return loadPromise;

  loadPromise = fetch('/words.txt')
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
  const [isOpen, setIsOpen] = useState(false);
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
      setError('No word list found — add words.txt to compiler/public/.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [input]);

  return (
    <div className="border border-gray-200 rounded-md bg-white">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between hover:bg-gray-50 rounded-md"
      >
        Anagram Helper
        <span className="text-gray-400">{isOpen ? '▾' : '▸'}</span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Letters or phrase…"
              className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
            />
            <button
              onClick={search}
              disabled={loading || !input.trim()}
              className="px-3 py-1 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-40"
            >
              {loading ? '…' : 'Find'}
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

          {results !== null && (
            <div className="mt-2">
              {results.length === 0 ? (
                <p className="text-xs text-gray-400">No anagrams found.</p>
              ) : (
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {results.map(w => (
                    <span key={w} className="text-xs font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                      {w}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

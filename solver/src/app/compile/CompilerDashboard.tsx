'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Puzzle {
  id: string;
  title: string;
  author: string;
  status: 'draft' | 'published';
  updated_at: string;
  published_at: string | null;
}

interface Props {
  puzzles: Puzzle[];
}

export default function CompilerDashboard({ puzzles: initial }: Props) {
  const router = useRouter();
  const [puzzles, setPuzzles] = useState<Puzzle[]>(initial);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [darkMode] = useState(() => {
    try { return localStorage.getItem('cc-dark') === '1'; } catch { return false; }
  });

  async function handleNew() {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/puzzles', { method: 'POST' });
      const body = await res.json();
      if (res.ok) {
        router.push(`/compile/${body.id}`);
      } else {
        setError(`Failed to create puzzle: ${JSON.stringify(body)}`);
        setCreating(false);
      }
    } catch (e) {
      setError(`Error: ${e}`);
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this puzzle? This cannot be undone.')) return;
    await fetch(`/api/puzzles/${id}`, { method: 'DELETE' });
    setPuzzles(p => p.filter(x => x.id !== id));
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col${darkMode ? ' dark' : ''}`}>
      <header className="bg-gray-900 dark:bg-gray-950 text-white px-5 py-3 flex items-center gap-4 flex-shrink-0">
        <h1 className="text-xs font-medium tracking-tight text-gray-400 uppercase">Crossword Compiler</h1>
        <div className="w-px h-4 bg-gray-700" />
        <span className="text-sm font-semibold text-white">My Puzzles</span>
        <div className="ml-auto">
          <button
            onClick={handleNew}
            disabled={creating}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {creating ? 'Creating…' : '+ New Puzzle'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        {error && <p className="text-red-400 text-sm mb-4 bg-red-900/20 border border-red-700 rounded p-3">{error}</p>}
        {puzzles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 dark:text-gray-500 mb-4">No puzzles yet.</p>
            <button
              onClick={handleNew}
              disabled={creating}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              Create your first puzzle
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {puzzles.map(p => (
              <div
                key={p.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-5 py-4 flex items-center gap-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/compile/${p.id}`)}
                      className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors"
                    >
                      {p.title || 'Untitled'}
                    </button>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                      p.status === 'published'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Last saved {fmt(p.updated_at)}
                    {p.published_at && ` · Published ${fmt(p.published_at)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => router.push(`/compile/${p.id}`)}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    Open
                  </button>
                  {p.status === 'published' && (
                    <a
                      href={`/solve/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      Solve
                    </a>
                  )}
                  {p.status === 'draft' && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-xs hover:border-red-400 hover:text-red-500 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

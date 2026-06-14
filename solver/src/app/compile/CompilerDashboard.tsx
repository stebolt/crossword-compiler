'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppTabs from '@/components/AppTabs';
import type { SolverProgressRow } from './page';

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
  isAdmin?: boolean;
  userEmail?: string;
  solverProgress?: SolverProgressRow[];
}

export default function CompilerDashboard({ puzzles: initial, isAdmin, userEmail, solverProgress = [] }: Props) {
  const router = useRouter();
  const [puzzles, setPuzzles] = useState<Puzzle[]>(initial);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    try { setDarkMode(localStorage.getItem('cc-dark') === '1'); } catch {}
  }, []);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

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

  async function handleDelete(id: string, isPublished: boolean) {
    const msg = isPublished
      ? 'This puzzle is published and will be removed from the public solver. Delete anyway?'
      : 'Delete this puzzle? This cannot be undone.';
    if (!confirm(msg)) return;
    await fetch(`/api/puzzles/${id}`, { method: 'DELETE' });
    setPuzzles(p => p.filter(x => x.id !== id));
  }

  async function handleUnpublish(id: string) {
    if (!confirm('Unpublish this puzzle? It will no longer appear on the public solver.')) return;
    const res = await fetch(`/api/puzzles/${id}/unpublish`, { method: 'POST' });
    if (res.ok) {
      setPuzzles(p => p.map(x => x.id === id ? { ...x, status: 'draft', published_at: null } : x));
    }
  }

  function startRename(p: Puzzle) {
    setRenamingId(p.id);
    setRenameValue(p.title || '');
    setTimeout(() => renameInputRef.current?.select(), 0);
  }

  async function commitRename(id: string) {
    const title = renameValue.trim() || 'Untitled';
    setRenamingId(null);
    setPuzzles(p => p.map(x => x.id === id ? { ...x, title } : x));
    await fetch(`/api/puzzles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const progressByPuzzle = solverProgress.reduce<Record<string, SolverProgressRow[]>>((acc, row) => {
    (acc[row.puzzle_id] ??= []).push(row);
    return acc;
  }, {});

  return (
    <div className={`min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col${darkMode ? ' dark' : ''}`}>
      <header className="bg-gray-900 dark:bg-gray-950 text-white px-5 py-2 flex items-center text-sm flex-shrink-0 relative">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium tracking-tight text-gray-400 uppercase">Crosswords</span>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={handleNew}
            disabled={creating}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {creating ? 'Creating…' : '+ New Puzzle'}
          </button>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <AppTabs />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isAdmin && (
            <>
              <Link href="/compile/admin" className="text-xs text-gray-400 hover:text-white transition-colors">
                Invite
              </Link>
              <div className="w-px h-4 bg-gray-700" />
            </>
          )}
          {userEmail && (
            <>
              <span className="text-xs text-gray-500">{userEmail}</span>
              <div className="w-px h-4 bg-gray-700" />
            </>
          )}
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-gray-400 hover:text-white transition-colors text-xs">Sign out</button>
          </form>
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
                    {renamingId === p.id ? (
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(p.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitRename(p.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-gray-400 dark:border-gray-500 focus:outline-none focus:border-blue-500 min-w-0 flex-1"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => router.push(`/compile/${p.id}`)}
                        onDoubleClick={() => startRename(p)}
                        title="Double-click to rename"
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate transition-colors text-left"
                      >
                        {p.title || 'Untitled'}
                      </button>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                      p.status === 'published'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {p.author && <span className="text-gray-500 dark:text-gray-400">By {p.author} · </span>}
                    Last saved {fmt(p.updated_at)}
                    {p.published_at && ` · Published ${fmt(p.published_at)}`}
                  </p>
                  {p.status === 'published' && progressByPuzzle[p.id]?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {progressByPuzzle[p.id].map((row, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 dark:text-gray-400 truncate max-w-[200px]">
                            {row.user_email ?? 'Anonymous'}
                          </span>
                          {row.status === 'complete' ? (
                            <span className="text-green-500 dark:text-green-400 font-medium">
                              Complete{row.completed_at ? ` · ${fmtTime(row.completed_at)}` : ''}
                            </span>
                          ) : (
                            <span className="text-amber-500 dark:text-amber-400 font-medium">
                              In progress{row.started_at ? ` · started ${fmtTime(row.started_at)}` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startRename(p)}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    title="Rename"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => router.push(`/compile/${p.id}`)}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                  >
                    Edit
                  </button>
                  {p.status === 'published' && (
                    <button
                      onClick={() => handleUnpublish(p.id)}
                      className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-xs hover:border-amber-400 hover:text-amber-500 transition-colors"
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id, p.status === 'published')}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-xs hover:border-red-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import { useRef, useState } from 'react';
import type { Crossword } from '../../../shared/types';
import {
  loadLibrary,
  deleteLibraryEntry,
  libraryEntryFromCrossword,
  type LibraryEntry,
} from '../lib/puzzleLibrary';

interface Props {
  darkMode: boolean;
  onLoad: (entry: LibraryEntry) => void;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function PuzzleLibraryModal({ darkMode, onLoad, onClose }: Props) {
  const [entries, setEntries] = useState<LibraryEntry[]>(() =>
    loadLibrary().sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  );
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDelete(id: string) {
    deleteLibraryEntry(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    setConfirmDelete(null);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const crossword = JSON.parse(text) as Crossword;
      if (!crossword.meta?.id || !crossword.grid || !crossword.clues) {
        throw new Error('Not a valid crossword JSON file.');
      }
      const entry = libraryEntryFromCrossword(crossword);
      onLoad(entry);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse file.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50${darkMode ? ' dark' : ''}`}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[560px] max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Open Puzzle</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Import strip */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => { setImportError(null); fileRef.current?.click(); }}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Import JSON file…
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Load a previously exported or published crossword for re-editing.
          </span>
          {importError && (
            <span className="text-xs text-red-500">{importError}</span>
          )}
        </div>

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 px-5 py-8 text-center">
              No saved puzzles yet. Use Save to add the current puzzle.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {entries.map(entry => (
                <li key={entry.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {entry.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Saved {formatDate(entry.savedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {confirmDelete === entry.id ? (
                      <>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Delete?</span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onLoad(entry)}
                          className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => setConfirmDelete(entry.id)}
                          className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-500 transition-colors"
                          aria-label="Delete"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

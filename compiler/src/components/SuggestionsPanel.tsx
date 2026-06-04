import { useState, useRef } from 'react';
import type { Slot } from '../lib/cluePanelLogic';

interface Props {
  activeSlot: Slot | null;
  suggestions: string[];
  shoehorn: string[];
  onFill: (word: string, slot: Slot) => void;
  onAddShoehorn: (word: string) => void;
  onRemoveShoehorn: (word: string) => void;
}

export function SuggestionsPanel({
  activeSlot,
  suggestions,
  shoehorn,
  onFill,
  onAddShoehorn,
  onRemoveShoehorn,
}: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const shoehornSet = new Set(shoehorn);

  function handleAdd() {
    const word = input.trim().toUpperCase();
    if (word && /^[A-Z]+$/.test(word)) {
      onAddShoehorn(word);
      setInput('');
      inputRef.current?.focus();
    }
  }

  const pattern = activeSlot?.answer ?? null;
  const hasUnknowns = pattern?.includes('_') ?? false;

  return (
    <div className="flex flex-col h-full">
      {/* Shoehorn section */}
      <div className="px-3 pt-2.5 pb-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-500 mb-1.5">
          Theme words
        </p>
        {shoehorn.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {shoehorn.map(word => (
              <span
                key={word}
                className="inline-flex items-center gap-0.5 font-mono text-xs px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
              >
                {word}
                <button
                  onClick={() => onRemoveShoehorn(word)}
                  className="ml-0.5 text-amber-400 hover:text-amber-700 dark:hover:text-amber-200 leading-none"
                  aria-label={`Remove ${word}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-1">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value.replace(/[^a-zA-Z]/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            placeholder="Add word…"
            maxLength={15}
            className="flex-1 min-w-0 text-xs font-mono px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Suggestions section */}
      <div className="px-3 py-2.5 flex-1 overflow-y-auto min-h-0">
        {!activeSlot ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            Select a cell to see suggestions.
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-mono text-xs tracking-widest text-blue-600 dark:text-blue-400">{pattern}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                {activeSlot.num}{activeSlot.dir === 'across' ? 'A' : 'D'} · {activeSlot.length} letters
              </span>
            </div>
            {!hasUnknowns ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">Word is complete.</p>
            ) : suggestions.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">No matches in word list.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map(word => {
                  const isTheme = shoehornSet.has(word);
                  return (
                    <button
                      key={word}
                      onClick={() => onFill(word, activeSlot)}
                      className={`font-mono text-xs px-2 py-0.5 rounded border transition-colors ${
                        isTheme
                          ? 'border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {word}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

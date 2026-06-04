'use client';
import { useState, useRef } from 'react';

interface Props {
  shoehorn: string[];
  onAdd: (word: string) => void;
  onRemove: (word: string) => void;
}

export function ShoehornPanel({ shoehorn, onAdd, onRemove }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const word = input.trim().toUpperCase();
    if (word && /^[A-Z]+$/.test(word)) {
      onAdd(word);
      setInput('');
      inputRef.current?.focus();
    }
  }

  return (
    <div className="px-3 py-3">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Words you want to place in this puzzle. Matching words appear first in Suggestions.
      </p>

      <div className="flex gap-1 mb-3">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value.replace(/[^a-zA-Z]/g, ''))}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder="Add theme word…"
          maxLength={15}
          className="flex-1 min-w-0 text-xs font-mono px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-3 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-40 disabled:cursor-default transition-colors"
        >
          Add
        </button>
      </div>

      {shoehorn.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No theme words yet.</p>
      ) : (
        <ul className="space-y-1">
          {shoehorn.map((word, i) => (
            <li
              key={word}
              className="flex items-center gap-2 px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            >
              <span className="text-xs text-gray-400 dark:text-gray-500 w-4 text-right flex-shrink-0">{i + 1}</span>
              <span className="font-mono text-xs font-medium text-amber-800 dark:text-amber-300 flex-1">{word}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">{word.length} letters</span>
              <button
                onClick={() => onRemove(word)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition-colors leading-none"
                aria-label={`Remove ${word}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

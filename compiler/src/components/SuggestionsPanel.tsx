import type { Slot } from '../lib/cluePanelLogic';

interface Props {
  activeSlot: Slot | null;
  suggestions: string[];
  onFill: (word: string, slot: Slot) => void;
}

export function SuggestionsPanel({ activeSlot, suggestions, onFill }: Props) {
  if (!activeSlot) {
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500 italic px-3 py-4">
        Select a cell to see suggestions.
      </p>
    );
  }

  const pattern = activeSlot.answer;
  const hasUnknowns = pattern.includes('_');

  return (
    <div className="px-3 py-2.5">
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
          {suggestions.map(word => (
            <button
              key={word}
              onClick={() => onFill(word, activeSlot)}
              className="font-mono text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {word}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

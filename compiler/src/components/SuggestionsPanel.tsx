import type { Slot } from '../lib/cluePanelLogic';

interface Props {
  activeSlot: Slot | null;
  suggestions: string[];
  onFill: (word: string, slot: Slot) => void;
}

export function SuggestionsPanel({ activeSlot, suggestions, onFill }: Props) {
  if (!activeSlot) return null;

  const pattern = activeSlot.answer;
  const hasUnknowns = pattern.includes('_');

  return (
    <div className="bg-white border border-gray-200 rounded-md px-3 py-2 w-[544px]">
      <div className="flex items-baseline gap-3 mb-1.5">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggestions</span>
        <span className="font-mono text-xs tracking-widest text-blue-600">{pattern}</span>
        <span className="text-xs text-gray-400 ml-auto">{activeSlot.num}{activeSlot.dir === 'across' ? 'A' : 'D'} · {activeSlot.length} letters</span>
      </div>

      {!hasUnknowns ? (
        <p className="text-xs text-gray-400 italic">Word is complete.</p>
      ) : suggestions.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No matches in word list.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {suggestions.map(word => (
            <button
              key={word}
              onClick={() => onFill(word, activeSlot)}
              className="font-mono text-xs px-2 py-0.5 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-gray-700 transition-colors"
            >
              {word}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

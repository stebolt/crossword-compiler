'use client';

interface Props {
  onClose: () => void;
}

const sections = [
  {
    heading: 'Grid navigation',
    body: 'Click a cell to select it. Arrow keys move the cursor; the current direction (Across / Down) is shown below the grid. Click the same cell twice to toggle direction. Space or Tab advances to the next cell in the current word. Shift+Tab moves back.',
  },
  {
    heading: 'Toggling black cells',
    body: 'Hold ⌘ (Mac) or Ctrl and click a white cell to make it black. Its 180° mirror cell turns black automatically to maintain rotational symmetry. Repeat to toggle back to white.',
  },
  {
    heading: 'Saving',
    body: 'Your puzzle auto-saves to the cloud 2 seconds after every change — you never need to think about it. The Save button in the header triggers an immediate save if you want reassurance. The status ("Saving…" / "Saved ✓") appears next to it.',
  },
  {
    heading: 'Suggestions',
    body: 'As you fill cells, the Suggestions tab shows words from the dictionary that match the current slot\'s pattern (e.g. B_A_K). Click any suggestion to fill the slot instantly. Results update as you type.',
  },
  {
    heading: 'Theme words (Shoehorn)',
    body: 'The Theme tab holds a list of words you want to place in this puzzle — names, a theme set, or any words you\'re building around. When one of these words fits the current slot\'s pattern it floats to the top of Suggestions highlighted in amber. Theme words are checked directly against the slot, so they surface even if they\'re not in the main dictionary.',
  },
  {
    heading: 'Clue panel',
    body: 'The right-hand panel lists every numbered slot (Across then Down). Click a slot to jump the grid cursor there. Write your clue in the text field; add an optional word-length breakdown (e.g. 3,4) in the enumeration field — it validates against the slot length. Set the status to Drafted or Confirmed as you work. All slots must be Confirmed before you can publish.',
  },
  {
    heading: 'Anagram helper',
    body: 'Open the Anagram tab and type a word or phrase. It returns every anagram of those letters that appears in the word list — useful for finding anagram-based wordplay.',
  },
  {
    heading: 'Wordplay helper',
    body: 'The Wordplay tab gives quick-reference lists of anagram indicators, containment indicators, abbreviations, and other cryptic crossword devices.',
  },
  {
    heading: 'Publishing',
    body: 'Click Publish in the header when your puzzle is ready. The compiler checks that every cell is filled and every clue is confirmed — any gaps are listed so you can fix them. Once published, the puzzle appears immediately on the public solver for anyone to solve.',
  },
];

export function HelpModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Compiler guide</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {sections.map(s => (
            <div key={s.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-500 dark:text-blue-400 mb-1">
                {s.heading}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

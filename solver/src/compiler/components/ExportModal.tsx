'use client';

interface Props {
  mode: 'errors' | 'published' | 'confirm';
  errors?: string[];
  puzzleId?: string;
  puzzleTitle?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export function ExportModal({ mode, errors, puzzleId, puzzleTitle, onClose, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[480px] max-w-[90vw] p-6"
        onClick={e => e.stopPropagation()}
      >
        {mode === 'confirm' && (
          <>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Clear the grid?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">This will erase all cells and clues. It cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={onConfirm} className="px-4 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700 transition-colors">Clear</button>
            </div>
          </>
        )}

        {mode === 'errors' && (
          <>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Cannot publish</h2>
            <ul className="space-y-1 mb-5">
              {errors!.map((err, i) => (
                <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                  <span className="mt-0.5">✗</span><span>{err}</span>
                </li>
              ))}
            </ul>
            <button onClick={onClose} className="px-4 py-1.5 rounded bg-gray-900 dark:bg-gray-600 text-white text-sm hover:bg-gray-700 transition-colors">OK</button>
          </>
        )}

        {mode === 'published' && (
          <>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Published ✓</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              <span className="font-medium text-gray-700 dark:text-gray-300">{puzzleTitle || 'Untitled'}</span> is now live on the puzzle index.
            </p>
            <div className="flex gap-2">
              <a
                href={`/solve/${puzzleId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
              >
                View puzzle
              </a>
              <button onClick={onClose} className="px-4 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

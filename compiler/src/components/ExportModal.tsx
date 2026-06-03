import type { CrosswordMeta } from '../../../shared/types';

interface Props {
  mode: 'errors' | 'publish' | 'confirm';
  errors?: string[];
  publishedMeta?: CrosswordMeta;
  filename?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export function ExportModal({ mode, errors, publishedMeta, filename, onClose, onConfirm }: Props) {
  const manifestEntry = publishedMeta
    ? JSON.stringify(publishedMeta, null, 2)
    : '';

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[520px] max-w-[90vw] p-6"
        onClick={e => e.stopPropagation()}
      >
        {mode === 'confirm' && (
          <>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Clear the grid?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">This will erase all cells and clues. It cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </>
        )}

        {mode === 'errors' && (
          <>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Cannot publish</h2>
            <ul className="space-y-1 mb-5">
              {errors!.map((err, i) => (
                <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                  <span className="mt-0.5">✗</span>
                  <span>{err}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-gray-900 dark:bg-gray-600 text-white text-sm hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors"
            >
              OK
            </button>
          </>
        )}

        {mode === 'publish' && (
          <>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Published — next steps</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              File downloaded as <code className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1 rounded text-xs">{filename}</code>
            </p>

            <ol className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <li>
                <span className="font-medium">1. Move the file</span>
                <div className="mt-1 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-300">
                  solver/public/crosswords/{publishedMeta!.id}.json
                </div>
              </li>
              <li>
                <span className="font-medium">2. Add this entry to <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">solver/public/crosswords/crosswords.json</code></span>
                <pre className="mt-1 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-xs text-gray-600 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {manifestEntry}
                </pre>
              </li>
            </ol>

            <button
              onClick={onClose}
              className="mt-5 px-4 py-1.5 rounded bg-gray-900 dark:bg-gray-600 text-white text-sm hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

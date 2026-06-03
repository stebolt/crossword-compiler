import { useMemo, useState, useEffect } from 'react';
import { TEMPLATES } from './lib/gridLogic';
import type { Template } from './lib/gridLogic';
import { getSlots } from './lib/cluePanelLogic';
import { validateCrossword, buildCrossword, downloadJson } from './lib/crosswordExport';
import { useGrid } from './hooks/useGrid';
import { useClues } from './hooks/useClues';
import { useMeta } from './hooks/useMeta';
import { useAutofill } from './hooks/useAutofill';
import { Grid } from './components/Grid';
import { CluePanel } from './components/CluePanel';
import { AnagramHelper } from './components/AnagramHelper';
import { WordplayHelper } from './components/WordplayHelper';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { ExportModal } from './components/ExportModal';
import type { CrosswordMeta } from '../../shared/types';

type HelperTab = 'suggestions' | 'wordplay' | 'anagram';

const HELPER_TABS: { id: HelperTab; label: string }[] = [
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'wordplay', label: 'Wordplay' },
  { id: 'anagram', label: 'Anagram' },
];

export default function App() {
  const {
    grid, cursor, setCursor, direction, setDirection,
    numbers, toggleBlack, setCell, fillWord, advance,
    applyTemplate, clearGrid,
  } = useGrid();

  const { getClue, updateClue, resetClues } = useClues();
  const { meta, setTitle } = useMeta();

  const slots = useMemo(() => getSlots(grid, numbers), [grid, numbers]);
  const { activeSlot, suggestions } = useAutofill(slots, cursor, direction);

  // Dark mode — persisted
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('cc-dark') === '1'; } catch { return false; }
  });
  const toggleDark = () => setDarkMode(d => {
    const next = !d;
    try { localStorage.setItem('cc-dark', next ? '1' : '0'); } catch {}
    return next;
  });

  // Helper panel tabs
  const [helperTab, setHelperTab] = useState<HelperTab>('suggestions');
  useEffect(() => {
    if (activeSlot) setHelperTab('suggestions');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlot?.num, activeSlot?.dir]);

  // Template load guard
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);

  const isCompilationInProgress = useMemo(() => {
    const hasLetters = grid.some(row => row.some(cell => cell !== '' && cell !== '#'));
    const hasClues = slots.some(s => getClue(s.num, s.dir).clue.trim() !== '');
    return hasLetters || hasClues;
  }, [grid, slots, getClue]);

  const handleTemplateSelect = (template: Template) => {
    if (isCompilationInProgress) {
      setPendingTemplate(template);
    } else {
      applyTemplate(template.grid);
      resetClues();
    }
  };

  const confirmLoadTemplate = () => {
    if (!pendingTemplate) return;
    applyTemplate(pendingTemplate.grid);
    resetClues();
    setPendingTemplate(null);
  };

  // Export / publish modals
  const [modal, setModal] = useState<
    | { mode: 'errors'; errors: string[] }
    | { mode: 'publish'; meta: CrosswordMeta; filename: string }
    | { mode: 'confirm' }
    | null
  >(null);

  function handleExport() {
    const crossword = buildCrossword(grid, slots, getClue, meta);
    downloadJson(crossword, `${crossword.meta.id}.json`);
  }

  function handlePublish() {
    const { valid, errors } = validateCrossword(slots, getClue);
    if (!valid) {
      setModal({ mode: 'errors', errors });
      return;
    }
    const crossword = buildCrossword(grid, slots, getClue, meta);
    const filename = `${crossword.meta.id}.json`;
    downloadJson(crossword, filename);
    setModal({ mode: 'publish', meta: crossword.meta, filename });
  }

  const dirLabel = direction === 'across' ? '→ Across' : '↓ Down';
  const cursorNum = numbers.get(`${cursor.row},${cursor.col}`);

  return (
    <div className={`h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 flex flex-col${darkMode ? ' dark' : ''}`}>
      {modal && (
        <ExportModal
          mode={modal.mode}
          errors={modal.mode === 'errors' ? modal.errors : undefined}
          publishedMeta={modal.mode === 'publish' ? modal.meta : undefined}
          filename={modal.mode === 'publish' ? modal.filename : undefined}
          onClose={() => setModal(null)}
          onConfirm={modal.mode === 'confirm' ? () => { clearGrid(); resetClues(); setModal(null); } : undefined}
        />
      )}

      {/* Template load confirmation */}
      {pendingTemplate && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setPendingTemplate(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Load "{pendingTemplate.name}" template?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This will clear your current grid and all clues.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingTemplate(null)}
                className="px-4 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLoadTemplate}
                className="px-4 py-1.5 rounded bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors"
              >
                Load Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single header bar */}
      <header className="bg-gray-900 dark:bg-gray-950 text-white px-5 py-2 flex items-center gap-3 text-sm flex-shrink-0">
        {/* App name — muted, secondary */}
        <h1 className="text-xs font-medium tracking-tight text-gray-400 flex-shrink-0 uppercase">Crossword Compiler</h1>
        <div className="w-px h-4 bg-gray-700 flex-shrink-0" />
        {/* Puzzle title — primary, takes available space */}
        <input
          value={meta.title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 min-w-0 text-base font-semibold bg-transparent border-b border-transparent hover:border-gray-600 focus:border-gray-400 focus:outline-none placeholder-gray-600 text-white"
          placeholder="Untitled puzzle"
          aria-label="Puzzle title"
        />
        {/* Right-aligned controls */}
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          <div className="w-px h-4 bg-gray-700" />
          <span className="text-gray-400">Template:</span>
          <select
            value=""
            onChange={e => {
              const template = TEMPLATES.find(t => t.name === e.target.value);
              if (template) handleTemplateSelect(template);
            }}
            className="text-sm border border-gray-700 rounded px-2 py-0.5 bg-gray-800 text-gray-200 cursor-pointer outline-none hover:border-gray-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Load template…</option>
            {TEMPLATES.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => setModal({ mode: 'confirm' })}
            className="px-2.5 py-0.5 rounded border border-gray-700 text-gray-300 hover:border-red-500 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={handleExport}
            className="px-2.5 py-0.5 rounded border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={handlePublish}
            className="px-2.5 py-0.5 rounded bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
          >
            Publish
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={toggleDark}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="px-2.5 py-0.5 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            {darkMode ? '☀ Light' : '☾ Dark'}
          </button>
        </div>
      </header>

      {/* Main — two columns */}
      <main className="flex-1 flex gap-5 p-5 overflow-hidden min-h-0">
        {/* Left — grid + helpers */}
        <div className="flex flex-col gap-3 flex-shrink-0 min-h-0">
          <Grid
            grid={grid}
            cursor={cursor}
            setCursor={setCursor}
            direction={direction}
            setDirection={setDirection}
            numbers={numbers}
            toggleBlack={toggleBlack}
            setCell={setCell}
            advance={advance}
          />
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-0.5 -mt-1 select-none pointer-events-none">
            <span className="font-medium text-blue-500 dark:text-blue-400">{dirLabel}</span>
            {cursorNum != null && <span>· {cursorNum}{direction === 'across' ? 'A' : 'D'}</span>}
          </div>

          {/* Tabbed helper panel — fills remaining height, scrolls internally */}
          <div className="w-[544px] flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 overflow-hidden">
            <div className="flex border-b border-gray-100 dark:border-gray-700 shrink-0">
              {HELPER_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setHelperTab(tab.id)}
                  className={`flex-1 px-2 py-1.5 text-xs font-semibold transition-colors ${
                    helperTab === tab.id
                      ? 'text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-b-2 border-blue-500 -mb-px'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {helperTab === 'suggestions' && (
                <SuggestionsPanel activeSlot={activeSlot} suggestions={suggestions} onFill={fillWord} />
              )}
              {helperTab === 'wordplay' && <WordplayHelper />}
              {helperTab === 'anagram' && <AnagramHelper />}
            </div>
          </div>
        </div>

        {/* Right — clue panel */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <CluePanel
            slots={slots}
            getClue={getClue}
            updateClue={updateClue}
            cursor={cursor}
            direction={direction}
            setCursor={setCursor}
            setDirection={setDirection}
          />
        </div>
      </main>
    </div>
  );
}

'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TEMPLATES } from './lib/gridLogic';
import type { Template } from './lib/gridLogic';
import { getSlots } from './lib/cluePanelLogic';
import { validateCrossword } from './lib/crosswordExport';
import { savePuzzle, publishPuzzle } from './lib/puzzleLibrary';
import { useGrid } from './hooks/useGrid';
import { useClues } from './hooks/useClues';
import { useMeta } from './hooks/useMeta';
import { useAutofill } from './hooks/useAutofill';
import { useShoehorn } from './hooks/useShoehorn';
import { Grid } from './components/Grid';
import { CluePanel } from './components/CluePanel';
import { AnagramHelper } from './components/AnagramHelper';
import { WordplayHelper } from './components/WordplayHelper';
import { SuggestionsPanel } from './components/SuggestionsPanel';
import { ShoehornPanel } from './components/ShoehornPanel';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import type { CellValue } from '../../../shared/types';
import type { ClueEntry } from './hooks/useClues';

type HelperTab = 'suggestions' | 'wordplay' | 'anagram' | 'shoehorn';

const HELPER_TABS: { id: HelperTab; label: string }[] = [
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'shoehorn', label: 'Theme' },
  { id: 'wordplay', label: 'Wordplay' },
  { id: 'anagram', label: 'Anagram' },
];

interface InitialData {
  grid?: CellValue[][];
  clues?: Record<string, ClueEntry>;
  meta?: { id: string; title: string; author: string };
  shoehorn?: string[];
  status?: string;
  symmetry?: boolean;
}

interface Props {
  puzzleId: string;
  initial?: InitialData;
  darkMode: boolean;
  onToggleDark: () => void;
}

export function CompilerApp({ puzzleId, initial, darkMode, onToggleDark }: Props) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(initial?.status === 'published');

  const {
    grid, cursor, setCursor, direction, setDirection,
    numbers, toggleBlack, setCell, fillWord, advance,
    applyTemplate, clearGrid,
  } = useGrid(initial?.grid);

  const { clues, getClue, updateClue, resetClues, loadCluesState } = useClues(initial?.clues);
  const { meta, setTitle, setAuthor, resetMeta } = useMeta(initial?.meta);
  const { shoehorn, addWord: addShoehorn, removeWord: removeShoehorn, resetShoehorn, loadShoehornState } = useShoehorn(initial?.shoehorn);
  const [symmetry, setSymmetry] = useState(initial?.symmetry ?? true);

  const handleToggleBlack = useCallback(
    (row: number, col: number) => toggleBlack(row, col, symmetry),
    [toggleBlack, symmetry]
  );

  const slots = useMemo(() => getSlots(grid, numbers), [grid, numbers]);
  const { activeSlot, suggestions } = useAutofill(slots, cursor, direction, shoehorn);

  // Auto-save: debounce 2s, then PATCH to API
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const triggerSave = useCallback((immediate = false) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const doSave = async () => {
      setSaveStatus('saving');
      try {
        await savePuzzle(puzzleId, { title: meta.title, author: meta.author, grid, clues, shoehorn, symmetry });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    };
    if (immediate) {
      doSave();
    } else {
      saveTimerRef.current = setTimeout(doSave, 2000);
    }
  }, [puzzleId, meta.title, meta.author, grid, clues, shoehorn]);

  useEffect(() => {
    triggerSave(false);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, clues, meta.title, meta.author, shoehorn, symmetry]);

  // Helper tabs
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

  // Export / publish modal
  const [modal, setModal] = useState<
    | { mode: 'errors'; errors: string[] }
    | { mode: 'published' }
    | { mode: 'confirm' }
    | null
  >(null);

  async function handlePublish() {
    const { valid, errors } = validateCrossword(slots, getClue);
    if (!valid) { setModal({ mode: 'errors', errors }); return; }
    // Save immediately before publishing
    await savePuzzle(puzzleId, { title: meta.title, author: meta.author, grid, clues, shoehorn, symmetry });
    const result = await publishPuzzle(puzzleId);
    if (!result.ok) { setModal({ mode: 'errors', errors: result.errors ?? ['Publish failed'] }); return; }
    setIsPublished(true);
    setModal({ mode: 'published' });
  }

  const dirLabel = direction === 'across' ? '→ Across' : '↓ Down';
  const cursorNum = numbers.get(`${cursor.row},${cursor.col}`);

  const saveLabel = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'error' ? 'Save failed' : 'Save';

  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className={`h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 flex flex-col${darkMode ? ' dark' : ''}`}>
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {modal && (
        <ExportModal
          mode={modal.mode === 'errors' ? 'errors' : modal.mode === 'published' ? 'published' : 'confirm'}
          errors={modal.mode === 'errors' ? modal.errors : undefined}
          puzzleId={modal.mode === 'published' ? puzzleId : undefined}
          puzzleTitle={modal.mode === 'published' ? meta.title : undefined}
          onClose={() => setModal(null)}
          onConfirm={modal.mode === 'confirm' ? () => { clearGrid(); resetClues(); setModal(null); } : undefined}
        />
      )}

      {pendingTemplate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPendingTemplate(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Load &quot;{pendingTemplate.name}&quot; template?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">This will clear your current grid and all clues.</p>
            <div className="flex gap-2">
              <button onClick={() => setPendingTemplate(null)} className="px-4 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={confirmLoadTemplate} className="px-4 py-1.5 rounded bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors">Load Template</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 dark:bg-gray-950 text-white px-5 py-2 flex items-center gap-3 text-sm flex-shrink-0">
        <button
          onClick={() => router.push('/compile')}
          className="text-xs font-medium tracking-tight text-gray-400 hover:text-white transition-colors uppercase flex-shrink-0"
        >
          ← My Puzzles
        </button>
        <div className="w-px h-4 bg-gray-700 flex-shrink-0" />
        <input
          value={meta.title}
          onChange={e => setTitle(e.target.value)}
          className="flex-1 min-w-0 text-base font-semibold bg-transparent border-b border-transparent hover:border-gray-600 focus:border-gray-400 focus:outline-none placeholder-gray-600 text-white"
          placeholder="Untitled puzzle"
          aria-label="Puzzle title"
        />
        <input
          value={meta.author}
          onChange={e => setAuthor(e.target.value)}
          className="w-36 text-sm bg-transparent border-b border-transparent hover:border-gray-600 focus:border-gray-400 focus:outline-none placeholder-gray-600 text-gray-300"
          placeholder="Setter name…"
          aria-label="Setter name"
        />

        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs ${saveStatus === 'error' ? 'text-red-400' : 'text-gray-500'}`}>{saveStatus !== 'idle' ? saveLabel : ''}</span>
          <button
            onClick={() => triggerSave(true)}
            className="px-2.5 py-0.5 rounded border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
          >
            Save
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button onClick={handlePublish} className="px-2.5 py-0.5 rounded bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
            Publish
          </button>
          <div className="w-px h-4 bg-gray-700" />
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
            onClick={() => setSymmetry(false)}
            disabled={!symmetry}
            className={`px-2.5 py-0.5 rounded border transition-colors ${
              symmetry
                ? 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                : 'border-gray-700 text-gray-600 cursor-not-allowed'
            }`}
          >
            {symmetry ? 'Go Freestyle' : 'Freestyle'}
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={() => setHelpOpen(true)}
            className="px-2.5 py-0.5 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            Help
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <button
            onClick={onToggleDark}
            className="px-2.5 py-0.5 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            {darkMode ? '☀ Light' : '☾ Dark'}
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-gray-400 hover:text-white transition-colors text-xs">Sign out</button>
          </form>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex gap-5 p-5 overflow-hidden min-h-0">
        <div className="flex flex-col gap-3 flex-shrink-0 min-h-0">
          <Grid
            grid={grid}
            cursor={cursor}
            setCursor={setCursor}
            direction={direction}
            setDirection={setDirection}
            numbers={numbers}
            toggleBlack={handleToggleBlack}
            setCell={setCell}
            advance={advance}
          />
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-0.5 -mt-1 select-none pointer-events-none">
            <span className="font-medium text-blue-500 dark:text-blue-400">{dirLabel}</span>
            {cursorNum != null && <span>· {cursorNum}{direction === 'across' ? 'A' : 'D'}</span>}
          </div>

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
                <SuggestionsPanel activeSlot={activeSlot} suggestions={suggestions} shoehorn={shoehorn} onFill={fillWord} />
              )}
              {helperTab === 'wordplay' && <WordplayHelper />}
              {helperTab === 'anagram' && <AnagramHelper />}
              {helperTab === 'shoehorn' && (
                <ShoehornPanel shoehorn={shoehorn} onAdd={addShoehorn} onRemove={removeShoehorn} />
              )}
            </div>
          </div>
        </div>

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

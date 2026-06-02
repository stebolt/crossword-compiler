import { useMemo } from 'react';
import { TEMPLATES } from './lib/gridLogic';
import { getSlots } from './lib/cluePanelLogic';
import { useGrid } from './hooks/useGrid';
import { useClues } from './hooks/useClues';
import { useMeta } from './hooks/useMeta';
import { Grid } from './components/Grid';
import { CluePanel } from './components/CluePanel';
import { AnagramHelper } from './components/AnagramHelper';
import { WordplayHelper } from './components/WordplayHelper';

export default function App() {
  const {
    grid, cursor, setCursor, direction, setDirection,
    numbers, toggleBlack, setCell, advance,
    applyTemplate, clearGrid,
  } = useGrid();

  const { getClue, updateClue, resetClues } = useClues();
  const { meta, setTitle } = useMeta();

  const slots = useMemo(() => getSlots(grid, numbers), [grid, numbers]);

  const dirLabel = direction === 'across' ? '→ Across' : '↓ Down';
  const cursorNum = numbers.get(`${cursor.row},${cursor.col}`);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white px-5 py-3 flex items-center gap-4">
        <h1 className="text-lg font-semibold tracking-tight flex-shrink-0">Crossword Compiler</h1>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-5 py-2 flex items-center gap-4 text-sm">
        <span className="text-gray-500 font-medium">Template:</span>
        {TEMPLATES.map(t => (
          <button
            key={t.name}
            onClick={() => { applyTemplate(t.grid); resetClues(); }}
            className="px-3 py-1 rounded border border-gray-300 hover:border-gray-500 hover:bg-gray-50 text-gray-700 transition-colors"
          >
            {t.name}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button
          onClick={() => { clearGrid(); resetClues(); }}
          className="px-3 py-1 rounded border border-gray-300 hover:border-red-400 hover:text-red-600 hover:bg-red-50 text-gray-700 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Main — two columns */}
      <main className="flex-1 flex gap-5 p-5 overflow-hidden min-h-0">
        {/* Left — grid + helpers */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          <input
            value={meta.title}
            onChange={e => setTitle(e.target.value)}
            className="text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none placeholder-gray-300 w-[544px]"
            placeholder="Untitled"
            aria-label="Puzzle title"
          />
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
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="font-medium text-blue-600">{dirLabel}</span>
            {cursorNum != null && <span>{cursorNum} {direction}</span>}
            <span>({cursor.row + 1}, {cursor.col + 1})</span>
          </div>
          <AnagramHelper />
          <WordplayHelper />
        </div>

        {/* Right — clue panel */}
        <div className="flex flex-col min-h-0">
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

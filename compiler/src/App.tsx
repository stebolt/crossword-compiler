import { TEMPLATES } from './lib/gridLogic';
import { useGrid } from './hooks/useGrid';
import { Grid } from './components/Grid';

export default function App() {
  const {
    grid, cursor, setCursor, direction, setDirection,
    numbers, toggleBlack, setCell, advance,
    applyTemplate, clearGrid,
  } = useGrid();

  const dirLabel = direction === 'across' ? '→ Across' : '↓ Down';
  const cursorNum = numbers.get(`${cursor.row},${cursor.col}`);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white px-5 py-3 flex items-center gap-6">
        <h1 className="text-lg font-semibold tracking-tight">Crossword Compiler</h1>
        <span className="text-gray-400 text-sm">Phase 1 — Grid Editor</span>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-5 py-2 flex items-center gap-4 text-sm">
        <span className="text-gray-500 font-medium">Template:</span>
        {TEMPLATES.map(t => (
          <button
            key={t.name}
            onClick={() => applyTemplate(t.grid)}
            className="px-3 py-1 rounded border border-gray-300 hover:border-gray-500 hover:bg-gray-50 text-gray-700 transition-colors"
          >
            {t.name}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button
          onClick={clearGrid}
          className="px-3 py-1 rounded border border-gray-300 hover:border-red-400 hover:text-red-600 hover:bg-red-50 text-gray-700 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Main */}
      <main className="flex-1 flex gap-8 p-6">
        {/* Grid + status */}
        <div className="flex flex-col gap-3">
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
          {/* Status bar */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="font-medium text-blue-600">{dirLabel}</span>
            {cursorNum != null && (
              <span>{cursorNum} {direction}</span>
            )}
            <span>({cursor.row + 1}, {cursor.col + 1})</span>
          </div>
        </div>

        {/* Help */}
        <aside className="text-sm text-gray-500 space-y-1 pt-1 w-48">
          <p className="font-semibold text-gray-700 mb-2">Keyboard</p>
          <p><kbd className="kbd">A–Z</kbd> Type letter</p>
          <p><kbd className="kbd">Space</kbd> Toggle black</p>
          <p><kbd className="kbd">←↑→↓</kbd> Navigate</p>
          <p><kbd className="kbd">Bksp</kbd> Clear &amp; back</p>
          <p><kbd className="kbd">Del</kbd> Clear cell</p>
          <p className="pt-2 text-gray-400">Click a cell to select.<br />Click again to flip direction.<br />Click a black cell to unblack.</p>
        </aside>
      </main>
    </div>
  );
}

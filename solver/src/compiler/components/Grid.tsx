'use client';
import { useRef, useMemo, useEffect } from 'react';
import type { CellValue, Direction } from '../../../../shared/types';
import { SIZE, getWordCells, mirrorCell } from '../lib/gridLogic';

interface Props {
  grid: CellValue[][];
  cursor: { row: number; col: number };
  setCursor: (c: { row: number; col: number }) => void;
  direction: Direction;
  setDirection: (d: Direction) => void;
  numbers: Map<string, number>;
  toggleBlack: (row: number, col: number) => void;
  setCell: (row: number, col: number, value: string) => void;
  advance: (row: number, col: number, dir: Direction, reverse?: boolean) => { row: number; col: number };
}

export function Grid({
  grid, cursor, setCursor, direction, setDirection,
  numbers, toggleBlack, setCell, advance,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const wordCells = useMemo(
    () => getWordCells(grid, cursor.row, cursor.col, direction),
    [grid, cursor, direction],
  );

  const handleClick = (row: number, col: number) => {
    ref.current?.focus();
    if (grid[row][col] === '#') {
      toggleBlack(row, col);
      setCursor({ row, col });
      return;
    }
    if (cursor.row === row && cursor.col === col) {
      setDirection(direction === 'across' ? 'down' : 'across');
    } else {
      setCursor({ row, col });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const { row, col } = cursor;

    if (e.key === ' ') {
      e.preventDefault();
      toggleBlack(row, col);
      const next = advance(row, col, direction);
      if (next.row !== row || next.col !== col) setCursor(next);
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (direction !== 'across') { setDirection('across'); return; }
      if (col > 0) {
        for (let c = col - 1; c >= 0; c--) {
          if (grid[row][c] !== '#') { setCursor({ row, col: c }); break; }
        }
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (direction !== 'across') { setDirection('across'); return; }
      if (col < SIZE - 1) {
        for (let c = col + 1; c < SIZE; c++) {
          if (grid[row][c] !== '#') { setCursor({ row, col: c }); break; }
        }
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (direction !== 'down') { setDirection('down'); return; }
      if (row > 0) {
        for (let r = row - 1; r >= 0; r--) {
          if (grid[r][col] !== '#') { setCursor({ row: r, col }); break; }
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (direction !== 'down') { setDirection('down'); return; }
      if (row < SIZE - 1) {
        for (let r = row + 1; r < SIZE; r++) {
          if (grid[r][col] !== '#') { setCursor({ row: r, col }); break; }
        }
      }
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      if (grid[row][col] !== '' && grid[row][col] !== '#') {
        setCell(row, col, '');
      } else if (e.key === 'Backspace') {
        const prev = advance(row, col, direction, true);
        if (prev.row !== row || prev.col !== col) {
          setCell(prev.row, prev.col, '');
          setCursor(prev);
        }
      }
      return;
    }

    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      if (grid[row][col] === '#') return;
      setCell(row, col, e.key.toUpperCase());
      const next = advance(row, col, direction);
      if (next.row !== row || next.col !== col) setCursor(next);
      return;
    }
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${SIZE}, 36px)`,
          gridTemplateRows: `repeat(${SIZE}, 36px)`,
          width: 'fit-content',
        }}
        className="border-2 border-gray-900 dark:border-gray-500"
      >
        {grid.map((rowArr, r) =>
          rowArr.map((cell, c) => {
            const key = `${r},${c}`;
            const isBlack = cell === '#';
            const isCursor = cursor.row === r && cursor.col === c;
            const isWord = wordCells.has(key);
            const num = numbers.get(key);
            const [mr, mc] = mirrorCell(r, c);
            const mirrorVal = grid[mr][mc];
            const isSymmetricGhost = !isBlack && cell === '' && mirrorVal !== '' && mirrorVal !== '#';

            let bg = 'bg-white dark:bg-gray-700';
            if (isBlack) bg = 'bg-gray-900 dark:bg-gray-950';
            else if (isCursor) bg = 'bg-blue-500 dark:bg-blue-500';
            else if (isWord) bg = 'bg-blue-100 dark:bg-blue-900/50';
            else if (isSymmetricGhost) bg = 'bg-gray-200 dark:bg-gray-600';

            return (
              <div
                key={key}
                onClick={() => handleClick(r, c)}
                className={`relative w-9 h-9 border border-gray-700 dark:border-gray-600 cursor-pointer select-none ${bg}`}
              >
                {!isBlack && (
                  <>
                    {num != null && (
                      <span
                        className="absolute top-0 left-px text-gray-500 dark:text-gray-400 font-medium pointer-events-none"
                        style={{ fontSize: '8px', lineHeight: '10px' }}
                      >
                        {num}
                      </span>
                    )}
                    {cell !== '' && (
                      <span
                        className={`absolute inset-0 flex items-center justify-center font-bold text-sm pointer-events-none ${isCursor ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}
                      >
                        {cell}
                      </span>
                    )}
                    {isCursor && (
                      <span
                        className="absolute bottom-0 right-px text-white/70 pointer-events-none"
                        style={{ fontSize: '8px', lineHeight: '11px' }}
                      >
                        {direction === 'across' ? '→' : '↓'}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

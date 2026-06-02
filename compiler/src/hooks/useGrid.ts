import { useState, useCallback, useMemo } from 'react';
import type { CellValue, Direction } from '../../../shared/types';
import {
  SIZE,
  createEmptyGrid,
  toggleBlack as doToggleBlack,
  computeNumbers,
  advanceCursor,
} from '../lib/gridLogic';
import type { Slot } from '../lib/cluePanelLogic';

const LS_KEY = 'cxc-grid-v1';

function loadGrid(): CellValue[][] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CellValue[][];
      if (Array.isArray(parsed) && parsed.length === SIZE) return parsed;
    }
  } catch { /* ignore */ }
  return createEmptyGrid();
}

export function useGrid() {
  const [grid, setGridRaw] = useState<CellValue[][]>(loadGrid);
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const [direction, setDirection] = useState<Direction>('across');

  const setGrid = useCallback((g: CellValue[][]) => {
    setGridRaw(g);
    localStorage.setItem(LS_KEY, JSON.stringify(g));
  }, []);

  const numbers = useMemo(() => computeNumbers(grid), [grid]);

  const toggleBlack = useCallback((row: number, col: number) => {
    setGrid(doToggleBlack(grid, row, col));
  }, [grid, setGrid]);

  const setCell = useCallback((row: number, col: number, value: string) => {
    const next = grid.map(r => [...r]) as CellValue[][];
    next[row][col] = value as CellValue;
    setGrid(next);
  }, [grid, setGrid]);

  const advance = useCallback((row: number, col: number, dir: Direction, reverse = false) => {
    return advanceCursor(grid, row, col, dir, reverse);
  }, [grid]);

  const fillWord = useCallback((word: string, slot: Slot) => {
    const next = grid.map(r => [...r]) as CellValue[][];
    for (let i = 0; i < word.length; i++) {
      if (slot.dir === 'across') {
        next[slot.row][slot.col + i] = word[i] as CellValue;
      } else {
        next[slot.row + i][slot.col] = word[i] as CellValue;
      }
    }
    setGrid(next);
  }, [grid, setGrid]);

  const applyTemplate = useCallback((templateGrid: CellValue[][]) => {
    setGrid(templateGrid.map(r => [...r]) as CellValue[][]);
    setCursor({ row: 0, col: 0 });
    setDirection('across');
  }, [setGrid]);

  const clearGrid = useCallback(() => {
    setGrid(createEmptyGrid());
    setCursor({ row: 0, col: 0 });
    setDirection('across');
  }, [setGrid]);

  return {
    grid,
    cursor,
    setCursor,
    direction,
    setDirection,
    numbers,
    toggleBlack,
    setCell,
    fillWord,
    advance,
    applyTemplate,
    clearGrid,
  };
}

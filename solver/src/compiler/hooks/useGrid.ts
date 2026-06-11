'use client';

import { useState, useCallback, useMemo } from 'react';
import type { CellValue, Direction } from '../../../../shared/types';
import { SIZE, createEmptyGrid, toggleBlack, computeNumbers, advanceCursor } from '../lib/gridLogic';
import type { Slot } from '../lib/cluePanelLogic';

const LS_KEY = 'cxc-grid-v1';

function loadGrid(initial?: CellValue[][]): CellValue[][] {
  if (initial !== undefined) {
    if (initial.length === SIZE) return initial;
    return createEmptyGrid();
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CellValue[][];
      if (parsed.length === SIZE) return parsed;
    }
  } catch { /* ignore */ }
  return createEmptyGrid();
}

export function useGrid(initialGrid?: CellValue[][]) {
  const [grid, setGridRaw] = useState<CellValue[][]>(() => loadGrid(initialGrid));
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const [direction, setDirection] = useState<Direction>('across');

  const numbers = useMemo(() => computeNumbers(grid), [grid]);

  const setGrid = useCallback((g: CellValue[][]) => {
    setGridRaw(g);
    try { localStorage.setItem(LS_KEY, JSON.stringify(g)); } catch {}
  }, []);

  const toggleBlackCell = useCallback((row: number, col: number, symmetry = true) => {
    setGrid(toggleBlack(grid, row, col, symmetry));
  }, [grid, setGrid]);

  const setCell = useCallback((row: number, col: number, value: CellValue) => {
    const next = grid.map(r => [...r]) as CellValue[][];
    next[row][col] = value;
    setGrid(next);
  }, [grid, setGrid]);

  const fillWord = useCallback((word: string, slot: Slot) => {
    const next = grid.map(r => [...r]) as CellValue[][];
    for (let i = 0; i < slot.length; i++) {
      const row = slot.dir === 'across' ? slot.row : slot.row + i;
      const col = slot.dir === 'across' ? slot.col + i : slot.col;
      next[row][col] = word[i] as CellValue;
    }
    setGrid(next);
  }, [grid, setGrid]);

  const advance = useCallback((row: number, col: number, dir: Direction, reverse = false) => {
    const next = advanceCursor(grid, row, col, dir, reverse);
    setCursor(next);
    return next;
  }, [grid]);

  const applyTemplate = useCallback((templateGrid: CellValue[][]) => {
    setGrid(templateGrid);
    setCursor({ row: 0, col: 0 });
    setDirection('across');
  }, [setGrid]);

  const clearGrid = useCallback(() => {
    setGrid(createEmptyGrid());
    setCursor({ row: 0, col: 0 });
    setDirection('across');
  }, [setGrid]);

  return {
    grid, cursor, setCursor, direction, setDirection, numbers,
    toggleBlack: toggleBlackCell, setCell, fillWord, advance, applyTemplate, clearGrid,
  };
}

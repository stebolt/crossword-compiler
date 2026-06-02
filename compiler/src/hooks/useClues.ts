import { useState, useCallback } from 'react';
import type { Direction } from '../../../shared/types';

export type ClueStatus = 'unwritten' | 'drafted' | 'confirmed';

export interface ClueEntry {
  clue: string;
  notes: string;
  status: ClueStatus;
}

type ClueMap = Record<string, ClueEntry>;

const LS_KEY = 'cxc-clues-v1';

export const DEFAULT_ENTRY: ClueEntry = { clue: '', notes: '', status: 'unwritten' };

export function clueKey(num: number, dir: Direction): string {
  return `${num}-${dir}`;
}

function loadClues(): ClueMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as ClueMap;
  } catch { /* ignore */ }
  return {};
}

export function useClues() {
  const [clues, setCluesRaw] = useState<ClueMap>(loadClues);

  const setClues = useCallback((m: ClueMap) => {
    setCluesRaw(m);
    localStorage.setItem(LS_KEY, JSON.stringify(m));
  }, []);

  const getClue = useCallback(
    (num: number, dir: Direction): ClueEntry => clues[clueKey(num, dir)] ?? DEFAULT_ENTRY,
    [clues],
  );

  const updateClue = useCallback((num: number, dir: Direction, patch: Partial<ClueEntry>) => {
    const key = clueKey(num, dir);
    const current = clues[key] ?? DEFAULT_ENTRY;
    setClues({ ...clues, [key]: { ...current, ...patch } });
  }, [clues, setClues]);

  const resetClues = useCallback(() => setClues({}), [setClues]);

  return { clues, getClue, updateClue, resetClues };
}

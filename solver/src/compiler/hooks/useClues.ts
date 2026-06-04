'use client';

import { useState, useCallback } from 'react';
import type { Direction, ClueRef } from '../../../../shared/types';

export type ClueStatus = 'unwritten' | 'drafted' | 'confirmed';

export interface ClueEntry {
  clue: string;
  notes: string;
  status: ClueStatus;
  enumeration: number[];
  chain?: ClueRef[];
}

type ClueMap = Record<string, ClueEntry>;

const LS_KEY = 'cxc-clues-v1';

export const DEFAULT_ENTRY: ClueEntry = { clue: '', notes: '', status: 'unwritten', enumeration: [] };

export function clueKey(num: number, dir: Direction): string {
  return `${num}-${dir}`;
}

function loadClues(initial?: ClueMap): ClueMap {
  if (initial) return initial;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as ClueMap;
  } catch { /* ignore */ }
  return {};
}

export function useClues(initialClues?: ClueMap) {
  const [clues, setCluesRaw] = useState<ClueMap>(() => loadClues(initialClues));

  const setClues = useCallback((m: ClueMap) => {
    setCluesRaw(m);
    try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch {}
  }, []);

  const getClue = useCallback(
    (num: number, dir: Direction): ClueEntry => {
      const stored = clues[clueKey(num, dir)];
      return stored ? { ...DEFAULT_ENTRY, ...stored } : DEFAULT_ENTRY;
    },
    [clues],
  );

  const updateClue = useCallback((num: number, dir: Direction, patch: Partial<ClueEntry>) => {
    const key = clueKey(num, dir);
    const current = clues[key] ?? DEFAULT_ENTRY;
    setClues({ ...clues, [key]: { ...current, ...patch } });
  }, [clues, setClues]);

  const resetClues = useCallback(() => setClues({}), [setClues]);

  const loadCluesState = useCallback((m: ClueMap) => setClues(m), [setClues]);

  return { clues, getClue, updateClue, resetClues, loadCluesState };
}

'use client';

import { useState } from 'react';
import { CompilerApp } from '@/compiler/CompilerApp';
import type { CellValue } from '../../../../../shared/types';
import type { ClueEntry } from '@/compiler/hooks/useClues';

interface Props {
  puzzleId: string;
  initial: {
    grid?: CellValue[][];
    clues?: Record<string, ClueEntry>;
    meta?: { id: string; title: string; author: string };
    shoehorn?: string[];
  };
}

export default function CompilerWrapper({ puzzleId, initial }: Props) {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('cc-dark') === '1'; } catch { return false; }
  });

  const toggleDark = () => setDarkMode(d => {
    const next = !d;
    try { localStorage.setItem('cc-dark', next ? '1' : '0'); } catch {}
    return next;
  });

  return (
    <CompilerApp
      puzzleId={puzzleId}
      initial={initial}
      darkMode={darkMode}
      onToggleDark={toggleDark}
    />
  );
}

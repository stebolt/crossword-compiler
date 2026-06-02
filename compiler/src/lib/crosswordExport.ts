import type { Crossword, Clue, CellValue, Direction } from '../../../shared/types';
import type { Slot } from './cluePanelLogic';
import type { ClueEntry } from '../hooks/useClues';

interface Meta {
  id: string;
  title: string;
  author: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCrossword(
  slots: Slot[],
  getClue: (num: number, dir: Direction) => ClueEntry,
): ValidationResult {
  const errors: string[] = [];

  const unfilledCount = slots.filter(s => s.answer.includes('_')).length;
  if (unfilledCount > 0) {
    errors.push(`${unfilledCount} slot(s) have unfilled cells`);
  }

  const unconfirmedCount = slots.filter(s => getClue(s.num, s.dir).status !== 'confirmed').length;
  if (unconfirmedCount > 0) {
    errors.push(`${unconfirmedCount} clue(s) are not confirmed`);
  }

  return { valid: errors.length === 0, errors };
}

export function buildCrossword(
  grid: CellValue[][],
  slots: Slot[],
  getClue: (num: number, dir: Direction) => ClueEntry,
  meta: Meta,
): Crossword {
  const across: Clue[] = [];
  const down: Clue[] = [];

  for (const slot of slots) {
    const entry = getClue(slot.num, slot.dir);
    const clue: Clue = {
      number: slot.num,
      clue: entry.clue,
      answer: slot.answer,
      row: slot.row,
      col: slot.col,
      length: slot.length,
    };
    if (slot.dir === 'across') across.push(clue);
    else down.push(clue);
  }

  return {
    meta: {
      id: meta.id,
      title: meta.title || 'Untitled',
      author: meta.author,
      publishedAt: new Date().toISOString().split('T')[0],
      size: 15,
    },
    grid,
    clues: { across, down },
  };
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

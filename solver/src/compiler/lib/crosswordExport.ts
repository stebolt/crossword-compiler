import type { Crossword, Clue, CellValue, Direction, ClueRef } from '../../../../shared/types';
import type { Slot } from './cluePanelLogic';
import type { ClueEntry } from '../hooks/useClues';

interface Meta {
  id: string;
  title: string;
  author: string;
  instructions?: string;
}

function buildContinuationMap(
  slots: Slot[],
  getClue: (num: number, dir: Direction) => ClueEntry,
): Map<string, ClueRef> {
  const map = new Map<string, ClueRef>();
  for (const slot of slots) {
    for (const cs of getClue(slot.num, slot.dir).chain ?? []) {
      map.set(`${cs.number}-${cs.direction}`, { number: slot.num, direction: slot.dir });
    }
  }
  return map;
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

  const continuationMap = buildContinuationMap(slots, getClue);
  const unconfirmedCount = slots.filter(s => {
    if (continuationMap.has(`${s.num}-${s.dir}`)) return false;
    return getClue(s.num, s.dir).status !== 'confirmed';
  }).length;
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
  const continuationMap = buildContinuationMap(slots, getClue);

  for (const slot of slots) {
    const entry = getClue(slot.num, slot.dir);
    const origin = continuationMap.get(`${slot.num}-${slot.dir}`);

    let clue: Clue;
    if (origin) {
      const originDirLabel = origin.direction === 'across' ? 'A' : 'D';
      clue = {
        number: slot.num,
        clue: `See ${origin.number}${originDirLabel}`,
        answer: slot.answer,
        row: slot.row,
        col: slot.col,
        length: slot.length,
        linkedTo: origin,
      };
    } else {
      const myChain = entry.chain ?? [];
      clue = {
        number: slot.num,
        clue: entry.clue,
        answer: slot.answer,
        row: slot.row,
        col: slot.col,
        length: slot.length,
        ...(entry.enumeration.length > 0 && { wordLengths: entry.enumeration }),
        ...(myChain.length > 0 && { chainedSlots: myChain }),
      };
    }

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
      ...(meta.instructions && { instructions: meta.instructions }),
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

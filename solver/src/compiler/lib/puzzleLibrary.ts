import type { CellValue, Crossword, Direction } from '../../../../shared/types';
import type { ClueEntry } from '../hooks/useClues';

export interface LibraryEntry {
  id: string;
  title: string;
  author: string;
  savedAt: string;
  status: 'draft' | 'published';
  updatedAt: string;
  grid: CellValue[][];
  clues: Record<string, ClueEntry>;
  shoehorn?: string[];
}

export async function loadLibrary(): Promise<LibraryEntry[]> {
  const res = await fetch('/api/puzzles');
  if (!res.ok) return [];
  return res.json();
}

export async function savePuzzle(
  id: string,
  data: { title: string; author: string; instructions: string; grid: CellValue[][]; clues: Record<string, ClueEntry>; shoehorn: string[]; symmetry: boolean }
): Promise<void> {
  await fetch(`/api/puzzles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletePuzzle(id: string): Promise<void> {
  await fetch(`/api/puzzles/${id}`, { method: 'DELETE' });
}

export async function publishPuzzle(id: string): Promise<{ ok: boolean; errors?: string[] }> {
  const res = await fetch(`/api/puzzles/${id}/publish`, { method: 'POST' });
  const body = await res.json();
  if (!res.ok) return { ok: false, errors: body.errors ?? [body.error ?? 'Publish failed'] };
  return { ok: true };
}

export function clueMapFromCrossword(crossword: Crossword): Record<string, ClueEntry> {
  const map: Record<string, ClueEntry> = {};
  const allClues = [...crossword.clues.across, ...crossword.clues.down];
  for (const c of allClues) {
    if (c.linkedTo) continue;
    const dir: Direction = crossword.clues.across.includes(c) ? 'across' : 'down';
    const key = `${c.number}-${dir}`;
    map[key] = {
      clue: c.clue,
      notes: '',
      status: 'confirmed',
      enumeration: c.wordLengths ?? [],
      chain: c.chainedSlots,
    };
  }
  return map;
}

import type { CellValue, Crossword, Direction } from '../../../shared/types';
import type { ClueEntry } from '../hooks/useClues';

export interface LibraryEntry {
  id: string;
  title: string;
  author: string;
  savedAt: string; // ISO timestamp
  grid: CellValue[][];
  clues: Record<string, ClueEntry>;
}

const LS_KEY = 'cxc-library-v1';

export function loadLibrary(): LibraryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as LibraryEntry[];
  } catch { /* ignore */ }
  return [];
}

function persistLibrary(entries: LibraryEntry[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

export function upsertLibraryEntry(entry: LibraryEntry): void {
  const lib = loadLibrary();
  const idx = lib.findIndex(e => e.id === entry.id);
  if (idx >= 0) {
    lib[idx] = entry;
  } else {
    lib.unshift(entry);
  }
  persistLibrary(lib);
}

export function deleteLibraryEntry(id: string): void {
  persistLibrary(loadLibrary().filter(e => e.id !== id));
}

// Reconstruct a ClueMap from an exported Crossword JSON so it can be re-edited.
export function clueMapFromCrossword(crossword: Crossword): Record<string, ClueEntry> {
  const map: Record<string, ClueEntry> = {};
  for (const dir of ['across', 'down'] as Direction[]) {
    for (const c of crossword.clues[dir]) {
      if (c.linkedTo) continue; // continuation slots have auto-generated text; skip
      map[`${c.number}-${dir}`] = {
        clue: c.clue,
        notes: '',
        status: 'confirmed',
        enumeration: c.wordLengths ?? [],
        ...(c.chainedSlots && { chain: c.chainedSlots }),
      };
    }
  }
  return map;
}

export function libraryEntryFromCrossword(crossword: Crossword): LibraryEntry {
  return {
    id: crossword.meta.id,
    title: crossword.meta.title,
    author: crossword.meta.author,
    savedAt: new Date().toISOString(),
    grid: crossword.grid,
    clues: clueMapFromCrossword(crossword),
  };
}

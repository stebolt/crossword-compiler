import type { CellValue, Direction } from '../../../../shared/types';

export const SIZE = 15;

export function createEmptyGrid(): CellValue[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill('') as CellValue[]);
}

export function mirrorCell(row: number, col: number): [number, number] {
  return [SIZE - 1 - row, SIZE - 1 - col];
}

export function toggleBlack(grid: CellValue[][], row: number, col: number, symmetry = true): CellValue[][] {
  const next = grid.map(r => [...r]) as CellValue[][];
  const isBlack = next[row][col] === '#';
  if (symmetry) {
    const [mr, mc] = mirrorCell(row, col);
    if (!isBlack) {
      const mirrorVal = next[mr][mc];
      if (mirrorVal !== '' && mirrorVal !== '#') return grid;
      const selfVal = next[row][col];
      if (selfVal !== '' && selfVal !== '#') return grid;
    }
    next[row][col] = isBlack ? '' : '#';
    next[mr][mc] = isBlack ? '' : '#';
  } else {
    next[row][col] = isBlack ? '' : '#';
  }
  return next;
}

export function computeNumbers(grid: CellValue[][]): Map<string, number> {
  const numbers = new Map<string, number>();
  let n = 1;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === '#') continue;
      const startsAcross =
        (c === 0 || grid[r][c - 1] === '#') &&
        c + 1 < SIZE &&
        grid[r][c + 1] !== '#';
      const startsDown =
        (r === 0 || grid[r - 1][c] === '#') &&
        r + 1 < SIZE &&
        grid[r + 1][c] !== '#';
      if (startsAcross || startsDown) numbers.set(`${r},${c}`, n++);
    }
  }
  return numbers;
}

export function getWordCells(
  grid: CellValue[][],
  row: number,
  col: number,
  dir: Direction,
): Set<string> {
  const cells = new Set<string>();
  if (grid[row][col] === '#') return cells;
  let r = row, c = col;
  if (dir === 'across') {
    while (c > 0 && grid[r][c - 1] !== '#') c--;
    while (c < SIZE && grid[r][c] !== '#') { cells.add(`${r},${c}`); c++; }
  } else {
    while (r > 0 && grid[r - 1][c] !== '#') r--;
    while (r < SIZE && grid[r][c] !== '#') { cells.add(`${r},${c}`); r++; }
  }
  return cells;
}

export function advanceCursor(
  grid: CellValue[][],
  row: number,
  col: number,
  dir: Direction,
  reverse = false,
): { row: number; col: number } {
  const dr = dir === 'down' ? (reverse ? -1 : 1) : 0;
  const dc = dir === 'across' ? (reverse ? -1 : 1) : 0;
  let r = row + dr, c = col + dc;
  while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
    if (grid[r][c] !== '#') return { row: r, col: c };
    r += dr; c += dc;
  }
  return { row, col };
}

function buildSymmetric(blacks: [number, number][]): CellValue[][] {
  const g = createEmptyGrid();
  for (const [r, c] of blacks) {
    g[r][c] = '#';
    g[SIZE - 1 - r][SIZE - 1 - c] = '#';
  }
  return g;
}

export interface Template { name: string; grid: CellValue[][] }

export const TEMPLATES: Template[] = [
  { name: 'Blank', grid: createEmptyGrid() },
  {
    // Guardian/Observer style — 28 entries, 7-11 letter words, open feel (~46 blacks)
    name: 'Guardian',
    grid: buildSymmetric([
      [0, 1], [0, 5], [0, 9], [0, 13],
      [1, 1], [1, 7], [1, 11],
      [2, 3], [2, 9], [2, 13],
      [3, 5], [3, 11], [3, 13],
      [4, 1], [4, 7], [4, 13],
      [5, 3], [5, 9], [5, 13],
      [6, 5], [6, 11],
      [7, 1], [7, 7], [7, 13],
    ]),
  },
  {
    // Times Standard — 32 entries, 5-8 letter words, classic blocked style (~50 blacks)
    name: 'Times',
    grid: buildSymmetric([
      [0, 0], [0, 4], [0, 8], [0, 12],
      [1, 2], [1, 6], [1, 10], [1, 14],
      [2, 4], [2, 8], [2, 12],
      [3, 0], [3, 2], [3, 6], [3, 10], [3, 14],
      [4, 4], [4, 8], [4, 12],
      [5, 2], [5, 6], [5, 10],
      [6, 0], [6, 4], [6, 8], [6, 12],
      [7, 2], [7, 6], [7, 10],
    ]),
  },
  {
    // Telegraph Daily — 30 entries, 5-9 letter words, regular symmetry (~48 blacks)
    name: 'Telegraph',
    grid: buildSymmetric([
      [0, 3], [0, 7], [0, 11],
      [1, 1], [1, 5], [1, 9], [1, 13],
      [2, 3], [2, 7], [2, 11],
      [3, 0], [3, 5], [3, 9], [3, 13],
      [4, 3], [4, 7], [4, 11],
      [5, 1], [5, 5], [5, 9],
      [6, 3], [6, 7], [6, 11],
      [7, 0], [7, 5], [7, 9], [7, 13],
    ]),
  },
  {
    // Azed/Independent — 28 entries, features full-width 15-letter entries (~44 blacks)
    name: 'Azed',
    grid: buildSymmetric([
      [1, 3], [1, 7], [1, 11],
      [2, 1], [2, 5], [2, 9], [2, 13],
      [3, 3], [3, 7], [3, 11],
      [4, 1], [4, 5], [4, 9], [4, 13],
      [5, 3], [5, 7], [5, 11],
      [6, 1], [6, 5], [6, 9], [6, 13],
      [7, 3], [7, 7], [7, 11],
    ]),
  },
  {
    // Quick Cryptic — 36 entries, 4-6 letter words, more accessible (~54 blacks)
    name: 'Quick Cryptic',
    grid: buildSymmetric([
      [0, 2], [0, 5], [0, 8], [0, 11], [0, 14],
      [1, 0], [1, 3], [1, 7], [1, 11],
      [2, 2], [2, 5], [2, 9], [2, 13],
      [3, 0], [3, 3], [3, 7], [3, 11], [3, 14],
      [4, 2], [4, 5], [4, 9], [4, 13],
      [5, 0], [5, 3], [5, 7], [5, 11],
      [6, 2], [6, 5], [6, 9], [6, 13],
      [7, 0], [7, 3], [7, 7], [7, 11],
    ]),
  },
];

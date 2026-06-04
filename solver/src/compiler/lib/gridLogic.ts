import type { CellValue, Direction } from '../../../../shared/types';

export const SIZE = 15;

export function createEmptyGrid(): CellValue[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill('') as CellValue[]);
}

export function mirrorCell(row: number, col: number): [number, number] {
  return [SIZE - 1 - row, SIZE - 1 - col];
}

export function toggleBlack(grid: CellValue[][], row: number, col: number): CellValue[][] {
  const next = grid.map(r => [...r]) as CellValue[][];
  const isBlack = next[row][col] === '#';
  const [mr, mc] = mirrorCell(row, col);
  // Don't allow blacking out a cell whose mirror already has a letter
  if (!isBlack) {
    const mirrorVal = next[mr][mc];
    if (mirrorVal !== '' && mirrorVal !== '#') return grid;
    const selfVal = next[row][col];
    if (selfVal !== '' && selfVal !== '#') return grid;
  }
  next[row][col] = isBlack ? '' : '#';
  next[mr][mc] = isBlack ? '' : '#';
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
    name: 'Standard',
    grid: buildSymmetric([
      [0, 4], [0, 8], [0, 13],
      [1, 4], [1, 8],
      [2, 0], [2, 6], [2, 12],
      [3, 3], [3, 9],
      [4, 1], [4, 5], [4, 9], [4, 13],
      [5, 4], [5, 8],
      [6, 0], [6, 3], [6, 7], [6, 11],
      [7, 6],
    ]),
  },
  {
    name: 'Cryptic',
    grid: buildSymmetric([
      [0, 3], [0, 7], [0, 11],
      [1, 5], [1, 9], [1, 13],
      [2, 1], [2, 7],
      [3, 3], [3, 9], [3, 13],
      [4, 5], [4, 11],
      [5, 1], [5, 7], [5, 13],
      [6, 3], [6, 9],
      [7, 1], [7, 7], [7, 13],
    ]),
  },
];

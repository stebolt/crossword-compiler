import type { CellValue, Direction } from '../../../../shared/types';
import { SIZE } from './gridLogic';

export interface Slot {
  num: number;
  dir: Direction;
  row: number;
  col: number;
  length: number;
  answer: string;
}

export function getSlots(grid: CellValue[][], numbers: Map<string, number>): Slot[] {
  const across: Slot[] = [];
  const down: Slot[] = [];

  for (const [key, num] of numbers) {
    const [row, col] = key.split(',').map(Number);

    const startsAcross =
      (col === 0 || grid[row][col - 1] === '#') &&
      col + 1 < SIZE &&
      grid[row][col + 1] !== '#';

    const startsDown =
      (row === 0 || grid[row - 1][col] === '#') &&
      row + 1 < SIZE &&
      grid[row + 1][col] !== '#';

    if (startsAcross) {
      let c = col, length = 0, answer = '';
      while (c < SIZE && grid[row][c] !== '#') {
        answer += grid[row][c] || '_';
        length++;
        c++;
      }
      across.push({ num, dir: 'across', row, col, length, answer });
    }

    if (startsDown) {
      let r = row, length = 0, answer = '';
      while (r < SIZE && grid[r][col] !== '#') {
        answer += grid[r][col] || '_';
        length++;
        r++;
      }
      down.push({ num, dir: 'down', row, col, length, answer });
    }
  }

  across.sort((a, b) => a.num - b.num);
  down.sort((a, b) => a.num - b.num);

  return [...across, ...down];
}

export function findActiveSlot(
  slots: Slot[],
  cursor: { row: number; col: number },
  direction: Direction,
): Slot | null {
  for (const slot of slots) {
    if (slot.dir !== direction) continue;
    if (direction === 'across') {
      if (slot.row === cursor.row && cursor.col >= slot.col && cursor.col < slot.col + slot.length) {
        return slot;
      }
    } else {
      if (slot.col === cursor.col && cursor.row >= slot.row && cursor.row < slot.row + slot.length) {
        return slot;
      }
    }
  }
  return null;
}

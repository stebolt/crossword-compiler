export type CellValue = string | "#"; // single uppercase letter or black cell

export interface CrosswordMeta {
  id: string;
  title: string;
  author: string;
  publishedAt: string; // ISO date string
  size: number; // always 15
}

export interface Clue {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  length: number;
}

export interface CrosswordClues {
  across: Clue[];
  down: Clue[];
}

export interface Crossword {
  meta: CrosswordMeta;
  grid: CellValue[][];
  clues: CrosswordClues;
}

export type Direction = "across" | "down";

export interface ClueRef {
  number: number;
  direction: Direction;
}

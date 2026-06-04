"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import type { Crossword, Clue, Direction } from "../../../shared/types";
import { ClueList } from "./ClueList";

interface Props {
  crossword: Crossword;
}

export function CrosswordSolver({ crossword }: Props) {
  const { meta, grid, clues } = crossword;

  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    Array.from({ length: 15 }, () => Array(15).fill(""))
  );
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set);
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [checkMode, setCheckMode] = useState<"off" | "word" | "grid">("off");
  const [clueTab, setClueTab] = useState<Direction>("across");

  const gridRef = useRef<HTMLDivElement>(null);

  // Sync mobile clue tab with active direction
  useEffect(() => {
    setClueTab(direction);
  }, [direction]);

  // Load persisted progress after mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const savedGrid = localStorage.getItem(`xw-progress-${meta.id}`);
      if (savedGrid) setUserGrid(JSON.parse(savedGrid));
      const savedRevealed = localStorage.getItem(`xw-revealed-${meta.id}`);
      if (savedRevealed) setRevealedCells(new Set(JSON.parse(savedRevealed)));
    } catch {}
  }, [meta.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`xw-progress-${meta.id}`, JSON.stringify(userGrid));
    } catch {}
  }, [userGrid, meta.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`xw-revealed-${meta.id}`, JSON.stringify([...revealedCells]));
    } catch {}
  }, [revealedCells, meta.id]);

  const cellNumbers = useMemo(() => {
    const map = new Map<string, number>();
    for (const clue of [...clues.across, ...clues.down]) {
      map.set(`${clue.row}-${clue.col}`, clue.number);
    }
    return map;
  }, [clues]);

  const activeClue = useMemo((): Clue | null => {
    if (!activeCell) return null;
    const { row, col } = activeCell;
    const list = direction === "across" ? clues.across : clues.down;
    return (
      list.find((c) =>
        direction === "across"
          ? c.row === row && col >= c.col && col < c.col + c.length
          : c.col === col && row >= c.row && row < c.row + c.length
      ) ?? null
    );
  }, [activeCell, direction, clues]);

  const highlightedCells = useMemo((): Set<string> => {
    if (!activeClue) return new Set();
    const cells = new Set<string>();
    for (let i = 0; i < activeClue.length; i++) {
      const r = direction === "across" ? activeClue.row : activeClue.row + i;
      const c = direction === "across" ? activeClue.col + i : activeClue.col;
      cells.add(`${r}-${c}`);
    }
    return cells;
  }, [activeClue, direction]);

  const isComplete = useMemo(() => {
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (grid[r][c] !== "#" && userGrid[r][c] !== grid[r][c]) return false;
      }
    }
    return true;
  }, [grid, userGrid]);

  const filledAcrossClues = useMemo(() => {
    const filled = new Set<number>();
    for (const clue of clues.across) {
      if (Array.from({ length: clue.length }, (_, i) => userGrid[clue.row][clue.col + i]).every(Boolean))
        filled.add(clue.number);
    }
    return filled;
  }, [clues, userGrid]);

  const filledDownClues = useMemo(() => {
    const filled = new Set<number>();
    for (const clue of clues.down) {
      if (Array.from({ length: clue.length }, (_, i) => userGrid[clue.row + i][clue.col]).every(Boolean))
        filled.add(clue.number);
    }
    return filled;
  }, [clues, userGrid]);

  const nextCell = useCallback(
    (row: number, col: number, dir: Direction) => {
      if (dir === "across") {
        for (let c = col + 1; c < 15; c++) if (grid[row][c] !== "#") return { row, col: c };
      } else {
        for (let r = row + 1; r < 15; r++) if (grid[r][col] !== "#") return { row: r, col };
      }
      return null;
    },
    [grid]
  );

  const prevCell = useCallback(
    (row: number, col: number, dir: Direction) => {
      if (dir === "across") {
        for (let c = col - 1; c >= 0; c--) if (grid[row][c] !== "#") return { row, col: c };
      } else {
        for (let r = row - 1; r >= 0; r--) if (grid[r][col] !== "#") return { row: r, col };
      }
      return null;
    },
    [grid]
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (grid[row][col] === "#") return;
      gridRef.current?.focus();

      setCheckMode("off");

      if (activeCell?.row === row && activeCell?.col === col) {
        setDirection((d) => (d === "across" ? "down" : "across"));
        return;
      }

      setActiveCell({ row, col });

      const list = direction === "across" ? clues.across : clues.down;
      const covered = list.some((c) =>
        direction === "across"
          ? c.row === row && col >= c.col && col < c.col + c.length
          : c.col === col && row >= c.row && row < c.row + c.length
      );
      if (!covered) setDirection((d) => (d === "across" ? "down" : "across"));
    },
    [activeCell, direction, clues, grid]
  );

  const handleClueClick = useCallback(
    (clue: Clue, dir: Direction) => {
      gridRef.current?.focus();
      setDirection(dir);
      for (let i = 0; i < clue.length; i++) {
        const r = dir === "across" ? clue.row : clue.row + i;
        const c = dir === "across" ? clue.col + i : clue.col;
        if (userGrid[r][c] === "") {
          setActiveCell({ row: r, col: c });
          return;
        }
      }
      setActiveCell({ row: clue.row, col: clue.col });
    },
    [userGrid]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!activeCell) return;
      const { row, col } = activeCell;

      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        setUserGrid((prev) => {
          const next = prev.map((r) => [...r]);
          next[row][col] = e.key.toUpperCase();
          return next;
        });
        const next = nextCell(row, col, direction);
        if (next) setActiveCell(next);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        if (userGrid[row][col] !== "") {
          setUserGrid((prev) => {
            const next = prev.map((r) => [...r]);
            next[row][col] = "";
            return next;
          });
        } else {
          const prev = prevCell(row, col, direction);
          if (prev) {
            setActiveCell(prev);
            setUserGrid((g) => {
              const next = g.map((r) => [...r]);
              next[prev.row][prev.col] = "";
              return next;
            });
          }
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (direction !== "across") { setDirection("across"); return; }
        const n = nextCell(row, col, "across");
        if (n) setActiveCell(n);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (direction !== "across") { setDirection("across"); return; }
        const p = prevCell(row, col, "across");
        if (p) setActiveCell(p);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (direction !== "down") { setDirection("down"); return; }
        const n = nextCell(row, col, "down");
        if (n) setActiveCell(n);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (direction !== "down") { setDirection("down"); return; }
        const p = prevCell(row, col, "down");
        if (p) setActiveCell(p);
      } else if (e.key === "Tab") {
        e.preventDefault();
        const list = direction === "across" ? clues.across : clues.down;
        const idx = activeClue ? list.findIndex((c) => c.number === activeClue.number) : -1;
        const next = e.shiftKey ? list[idx - 1] : list[idx + 1];
        if (next) setActiveCell({ row: next.row, col: next.col });
      }
    },
    [activeCell, direction, userGrid, clues, activeClue, nextCell, prevCell]
  );

  const clearGrid = useCallback(() => {
    setUserGrid(Array.from({ length: 15 }, () => Array(15).fill("")));
    setRevealedCells(new Set());
    setCheckMode("off");
  }, []);

  const revealCell = useCallback(() => {
    if (!activeCell) return;
    const { row, col } = activeCell;
    if (grid[row][col] === "#") return;
    const key = `${row}-${col}`;
    setUserGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = grid[row][col] as string;
      return next;
    });
    setRevealedCells((prev) => new Set([...prev, key]));
    setCheckMode("off");
  }, [activeCell, grid]);

  const revealWord = useCallback(() => {
    if (!activeClue) return;
    const newKeys: string[] = [];
    setUserGrid((prev) => {
      const next = prev.map((r) => [...r]);
      for (let i = 0; i < activeClue.length; i++) {
        const r = direction === "across" ? activeClue.row : activeClue.row + i;
        const c = direction === "across" ? activeClue.col + i : activeClue.col;
        next[r][c] = grid[r][c] as string;
        newKeys.push(`${r}-${c}`);
      }
      return next;
    });
    setRevealedCells((prev) => new Set([...prev, ...newKeys]));
    setCheckMode("off");
  }, [activeClue, direction, grid]);

  const revealAll = useCallback(() => {
    const allKeys: string[] = [];
    setUserGrid(
      grid.map((row, r) =>
        row.map((cell, c) => {
          if (cell !== "#") allKeys.push(`${r}-${c}`);
          return cell === "#" ? "" : (cell as string);
        })
      )
    );
    setRevealedCells(new Set(allKeys));
    setCheckMode("off");
  }, [grid]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="border-b border-gray-700 px-4 sm:px-6 py-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          {/* Title row */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-200 transition-colors shrink-0">
              ← All puzzles
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-gray-100 leading-tight truncate">{meta.title}</h1>
              <p className="text-xs text-gray-500">
                By {meta.author} · {meta.publishedAt}
              </p>
            </div>
            {isComplete && (
              <span className="sm:hidden text-sm font-medium text-green-400 bg-green-900/30 border border-green-700 px-3 py-1 rounded-full shrink-0">
                Complete!
              </span>
            )}
          </div>
          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2">
            {isComplete && (
              <span className="hidden sm:inline text-sm font-medium text-green-400 bg-green-900/30 border border-green-700 px-3 py-1 rounded-full">
                Complete!
              </span>
            )}
            <div className="flex items-center rounded-md border border-gray-600 overflow-hidden text-sm">
              <button
                onClick={() => setCheckMode("word")}
                className={`px-3 py-1.5 transition-colors ${
                  checkMode === "word"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                Check Word
              </button>
              <div className="w-px bg-gray-600 self-stretch" />
              <button
                onClick={() => setCheckMode("grid")}
                className={`px-3 py-1.5 transition-colors ${
                  checkMode === "grid"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                Check Grid
              </button>
            </div>
            <button
              onClick={clearGrid}
              className="px-3 py-1.5 rounded-md border border-gray-600 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Clear Grid
            </button>
            <div className="flex items-center rounded-md border border-gray-600 overflow-hidden text-sm">
              <button
                onClick={revealCell}
                className="px-3 py-1.5 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Reveal Cell
              </button>
              <div className="w-px bg-gray-600 self-stretch" />
              <button
                onClick={revealWord}
                className="px-3 py-1.5 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Reveal Word
              </button>
              <div className="w-px bg-gray-600 self-stretch" />
              <button
                onClick={revealAll}
                className="px-3 py-1.5 text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Reveal All
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 lg:p-6 lg:flex-1 max-w-5xl mx-auto w-full">
        {/* Grid */}
        <div
          ref={gridRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="outline-none shrink-0 self-start mx-auto lg:mx-0"
        >
          <div className="border-t border-l border-gray-600 inline-block">
            {grid.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell, c) => {
                  const isBlack = cell === "#";
                  const key = `${r}-${c}`;
                  const isActive = activeCell?.row === r && activeCell?.col === c;
                  const isHighlighted = highlightedCells.has(key);
                  const isRevealed = revealedCells.has(key);
                  const number = cellNumbers.get(key);
                  const letter = userGrid[r][c];
                  const isWrong =
                    checkMode !== "off" &&
                    letter !== "" &&
                    !isRevealed &&
                    letter !== cell &&
                    (checkMode === "grid" || highlightedCells.has(key));

                  let bg = "bg-gray-800";
                  if (isBlack) bg = "bg-black";
                  else if (isActive) bg = "bg-blue-500";
                  else if (isWrong) bg = "bg-red-900/50";
                  else if (isRevealed && isHighlighted) bg = "bg-blue-900/50";
                  else if (isRevealed) bg = "bg-amber-900/40";
                  else if (isHighlighted) bg = "bg-blue-900/40";

                  return (
                    <div
                      key={c}
                      onClick={() => handleCellClick(r, c)}
                      className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 relative border-r border-b border-gray-600 flex items-center justify-center select-none ${
                        isBlack ? "cursor-default" : "cursor-pointer"
                      } ${bg}`}
                    >
                      {number !== undefined && !isBlack && (
                        <span className="absolute top-0 left-0.5 text-[6px] sm:text-[7px] lg:text-[8px] leading-none font-medium text-gray-400">
                          {number}
                        </span>
                      )}
                      {!isBlack && letter && (
                        <span
                          className={`text-[9px] sm:text-[12px] lg:text-[15px] font-bold leading-none ${
                            isActive ? "text-white" : "text-gray-100"
                          }`}
                        >
                          {letter}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: tabbed clue lists */}
        <div className="lg:hidden flex flex-col">
          <div className="flex border-b border-gray-700 mb-3">
            {(["across", "down"] as Direction[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setClueTab(tab)}
                className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                  clueTab === tab
                    ? "text-white border-b-2 border-white -mb-px"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="h-80 flex flex-col">
            <ClueList
              direction={clueTab}
              clues={clueTab === "across" ? clues.across : clues.down}
              activeClue={clueTab === direction ? activeClue : null}
              filledClues={clueTab === "across" ? filledAcrossClues : filledDownClues}
              onClueClick={(clue) => handleClueClick(clue, clueTab)}
            />
          </div>
        </div>

        {/* Desktop: side-by-side clue lists */}
        <div className="hidden lg:flex gap-6 flex-1 min-h-0 overflow-hidden" style={{ alignSelf: "stretch" }}>
          <ClueList
            direction="across"
            clues={clues.across}
            activeClue={direction === "across" ? activeClue : null}
            filledClues={filledAcrossClues}
            onClueClick={(clue) => handleClueClick(clue, "across")}
          />
          <ClueList
            direction="down"
            clues={clues.down}
            activeClue={direction === "down" ? activeClue : null}
            filledClues={filledDownClues}
            onClueClick={(clue) => handleClueClick(clue, "down")}
          />
        </div>
      </main>
    </div>
  );
}

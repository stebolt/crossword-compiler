"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import type { Crossword, Clue, Direction } from "../../../shared/types";
import { ClueList } from "./ClueList";
import AppTabs from "./AppTabs";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface InitialProgress {
  user_grid: string[][];
  revealed: string[];
  status: string;
}

interface Props {
  crossword: Crossword;
  userId?: string;
  userEmail?: string;
  initialProgress?: InitialProgress | null;
}

export function CrosswordSolver({ crossword, userId, userEmail, initialProgress }: Props) {
  const { meta, grid, clues } = crossword;

  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    initialProgress?.user_grid ?? Array.from({ length: 15 }, () => Array(15).fill(""))
  );
  const [revealedCells, setRevealedCells] = useState<Set<string>>(() =>
    new Set(initialProgress?.revealed ?? [])
  );
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [checkMode, setCheckMode] = useState<"off" | "word" | "grid">("off");
  const [clueTab, setClueTab] = useState<Direction>("across");
  const [pendingConfirm, setPendingConfirm] = useState<"reveal-all" | "clear-grid" | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedAtRef = useRef<string | null>(
    initialProgress?.status === "complete" ? new Date().toISOString() : null
  );
  const isMountedRef = useRef(false);

  // Sync mobile clue tab with active direction
  useEffect(() => {
    setClueTab(direction);
  }, [direction]);

  useEffect(() => {
    if (!helpOpen) return;
    function handleClick(e: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setHelpOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [helpOpen]);

  // Load from localStorage (anon users, or as fallback before DB data arrives)
  useEffect(() => {
    if (initialProgress) {
      isMountedRef.current = true;
      return;
    }
    try {
      const savedGrid = localStorage.getItem(`xw-progress-${meta.id}`);
      if (savedGrid) setUserGrid(JSON.parse(savedGrid));
      const savedRevealed = localStorage.getItem(`xw-revealed-${meta.id}`);
      if (savedRevealed) setRevealedCells(new Set(JSON.parse(savedRevealed)));
    } catch {}
    isMountedRef.current = true;
  }, [meta.id, initialProgress]);

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

  const activeWordComplete = useMemo(() => {
    if (!activeClue) return false;
    for (let i = 0; i < activeClue.length; i++) {
      const r = direction === "across" ? activeClue.row : activeClue.row + i;
      const c = direction === "across" ? activeClue.col + i : activeClue.col;
      if (!userGrid[r][c]) return false;
    }
    return true;
  }, [activeClue, direction, userGrid]);

  const isComplete = useMemo(() => {
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (grid[r][c] !== "#" && userGrid[r][c] !== grid[r][c]) return false;
      }
    }
    return true;
  }, [grid, userGrid]);

  const isAnyFilled = useMemo(() => {
    for (let r = 0; r < 15; r++)
      for (let c = 0; c < 15; c++)
        if (grid[r][c] !== "#" && userGrid[r][c] !== "") return true;
    return false;
  }, [grid, userGrid]);

  // Save progress to Supabase for authenticated users (debounced 2s)
  useEffect(() => {
    if (!userId || !isMountedRef.current) return;
    if (!isAnyFilled && !isComplete) return;

    if (isComplete && !completedAtRef.current) {
      completedAtRef.current = new Date().toISOString();
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("puzzle_progress").upsert(
        {
          user_id: userId,
          puzzle_id: meta.id,
          user_email: userEmail ?? null,
          status: isComplete ? "complete" : "in_progress",
          user_grid: userGrid,
          revealed: [...revealedCells],
          updated_at: new Date().toISOString(),
          completed_at: completedAtRef.current ?? null,
        },
        { onConflict: "user_id,puzzle_id" }
      );
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [userId, userEmail, meta.id, userGrid, revealedCells, isComplete, isAnyFilled]);

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
      {pendingConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPendingConfirm(null)}>
          <div className="bg-gray-800 rounded-lg shadow-xl p-5 w-72 border border-gray-700" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-gray-200 mb-4">
              {pendingConfirm === "reveal-all"
                ? "Reveal the entire grid? This cannot be undone."
                : "Clear all letters? This cannot be undone."}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingConfirm(null)}
                className="px-3 py-1.5 rounded border border-gray-600 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingConfirm === "reveal-all") revealAll();
                  else clearGrid();
                  setPendingConfirm(null);
                }}
                className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
              >
                {pendingConfirm === "reveal-all" ? "Reveal Grid" : "Clear Grid"}
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="bg-gray-900 dark:bg-gray-950 text-white px-5 py-2 flex items-center text-sm flex-shrink-0 relative">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs font-medium tracking-tight text-gray-400 hover:text-white transition-colors uppercase shrink-0">
            ← Crosswords
          </Link>
          <div className="w-px h-4 bg-gray-700 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-100 leading-tight truncate">{meta.title}</h1>
            {(meta.author || meta.publishedAt) && (
              <p className="text-xs text-gray-500 leading-tight">
                {meta.author && `By ${meta.author}`}{meta.author && meta.publishedAt ? ' · ' : ''}{meta.publishedAt ?? ''}
              </p>
            )}
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <AppTabs />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isComplete ? (
            <span className="text-sm font-medium text-green-400 bg-green-900/30 border border-green-700 px-3 py-1 rounded-full">
              Complete!
            </span>
          ) : userId && isAnyFilled ? (
            <span className="text-xs font-medium text-amber-400 bg-amber-900/20 border border-amber-700 px-2.5 py-1 rounded-full">
              In progress
            </span>
          ) : null}
          <div ref={helpRef} className="relative">
              <button
                onClick={() => setHelpOpen(o => !o)}
                className={`px-3 py-1.5 rounded-md border text-sm transition-colors flex items-center gap-1.5 ${
                  checkMode !== "off"
                    ? "border-blue-500 text-blue-400 hover:bg-gray-800"
                    : "border-gray-600 text-gray-300 hover:bg-gray-800"
                }`}
              >
                Help <span className="text-gray-500 text-xs">{helpOpen ? "▲" : "▾"}</span>
              </button>
              {helpOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                  <button
                    onClick={() => { setHelpOpen(false); setCheckMode("word"); }}
                    disabled={!activeWordComplete}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      !activeWordComplete ? "text-gray-600 cursor-not-allowed" : "text-gray-200 hover:bg-gray-700"
                    }`}
                  >
                    Check Word
                  </button>
                  <button
                    onClick={() => { setHelpOpen(false); setCheckMode("grid"); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    Check Grid
                  </button>
                  <div className="border-t border-gray-700" />
                  <button
                    onClick={() => { setHelpOpen(false); revealWord(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    Reveal Word
                  </button>
                  <button
                    onClick={() => { setHelpOpen(false); setPendingConfirm("reveal-all"); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    Reveal Grid
                  </button>
                  <div className="border-t border-gray-700" />
                  <button
                    onClick={() => { setHelpOpen(false); setPendingConfirm("clear-grid"); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                  >
                    Clear Grid
                  </button>
                </div>
              )}
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
          <div className="border-2 border-gray-400 inline-block">
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

                  let bg = "bg-white";
                  if (isBlack) bg = "bg-black";
                  else if (isActive) bg = "bg-blue-500";
                  else if (isRevealed && isHighlighted) bg = "bg-blue-200";
                  else if (isRevealed) bg = "bg-amber-200";
                  else if (isHighlighted) bg = "bg-blue-100";

                  return (
                    <div
                      key={c}
                      onClick={() => handleCellClick(r, c)}
                      className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 relative border border-gray-400 flex items-center justify-center select-none ${
                        isBlack ? "cursor-default" : "cursor-pointer"
                      } ${bg}`}
                    >
                      {number !== undefined && !isBlack && (
                        <span className="absolute top-0 left-0.5 text-[6px] sm:text-[7px] lg:text-[8px] leading-none font-medium text-gray-500">
                          {number}
                        </span>
                      )}
                      {!isBlack && letter && (
                        <span
                          className={`text-[9px] sm:text-[12px] lg:text-[15px] font-bold leading-none ${
                            isActive ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {letter}
                        </span>
                      )}
                      {isWrong && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 10 10" preserveAspectRatio="none">
                          <line x1="1.5" y1="8.5" x2="8.5" y2="1.5" stroke="rgb(239,68,68)" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: active clue panel */}
        <div className="lg:hidden bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 min-h-[4rem]">
          {activeClue ? (
            <>
              <div className="text-xs font-semibold text-blue-400 mb-1">
                {activeClue.number} {direction === "across" ? "Across" : "Down"}
              </div>
              <div className="text-sm text-gray-100">
                {activeClue.clue || <span className="italic text-gray-500">No clue written</span>}
                {' '}
                <span className="text-gray-400">
                  ({activeClue.wordLengths ? activeClue.wordLengths.join(',') : activeClue.length})
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Select a cell to see the clue.</p>
          )}
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

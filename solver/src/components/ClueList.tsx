"use client";

import { useEffect, useRef } from "react";
import type { Clue, Direction } from "../../../shared/types";

interface Props {
  direction: Direction;
  clues: Clue[];
  activeClue: Clue | null;
  filledClues: Set<number>;
  onClueClick: (clue: Clue) => void;
}

function enumeration(clue: Clue): string {
  const lengths = clue.wordLengths ?? [clue.length];
  return `(${lengths.join(",")})`;
}

export function ClueList({ direction, clues, activeClue, filledClues, onClueClick }: Props) {
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeClue]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 shrink-0">
        {direction === "across" ? "Across" : "Down"}
      </h2>
      <ul className="flex-1 min-h-0 overflow-y-auto space-y-px">
        {clues.map((clue) => {
          const isActive = clue.number === activeClue?.number;
          const isFilled = filledClues.has(clue.number);
          const isLinked = !!clue.linkedTo;
          return (
            <li
              key={clue.number}
              ref={isActive ? activeRef : null}
              onClick={() => onClueClick(clue)}
              className={`flex gap-2 px-2 py-1.5 rounded cursor-pointer text-sm leading-snug transition-colors ${
                isActive
                  ? "bg-blue-500 text-white"
                  : isLinked
                  ? "text-zinc-400 hover:bg-zinc-100"
                  : isFilled
                  ? "text-zinc-300 hover:bg-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <span className="font-semibold shrink-0 w-5 text-right">{clue.number}</span>
              <span className={isLinked ? "italic" : ""}>
                {clue.clue}{" "}
                {!isLinked && (
                  <span className={isActive ? "text-blue-200" : isFilled ? "text-zinc-200" : "text-zinc-400"}>
                    {enumeration(clue)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

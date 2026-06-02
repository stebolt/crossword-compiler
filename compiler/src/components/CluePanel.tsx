import { useRef, useState, useEffect } from 'react';
import type { Direction } from '../../../shared/types';
import type { Slot } from '../lib/cluePanelLogic';
import { findActiveSlot } from '../lib/cluePanelLogic';
import type { ClueEntry, ClueStatus } from '../hooks/useClues';

interface Props {
  slots: Slot[];
  getClue: (num: number, dir: Direction) => ClueEntry;
  updateClue: (num: number, dir: Direction, patch: Partial<ClueEntry>) => void;
  cursor: { row: number; col: number };
  direction: Direction;
  setCursor: (pos: { row: number; col: number }) => void;
  setDirection: (dir: Direction) => void;
}

const STATUS_CYCLE: ClueStatus[] = ['unwritten', 'drafted', 'confirmed'];

const STATUS_DOT: Record<ClueStatus, string> = {
  unwritten: '○',
  drafted:   '◑',
  confirmed: '●',
};

const STATUS_COLOR: Record<ClueStatus, string> = {
  unwritten: 'text-gray-300 hover:text-gray-500',
  drafted:   'text-amber-400 hover:text-amber-500',
  confirmed: 'text-green-500 hover:text-green-600',
};

export function CluePanel({ slots, getClue, updateClue, cursor, direction, setCursor, setDirection }: Props) {
  const activeSlot = findActiveSlot(slots, cursor, direction);
  const activeRef = useRef<HTMLDivElement>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeSlot?.num, activeSlot?.dir]);

  const toggleNotes = (key: string) =>
    setExpandedNotes(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const cycleStatus = (num: number, dir: Direction, current: ClueStatus) => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    updateClue(num, dir, { status: next });
  };

  const acrossSlots = slots.filter(s => s.dir === 'across');
  const downSlots = slots.filter(s => s.dir === 'down');

  if (slots.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 border border-gray-200 rounded-md bg-white">
        No slots yet — add white cells to the grid.
      </div>
    );
  }

  const renderSlot = (slot: Slot) => {
    const key = `${slot.num}-${slot.dir}`;
    const entry = getClue(slot.num, slot.dir);
    const isActive = activeSlot?.num === slot.num && activeSlot?.dir === slot.dir;
    const notesOpen = expandedNotes.has(key);

    return (
      <div
        key={key}
        ref={isActive ? activeRef : undefined}
        className={`border-b border-gray-100 px-3 py-2 ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-start gap-2">
          {/* Number + direction — clicking jumps grid cursor */}
          <button
            onClick={() => { setCursor({ row: slot.row, col: slot.col }); setDirection(slot.dir); }}
            className={`flex-shrink-0 flex items-baseline gap-px mt-0.5 font-semibold text-sm w-7 ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'}`}
          >
            {slot.num}<span className="text-xs font-normal">{slot.dir === 'across' ? 'A' : 'D'}</span>
          </button>

          {/* Answer preview + clue input */}
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs tracking-widest text-gray-300 mb-0.5 select-none">
              {slot.answer}
            </div>
            <AutoTextarea
              value={entry.clue}
              placeholder="Write clue…"
              onChange={v => updateClue(slot.num, slot.dir, {
                clue: v,
                status: entry.status === 'unwritten' && v.trim() ? 'drafted' : entry.status,
              })}
              className={`w-full text-sm bg-transparent outline-none border-b placeholder-gray-300 leading-snug
                ${isActive
                  ? 'border-blue-300 text-gray-900'
                  : 'border-transparent text-gray-700 hover:border-gray-200 focus:border-blue-300'
                }`}
            />
          </div>

          {/* Status toggle */}
          <button
            onClick={() => cycleStatus(slot.num, slot.dir, entry.status)}
            title={entry.status}
            className={`flex-shrink-0 mt-1 text-base leading-none ${STATUS_COLOR[entry.status]}`}
          >
            {STATUS_DOT[entry.status]}
          </button>
        </div>

        {/* Notes */}
        <div className="mt-1 pl-7">
          <button
            onClick={() => toggleNotes(key)}
            className="text-xs text-gray-300 hover:text-gray-500"
          >
            {notesOpen ? '▾' : '▸'} notes
            {entry.notes && !notesOpen && <span className="ml-1 text-amber-400">•</span>}
          </button>
          {notesOpen && (
            <AutoTextarea
              value={entry.notes}
              placeholder="Scratch pad…"
              onChange={v => updateClue(slot.num, slot.dir, { notes: v })}
              className="mt-1 w-full text-xs bg-transparent outline-none border-b border-gray-200 text-gray-500 placeholder-gray-300 focus:border-blue-300 leading-snug"
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 border border-gray-200 rounded-md bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {acrossSlots.length > 0 && (
          <>
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Across
            </div>
            {acrossSlots.map(renderSlot)}
          </>
        )}
        {downSlots.length > 0 && (
          <>
            <div className="bg-gray-50 border-b border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Down
            </div>
            {downSlots.map(renderSlot)}
          </>
        )}
      </div>
    </div>
  );
}

function AutoTextarea({
  value, onChange, placeholder, className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`block overflow-hidden resize-none ${className ?? ''}`}
    />
  );
}

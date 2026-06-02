import { useRef, useState, useEffect, useCallback } from 'react';
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

const ANSWER_COLOR: Record<ClueStatus, string> = {
  unwritten: 'text-gray-400',
  drafted:   'text-amber-500',
  confirmed: 'text-green-600',
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
        className={`border-b border-gray-100 px-3 py-1 ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
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
            <div className="flex items-baseline gap-2 mb-0.5">
              <div className={`font-mono text-xs tracking-widest select-none ${ANSWER_COLOR[entry.status]}`}>
                {slot.answer}
              </div>
              <EnumerationInput
                value={entry.enumeration}
                slotLength={slot.length}
                onChange={v => updateClue(slot.num, slot.dir, { enumeration: v })}
              />
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

        {/* Notes — only rendered when active or notes exist */}
        {(isActive || notesOpen || entry.notes) && (
          <div className="mt-0.5 pl-7">
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
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 w-fit border border-gray-200 rounded-md bg-white overflow-hidden">
      {/* Across column */}
      <div className="w-[544px] flex-shrink-0 flex flex-col border-r border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Across
        </div>
        <div className="flex-1 overflow-y-auto">
          {acrossSlots.map(renderSlot)}
        </div>
      </div>

      {/* Down column */}
      <div className="w-[544px] flex-shrink-0 flex flex-col overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Down
        </div>
        <div className="flex-1 overflow-y-auto">
          {downSlots.map(renderSlot)}
        </div>
      </div>
    </div>
  );
}

function EnumerationInput({ value, slotLength, onChange }: {
  value: number[];
  slotLength: number;
  onChange: (v: number[]) => void;
}) {
  const [raw, setRaw] = useState(() => value.length ? value.join(',') : '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRaw(value.length ? value.join(',') : '');
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.join(',')]);

  const commit = useCallback((str: string) => {
    const trimmed = str.trim();
    if (!trimmed) { onChange([]); setError(null); return; }
    const parts = trimmed.split(',').map(p => parseInt(p.trim(), 10));
    if (parts.some(n => isNaN(n) || n <= 0)) { setError('use numbers e.g. 3,5,4'); return; }
    const sum = parts.reduce((a, b) => a + b, 0);
    if (sum !== slotLength) { setError(`sums to ${sum}, need ${slotLength}`); return; }
    setError(null);
    onChange(parts);
  }, [onChange, slotLength]);

  return (
    <div className="flex items-center gap-1 mt-1 min-h-[1.25rem]">
      <span className="text-xs text-gray-400 select-none">(</span>
      <input
        value={raw}
        onChange={e => { setRaw(e.target.value); setError(null); }}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(raw); (e.target as HTMLInputElement).blur(); } }}
        placeholder={`${slotLength}`}
        aria-label="Word lengths e.g. 3,5,4"
        className={`text-xs w-[5ch] bg-transparent outline-none border-b leading-none
          ${error ? 'border-red-400 text-red-500 placeholder-red-300'
                  : 'border-transparent hover:border-gray-200 focus:border-blue-300 text-gray-500 placeholder-gray-300'}`}
      />
      <span className="text-xs text-gray-400 select-none">)</span>
      {error && <span className="text-xs text-red-400">{error}</span>}
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

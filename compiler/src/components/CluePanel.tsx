import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { Direction, ClueRef } from '../../../shared/types';
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

const STATUS_DOT: Record<ClueStatus, string> = {
  unwritten: '○',
  drafted:   '◑',
  confirmed: '●',
};

const STATUS_COLOR: Record<ClueStatus, string> = {
  unwritten: 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
  drafted:   'text-amber-400 hover:text-amber-500 cursor-pointer',
  confirmed: 'text-green-500 hover:text-green-600 cursor-pointer',
};

const ANSWER_COLOR: Record<ClueStatus, string> = {
  unwritten: 'text-gray-400 dark:text-gray-500',
  drafted:   'text-amber-500',
  confirmed: 'text-green-600 dark:text-green-500',
};

export function CluePanel({ slots, getClue, updateClue, cursor, direction, setCursor, setDirection }: Props) {
  const activeSlot = findActiveSlot(slots, cursor, direction);
  const activeRef = useRef<HTMLDivElement>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeSlot?.num, activeSlot?.dir]);

  // Reverse lookup: "num-dir" → origin ClueRef (for continuation slot detection)
  const continuationMap = useMemo(() => {
    const map = new Map<string, ClueRef>();
    for (const slot of slots) {
      for (const cs of getClue(slot.num, slot.dir).chain ?? []) {
        map.set(`${cs.number}-${cs.direction}`, { number: slot.num, direction: slot.dir });
      }
    }
    return map;
  }, [slots, getClue]);

  const addToChain = useCallback((originSlot: Slot, cs: ClueRef) => {
    const entry = getClue(originSlot.num, originSlot.dir);
    updateClue(originSlot.num, originSlot.dir, { chain: [...(entry.chain ?? []), cs] });
  }, [getClue, updateClue]);

  const removeChainSlot = useCallback((originSlot: Slot, cs: ClueRef) => {
    const entry = getClue(originSlot.num, originSlot.dir);
    updateClue(originSlot.num, originSlot.dir, {
      chain: (entry.chain ?? []).filter(c => !(c.number === cs.number && c.direction === cs.direction)),
    });
  }, [getClue, updateClue]);

  const removeFromChain = useCallback((origin: ClueRef, continuationSlot: Slot) => {
    const entry = getClue(origin.number, origin.direction);
    updateClue(origin.number, origin.direction, {
      chain: (entry.chain ?? []).filter(c => !(c.number === continuationSlot.num && c.direction === continuationSlot.dir)),
    });
  }, [getClue, updateClue]);

  const toggleNotes = (key: string) =>
    setExpandedNotes(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const cycleStatus = (num: number, dir: Direction, current: ClueStatus, isWordComplete: boolean) => {
    if (!isWordComplete) return;
    updateClue(num, dir, { status: current === 'confirmed' ? 'drafted' : 'confirmed' });
  };

  const acrossSlots = slots.filter(s => s.dir === 'across');
  const downSlots = slots.filter(s => s.dir === 'down');

  // Summary counts for sticky bar
  const confirmedCount = slots.filter(s => {
    const e = getClue(s.num, s.dir);
    return !s.answer.includes('_') && e.status === 'confirmed';
  }).length;
  const totalFillable = slots.filter(s => !s.answer.includes('_')).length;

  if (slots.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
        No slots yet — add white cells to the grid.
      </div>
    );
  }

  const renderSlot = (slot: Slot) => {
    const key = `${slot.num}-${slot.dir}`;
    const entry = getClue(slot.num, slot.dir);
    const isActive = activeSlot?.num === slot.num && activeSlot?.dir === slot.dir;
    const notesOpen = expandedNotes.has(key);
    const isWordComplete = !slot.answer.includes('_');
    const effectiveStatus: ClueStatus = !isWordComplete
      ? 'unwritten'
      : entry.status === 'confirmed' ? 'confirmed' : 'drafted';

    // Is this slot a continuation of another slot's chain?
    const chainOrigin = continuationMap.get(key);
    if (chainOrigin) {
      const originLabel = `${chainOrigin.number}${chainOrigin.direction === 'across' ? 'A' : 'D'}`;
      return (
        <div
          key={key}
          ref={isActive ? activeRef : undefined}
          className={`border-b border-gray-100 dark:border-gray-700 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/40 ${isActive ? 'ring-1 ring-inset ring-blue-200 dark:ring-blue-700' : ''}`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setCursor({ row: slot.row, col: slot.col }); setDirection(slot.dir); }}
              className={`flex-shrink-0 flex items-baseline gap-px font-semibold text-sm w-7 ${isActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {slot.num}<span className="text-xs font-normal">{slot.dir === 'across' ? 'A' : 'D'}</span>
            </button>
            <span className="text-xs text-gray-400 dark:text-gray-500 italic select-none">See {originLabel}</span>
            <div className={`font-mono text-xs tracking-widest select-none ml-2 ${ANSWER_COLOR[effectiveStatus]}`}>
              {slot.answer}
            </div>
            <button
              onClick={() => removeFromChain(chainOrigin, slot)}
              title="Unlink from chain"
              className="ml-auto text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      );
    }

    // Chain info for origin slots
    const myChain = entry.chain ?? [];
    const combinedLength = slot.length + myChain.reduce((sum, cs) => {
      return sum + (slots.find(s => s.num === cs.number && s.dir === cs.direction)?.length ?? 0);
    }, 0);

    // Slots available to append to this chain
    const inChainKeys = new Set([key, ...myChain.map(cs => `${cs.number}-${cs.direction}`)]);
    const availableToChain = slots.filter(s => {
      const k = `${s.num}-${s.dir}`;
      return !inChainKeys.has(k) && !continuationMap.has(k);
    });

    return (
      <div
        key={key}
        ref={isActive ? activeRef : undefined}
        className={`border-b border-gray-100 dark:border-gray-700 px-3 py-1 ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
      >
        <div className="flex items-start gap-2">
          {/* Number + direction — clicking jumps grid cursor */}
          <button
            onClick={() => { setCursor({ row: slot.row, col: slot.col }); setDirection(slot.dir); }}
            className={`flex-shrink-0 flex items-baseline gap-px mt-0.5 font-semibold text-sm w-7 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {slot.num}<span className="text-xs font-normal">{slot.dir === 'across' ? 'A' : 'D'}</span>
          </button>

          {/* Answer preview + clue input */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-0.5">
              <div className={`font-mono text-xs tracking-widest select-none ${ANSWER_COLOR[effectiveStatus]}`}>
                {myChain.length > 0
                  ? [slot.answer, ...myChain.map(cs => slots.find(s => s.num === cs.number && s.dir === cs.direction)?.answer ?? '')].map((a, i) => (
                      <span key={i}>{i > 0 && <span className="text-gray-300 dark:text-gray-600 mx-px">·</span>}{a}</span>
                    ))
                  : slot.answer}
              </div>
              <EnumerationInput
                value={entry.enumeration}
                slotLength={combinedLength}
                onChange={v => updateClue(slot.num, slot.dir, { enumeration: v })}
              />
            </div>
            <AutoTextarea
              value={entry.clue}
              placeholder="Write clue…"
              onChange={v => updateClue(slot.num, slot.dir, { clue: v })}
              className={`w-full text-sm bg-transparent outline-none border-b placeholder-gray-300 dark:placeholder-gray-600 leading-snug
                ${isActive
                  ? 'border-blue-300 dark:border-blue-600 text-gray-900 dark:text-gray-100'
                  : 'border-transparent text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:hover:border-gray-600 focus:border-blue-300 dark:focus:border-blue-600'
                }`}
            />
          </div>

          {/* Status toggle */}
          <button
            onClick={() => cycleStatus(slot.num, slot.dir, entry.status, isWordComplete)}
            title={effectiveStatus}
            disabled={!isWordComplete}
            className={`flex-shrink-0 mt-1 text-base leading-none ${STATUS_COLOR[effectiveStatus]}`}
          >
            {STATUS_DOT[effectiveStatus]}
          </button>
        </div>

        {/* Notes — only rendered when active or notes exist */}
        {(isActive || notesOpen || entry.notes) && (
          <div className="mt-0.5 pl-7">
            <button
              onClick={() => toggleNotes(key)}
              className="text-xs text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400"
            >
              {notesOpen ? '▾' : '▸'} notes
              {entry.notes && !notesOpen && <span className="ml-1 text-amber-400">•</span>}
            </button>
            {notesOpen && (
              <AutoTextarea
                value={entry.notes}
                placeholder="Scratch pad…"
                onChange={v => updateClue(slot.num, slot.dir, { notes: v })}
                className="mt-1 w-full text-xs bg-transparent outline-none border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600 focus:border-blue-300 dark:focus:border-blue-600 leading-snug"
              />
            )}
          </div>
        )}

        {/* Chain section */}
        {(myChain.length > 0 || isActive) && (
          <div className="mt-1 pl-7 space-y-1">
            {myChain.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-xs text-gray-400 dark:text-gray-500 select-none">Continues:</span>
                {myChain.map((cs, i) => {
                  const csLabel = `${cs.number}${cs.direction === 'across' ? 'A' : 'D'}`;
                  const csSlot = slots.find(s => s.num === cs.number && s.dir === cs.direction);
                  return (
                    <span key={i} className="inline-flex items-center gap-0.5 text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded px-1.5 py-0.5 font-medium">
                      {csLabel}
                      {csSlot && <span className="text-indigo-400 dark:text-indigo-500 font-normal ml-0.5">({csSlot.length})</span>}
                      <button
                        onClick={() => removeChainSlot(slot, cs)}
                        title={`Remove ${csLabel} from chain`}
                        className="ml-0.5 text-indigo-300 dark:text-indigo-600 hover:text-red-400 font-bold leading-none"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {isActive && availableToChain.length > 0 && (
              <select
                value=""
                onChange={e => {
                  if (!e.target.value) return;
                  const parts = e.target.value.split('-');
                  const dir = parts.pop() as Direction;
                  const num = parseInt(parts[0], 10);
                  addToChain(slot, { number: num, direction: dir });
                }}
                className="text-xs text-gray-400 dark:text-gray-500 bg-transparent dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 outline-none hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer"
              >
                <option value="">+ link slot…</option>
                {availableToChain.map(s => (
                  <option key={`${s.num}-${s.dir}`} value={`${s.num}-${s.dir}`}>
                    {s.num}{s.dir === 'across' ? 'A' : 'D'} — {s.answer} ({s.length})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-0 w-full border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 overflow-hidden">
      {/* Sticky summary bar */}
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 px-4 py-1.5 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-4">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-200">{totalFillable}</span>
          <span> / {slots.length} filled · </span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">{confirmedCount}</span>
          <span> confirmed</span>
        </span>
        <QuickJump
          slots={slots}
          getClue={getClue}
          activeSlot={activeSlot}
          setCursor={setCursor}
          setDirection={setDirection}
        />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Across column */}
        <div className="flex-1 min-w-0 flex flex-col border-r border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Across
          </div>
          <div className="flex-1 overflow-y-auto">
            {acrossSlots.map(renderSlot)}
          </div>
        </div>

        {/* Down column */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Down
          </div>
          <div className="flex-1 overflow-y-auto">
            {downSlots.map(renderSlot)}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickJump({ slots, getClue, activeSlot, setCursor, setDirection }: {
  slots: Slot[];
  getClue: (num: number, dir: Direction) => ClueEntry;
  activeSlot: Slot | null;
  setCursor: (pos: { row: number; col: number }) => void;
  setDirection: (dir: Direction) => void;
}) {
  const unconfirmed = slots.filter(s => {
    if (s.answer.includes('_')) return false;
    const e = getClue(s.num, s.dir);
    return e.status !== 'confirmed';
  });

  const jumpToNext = (forward: boolean) => {
    if (unconfirmed.length === 0) return;
    if (!activeSlot) {
      const target = unconfirmed[0];
      setCursor({ row: target.row, col: target.col });
      setDirection(target.dir);
      return;
    }
    const idx = unconfirmed.findIndex(s => s.num === activeSlot.num && s.dir === activeSlot.dir);
    const next = forward
      ? unconfirmed[(idx + 1) % unconfirmed.length]
      : unconfirmed[(idx - 1 + unconfirmed.length) % unconfirmed.length];
    setCursor({ row: next.row, col: next.col });
    setDirection(next.dir);
  };

  const unfilledCount = slots.filter(s => s.answer.includes('_')).length;

  if (unconfirmed.length === 0) {
    if (unfilledCount === 0 && slots.length > 0) {
      return <span className="text-xs text-green-600 dark:text-green-400 font-medium">All confirmed ✓</span>;
    }
    return null;
  }

  return (
    <div className="flex items-center gap-1 ml-auto">
      <span className="text-xs text-gray-400 dark:text-gray-500">{unconfirmed.length} to confirm</span>
      <button
        onClick={() => jumpToNext(false)}
        title="Previous unconfirmed"
        className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
      >
        ↑
      </button>
      <button
        onClick={() => jumpToNext(true)}
        title="Next unconfirmed"
        className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
      >
        ↓
      </button>
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
      <span className="text-xs text-gray-400 dark:text-gray-500 select-none">(</span>
      <input
        value={raw}
        onChange={e => { setRaw(e.target.value); setError(null); }}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(raw); (e.target as HTMLInputElement).blur(); } }}
        placeholder={`${slotLength}`}
        aria-label="Word lengths e.g. 3,5,4"
        className={`text-xs w-[5ch] bg-transparent outline-none border-b leading-none
          ${error ? 'border-red-400 text-red-500 placeholder-red-300'
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-blue-300 dark:focus:border-blue-500 text-gray-500 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600'}`}
      />
      <span className="text-xs text-gray-400 dark:text-gray-500 select-none">)</span>
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

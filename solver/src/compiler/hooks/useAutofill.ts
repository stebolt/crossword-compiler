'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Direction } from '../../../../shared/types';
import type { Slot } from '../lib/cluePanelLogic';
import { findActiveSlot } from '../lib/cluePanelLogic';
import { matchPattern } from '../lib/wordList';

const MAX_SUGGESTIONS = 30;

export function useAutofill(
  slots: Slot[],
  cursor: { row: number; col: number },
  direction: Direction,
  shoehorn: string[],
) {
  const activeSlot = useMemo(
    () => findActiveSlot(slots, cursor, direction),
    [slots, cursor, direction],
  );

  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!activeSlot || !activeSlot.answer.includes('_')) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const pattern = activeSlot.answer.toUpperCase();

    const shoehornMatches = shoehorn.filter(word => {
      if (word.length !== pattern.length) return false;
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] !== '_' && pattern[i] !== word[i]) return false;
      }
      return true;
    });

    const shoehornSet = new Set(shoehornMatches);

    matchPattern(pattern).then(wordListMatches => {
      if (cancelled) return;
      const filtered = wordListMatches.filter(w => !shoehornSet.has(w));
      setSuggestions([...shoehornMatches, ...filtered].slice(0, MAX_SUGGESTIONS));
    });

    return () => { cancelled = true; };
  }, [activeSlot?.num, activeSlot?.dir, activeSlot?.answer, shoehorn]);

  return { activeSlot, suggestions };
}

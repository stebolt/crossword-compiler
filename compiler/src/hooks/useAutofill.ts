import { useMemo } from 'react';
import type { Direction } from '../../../shared/types';
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

  const suggestions = useMemo(() => {
    if (!activeSlot) return [];
    if (!activeSlot.answer.includes('_')) return [];

    const pattern = activeSlot.answer.toUpperCase();

    // Check shoehorn words directly against the pattern — independent of the word
    // list so custom theme words always surface if they fit. Preserves list order.
    const shoehornMatches = shoehorn.filter(word => {
      if (word.length !== pattern.length) return false;
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] !== '_' && pattern[i] !== word[i]) return false;
      }
      return true;
    });

    // Word-list matches follow, excluding any already shown as shoehorn matches.
    const shoehornSet = new Set(shoehornMatches);
    const wordListMatches = matchPattern(pattern).filter(w => !shoehornSet.has(w));

    return [...shoehornMatches, ...wordListMatches].slice(0, MAX_SUGGESTIONS);
  }, [activeSlot, shoehorn]);

  return { activeSlot, suggestions };
}

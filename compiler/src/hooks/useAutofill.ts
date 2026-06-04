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
    const matches = matchPattern(activeSlot.answer);
    if (shoehorn.length === 0) return matches.slice(0, MAX_SUGGESTIONS);
    // Shoehorn words that match the pattern float to the top.
    // Words already used elsewhere in the grid are intentionally not filtered out.
    const shoehornSet = new Set(shoehorn);
    const priority = matches.filter(w => shoehornSet.has(w));
    const rest = matches.filter(w => !shoehornSet.has(w));
    return [...priority, ...rest].slice(0, MAX_SUGGESTIONS);
  }, [activeSlot, shoehorn]);

  return { activeSlot, suggestions };
}

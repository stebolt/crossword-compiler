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
) {
  const activeSlot = useMemo(
    () => findActiveSlot(slots, cursor, direction),
    [slots, cursor, direction],
  );

  const suggestions = useMemo(() => {
    if (!activeSlot) return [];
    // Don't suggest if the word is fully filled
    if (!activeSlot.answer.includes('_')) return [];
    return matchPattern(activeSlot.answer).slice(0, MAX_SUGGESTIONS);
  }, [activeSlot]);

  return { activeSlot, suggestions };
}

import { useState, useCallback } from 'react';

const LS_KEY = 'cxc-shoehorn-v1';

function loadShoehorn(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* ignore */ }
  return [];
}

function persist(words: string[]): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(words)); } catch {}
}

export function useShoehorn() {
  const [shoehorn, setShoehornRaw] = useState<string[]>(loadShoehorn);

  const addWord = useCallback((word: string) => {
    const upper = word.trim().toUpperCase();
    if (!upper || !/^[A-Z]+$/.test(upper)) return;
    setShoehornRaw(prev => {
      if (prev.includes(upper)) return prev;
      const next = [...prev, upper];
      persist(next);
      return next;
    });
  }, []);

  const removeWord = useCallback((word: string) => {
    setShoehornRaw(prev => {
      const next = prev.filter(w => w !== word);
      persist(next);
      return next;
    });
  }, []);

  const resetShoehorn = useCallback(() => {
    setShoehornRaw([]);
    persist([]);
  }, []);

  const loadShoehornState = useCallback((words: string[]) => {
    setShoehornRaw(words);
    persist(words);
  }, []);

  return { shoehorn, addWord, removeWord, resetShoehorn, loadShoehornState };
}

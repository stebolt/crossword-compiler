'use client';

import { useState, useCallback } from 'react';

interface Meta { id: string; title: string; author: string; }

const LS_KEY = 'cxc-meta-v1';

function loadMeta(initial?: Meta): Meta {
  if (initial) return initial;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Meta;
  } catch { /* ignore */ }
  return { id: crypto.randomUUID(), title: '', author: '' };
}

export function useMeta(initialMeta?: Meta) {
  const [meta, setMetaRaw] = useState<Meta>(() => loadMeta(initialMeta));

  const persistMeta = useCallback((m: Meta) => {
    setMetaRaw(m);
    try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch {}
  }, []);

  const setTitle = useCallback((title: string) => {
    persistMeta({ ...meta, title });
  }, [meta, persistMeta]);

  const setAuthor = useCallback((author: string) => {
    persistMeta({ ...meta, author });
  }, [meta, persistMeta]);

  const resetMeta = useCallback((m: Meta) => {
    persistMeta(m);
  }, [persistMeta]);

  return { meta, setTitle, setAuthor, resetMeta };
}

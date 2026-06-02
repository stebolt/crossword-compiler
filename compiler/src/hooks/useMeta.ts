import { useState, useCallback } from 'react';

interface Meta {
  id: string;
  title: string;
  author: string;
}

const LS_KEY = 'cxc-meta-v1';

function loadMeta(): Meta {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Meta;
      if (parsed.id && parsed.title !== undefined) return parsed;
    }
  } catch { /* ignore */ }
  return { id: crypto.randomUUID(), title: 'Untitled', author: 'Steve' };
}

export function useMeta() {
  const [meta, setMetaRaw] = useState<Meta>(loadMeta);

  const setMeta = useCallback((m: Meta) => {
    setMetaRaw(m);
    localStorage.setItem(LS_KEY, JSON.stringify(m));
  }, []);

  const setTitle = useCallback((title: string) => {
    setMeta({ ...meta, title });
  }, [meta, setMeta]);

  const setAuthor = useCallback((author: string) => {
    setMeta({ ...meta, author });
  }, [meta, setMeta]);

  return { meta, setTitle, setAuthor };
}

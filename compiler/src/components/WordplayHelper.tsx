import { useState } from 'react';
import { WORDPLAY_CATEGORIES, COMMON_ABBREVIATIONS } from '../lib/wordplayData';

export function WordplayHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [showAbbr, setShowAbbr] = useState(false);

  const q = query.toLowerCase().trim();

  const filteredCategories = WORDPLAY_CATEGORIES.map(cat => ({
    ...cat,
    indicators: q
      ? cat.indicators.filter(i => i.toLowerCase().includes(q))
      : cat.indicators,
  })).filter(cat => !q || cat.indicators.length > 0 || cat.name.toLowerCase().includes(q));

  const filteredAbbr = q
    ? COMMON_ABBREVIATIONS.filter(
        a => a.abbr.toLowerCase().includes(q) || a.meanings.some(m => m.toLowerCase().includes(q)),
      )
    : COMMON_ABBREVIATIONS;

  const toggleCat = (id: string) =>
    setOpenCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="w-[544px] border border-gray-200 rounded-md bg-white">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
      >
        {isOpen ? '▼' : '▶'} Wordplay Reference
      </button>

      {isOpen && (
        <div className="border-t border-gray-100">
          <div className="px-3 pt-2 pb-1">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search indicators or abbreviations…"
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
            />
          </div>

          <div className="max-h-72 overflow-y-auto pb-2">
            {/* Indicator categories */}
            {filteredCategories.map(cat => {
              const isOpen = openCategories.has(cat.id) || !!q;
              return (
                <div key={cat.id}>
                  <button
                    onClick={() => toggleCat(cat.id)}
                    className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <span className="text-xs font-semibold text-gray-700">{cat.name}</span>
                    <span className="text-gray-400 text-xs">{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-2">
                      <p className="text-xs text-gray-400 mb-1">{cat.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {cat.indicators.map(ind => (
                          <span
                            key={ind}
                            className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                          >
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Abbreviations */}
            {filteredAbbr.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAbbr(o => !o)}
                  className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="text-xs font-semibold text-gray-700">Abbreviations</span>
                  <span className="text-gray-400 text-xs">{(showAbbr || !!q) ? '▾' : '▸'}</span>
                </button>
                {(showAbbr || !!q) && (
                  <div className="px-3 pb-2 space-y-0.5">
                    {filteredAbbr.map(a => (
                      <div key={a.abbr} className="flex gap-2 text-xs">
                        <span className="font-mono font-semibold text-gray-700 w-6 flex-shrink-0">{a.abbr}</span>
                        <span className="text-gray-500">{a.meanings.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

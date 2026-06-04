import Link from 'next/link';
import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';
import { computeNumbers } from '@/compiler/lib/gridLogic';
import { getSlots } from '@/compiler/lib/cluePanelLogic';
import type { CellValue } from '../../../shared/types';

function computeDifficulty(grid: CellValue[][]): 'Easy' | 'Medium' | 'Hard' {
  const numbers = computeNumbers(grid);
  const slots = getSlots(grid, numbers);
  if (slots.length === 0) return 'Medium';
  const avg = slots.reduce((sum, s) => sum + s.length, 0) / slots.length;
  if (avg < 7) return 'Easy';
  if (avg <= 9) return 'Medium';
  return 'Hard';
}

const difficultyStyle = {
  Easy: 'bg-green-900/30 text-green-400 border-green-700',
  Medium: 'bg-amber-900/30 text-amber-400 border-amber-700',
  Hard: 'bg-red-900/30 text-red-400 border-red-700',
};

export default async function Home() {
  const supabase = await createServerClient();
  const { data: puzzles } = await supabase
    .from('puzzles')
    .select('id, title, author, published_at, grid')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const items = (puzzles ?? []).map(p => ({
    ...p,
    difficulty: p.grid ? computeDifficulty(p.grid as CellValue[][]) : null,
  }));

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-2xl mx-auto p-6 pt-8">
        <h1 className="text-xl font-semibold text-white mb-6">Puzzles</h1>
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No puzzles published yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map(p => (
              <li key={p.id}>
                <Link
                  href={`/solve/${p.id}`}
                  className="flex items-center justify-between px-4 py-3.5 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-500 hover:bg-gray-750 transition-all"
                >
                  <div>
                    <div className="font-medium text-gray-100">{p.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">By {p.author || 'Unknown'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.difficulty && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${difficultyStyle[p.difficulty]}`}>
                        {p.difficulty}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{p.published_at?.split('T')[0]}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

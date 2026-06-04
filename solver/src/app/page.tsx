import Link from 'next/link';
import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function Home() {
  const supabase = await createServerClient();
  const { data: puzzles } = await supabase
    .from('puzzles')
    .select('id, title, author, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const items = puzzles ?? [];

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
                    <span className="text-xs text-gray-500">{p.published_at ? fmtDate(p.published_at) : ''}</span>
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

import Link from 'next/link';
import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function Home() {
  const supabase = await createServerClient();
  const [{ data: { user } }, { data: puzzles }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('puzzles').select('id, title, author, published_at').eq('status', 'published').order('published_at', { ascending: false }),
  ]);

  const items = puzzles ?? [];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 text-white px-5 py-2.5 flex items-center gap-3 text-sm flex-shrink-0">
        <span className="text-xs font-medium tracking-tight text-gray-400 uppercase">Crosswords</span>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link href="/compile" className="text-gray-300 hover:text-white transition-colors text-xs">
                Compile ↗
              </Link>
              <div className="w-px h-4 bg-gray-700" />
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="text-gray-400 hover:text-white transition-colors text-xs">Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors text-xs">Sign in</Link>
          )}
        </div>
      </header>
      <main className="max-w-2xl mx-auto w-full p-6">
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
                    {p.author && <div className="text-xs text-gray-400 mt-0.5">By {p.author}</div>}
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

import Link from 'next/link';
import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';
import AppTabs from '@/components/AppTabs';

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

  let progressMap: Record<string, string> = {};
  if (user && items.length > 0) {
    const { data: progress } = await supabase
      .from('puzzle_progress')
      .select('puzzle_id, status')
      .eq('user_id', user.id)
      .in('puzzle_id', items.map(p => p.id));
    for (const row of progress ?? []) {
      progressMap[row.puzzle_id] = row.status;
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-900 dark:bg-gray-950 text-white px-5 py-2 flex items-center text-sm flex-shrink-0 relative">
        <span className="text-xs font-medium tracking-tight text-gray-400 uppercase">Crosswords</span>
        <div className="absolute left-1/2 -translate-x-1/2">
          <AppTabs />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-gray-500">{user.email}</span>
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
            {items.map(p => {
              const status = progressMap[p.id];
              return (
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
                      {status === 'complete' && (
                        <span className="text-xs font-medium text-green-400 bg-green-900/30 border border-green-700 px-2 py-0.5 rounded-full">Complete</span>
                      )}
                      {status === 'in_progress' && (
                        <span className="text-xs font-medium text-amber-400 bg-amber-900/20 border border-amber-700 px-2 py-0.5 rounded-full">In progress</span>
                      )}
                      <span className="text-xs text-gray-500">{p.published_at ? fmtDate(p.published_at) : ''}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';
import CompilerDashboard from './CompilerDashboard';

export default async function CompilePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: puzzles } = await supabase
    .from('puzzles')
    .select('id, title, author, status, updated_at, published_at')
    .eq('owner_id', user!.id)
    .order('updated_at', { ascending: false });

  const publishedIds = (puzzles ?? []).filter(p => p.status === 'published').map(p => p.id);
  let solverProgress: SolverProgressRow[] = [];
  if (publishedIds.length > 0) {
    const { data: progress } = await supabase
      .from('puzzle_progress')
      .select('puzzle_id, user_email, status, started_at, completed_at')
      .in('puzzle_id', publishedIds);
    solverProgress = progress ?? [];
  }

  return (
    <CompilerDashboard
      puzzles={puzzles ?? []}
      isAdmin={user!.email === 'tech@stebolt.ch'}
      userEmail={user!.email ?? ''}
      solverProgress={solverProgress}
    />
  );
}

export interface SolverProgressRow {
  puzzle_id: string;
  user_email: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

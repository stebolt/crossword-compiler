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

  return <CompilerDashboard puzzles={puzzles ?? []} isAdmin={user!.email === 'tech@stebolt.ch'} userEmail={user!.email ?? ''} />;
}

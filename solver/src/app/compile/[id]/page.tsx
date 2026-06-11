import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import CompilerWrapper from './CompilerWrapper';

export default async function CompileEditPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: puzzle } = await supabase
    .from('puzzles')
    .select('id, title, author, grid, clues, shoehorn, status, symmetry')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single();

  if (!puzzle) notFound();

  return (
    <CompilerWrapper
      puzzleId={puzzle.id}
      initial={{
        grid: puzzle.grid ?? undefined,
        clues: puzzle.clues ?? undefined,
        meta: { id: puzzle.id, title: puzzle.title, author: puzzle.author },
        shoehorn: puzzle.shoehorn ?? [],
        status: puzzle.status ?? 'draft',
        symmetry: puzzle.symmetry ?? true,
      }}
    />
  );
}

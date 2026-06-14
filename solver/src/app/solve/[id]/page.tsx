import { notFound } from 'next/navigation';
import type { Crossword } from '../../../../../shared/types';
import { CrosswordSolver } from '@/components/CrosswordSolver';
import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';
import { buildCrossword } from '@/compiler/lib/crosswordExport';
import { computeNumbers } from '@/compiler/lib/gridLogic';
import { getSlots } from '@/compiler/lib/cluePanelLogic';
import type { ClueEntry } from '@/compiler/hooks/useClues';
import type { CellValue } from '../../../../../shared/types';

export default async function SolvePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createServerClient();
  const [{ data: { user } }, { data: puzzle }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('puzzles')
      .select('id, title, author, published_at, grid, clues')
      .eq('id', id)
      .eq('status', 'published')
      .single(),
  ]);

  if (!puzzle) notFound();

  let initialProgress = null;
  if (user) {
    const { data: progress } = await supabase
      .from('puzzle_progress')
      .select('user_grid, revealed, status')
      .eq('user_id', user.id)
      .eq('puzzle_id', id)
      .single();
    if (progress) initialProgress = progress;
  }

  const grid = puzzle.grid as CellValue[][];
  const cluesMap = (puzzle.clues ?? {}) as Record<string, ClueEntry>;
  const numbers = computeNumbers(grid);
  const slots = getSlots(grid, numbers);
  const getClue = (num: number, dir: 'across' | 'down') =>
    cluesMap[`${num}-${dir}`] ?? { clue: '', notes: '', status: 'unwritten', enumeration: [] };

  const crossword: Crossword = buildCrossword(grid, slots, getClue, {
    id: puzzle.id,
    title: puzzle.title,
    author: puzzle.author,
  });
  crossword.meta.publishedAt = puzzle.published_at?.split('T')[0] ?? '';

  return (
    <CrosswordSolver
      crossword={crossword}
      userId={user?.id}
      userEmail={user?.email}
      initialProgress={initialProgress}
    />
  );
}

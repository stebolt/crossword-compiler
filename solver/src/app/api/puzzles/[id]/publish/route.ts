import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';
import { validateCrossword } from '@/compiler/lib/crosswordExport';
import { getSlots } from '@/compiler/lib/cluePanelLogic';
import { computeNumbers } from '@/compiler/lib/gridLogic';
import type { ClueEntry } from '@/compiler/hooks/useClues';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: puzzle, error: fetchError } = await supabase
    .from('puzzles')
    .select('grid, clues, owner_id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (fetchError || !puzzle) return Response.json({ error: 'Not found' }, { status: 404 });

  const grid = puzzle.grid;
  const cluesMap = puzzle.clues as Record<string, ClueEntry>;
  const numbers = computeNumbers(grid);
  const slots = getSlots(grid, numbers);
  const getClue = (num: number, dir: 'across' | 'down') =>
    cluesMap[`${num}-${dir}`] ?? { clue: '', notes: '', status: 'unwritten', enumeration: [] };

  const { valid, errors } = validateCrossword(slots, getClue);
  if (!valid) return Response.json({ errors }, { status: 400 });

  const { error: updateError } = await supabase
    .from('puzzles')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', user.id);

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
  return Response.json({ ok: true });
}

import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('puzzles')
    .update({ status: 'draft', published_at: null })
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('puzzles')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, author, grid, clues, shoehorn } = body;

  const { error } = await supabase
    .from('puzzles')
    .update({ title, author, grid, clues, shoehorn, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('puzzles')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
    .eq('status', 'draft');

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

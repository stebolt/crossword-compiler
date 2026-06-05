import { createSupabaseServerClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import AdminInvitePanel from './AdminInvitePanel';

const ADMIN_EMAIL = 'tech@stebolt.ch';

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) notFound();

  return <AdminInvitePanel />;
}

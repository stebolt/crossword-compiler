import type { Metadata } from 'next';
import './globals.css';
import { createSupabaseServerClient as createServerClient } from '@/lib/supabase-server';
import NavBar from './NavBar';

export const metadata: Metadata = {
  title: 'Crosswords',
  description: 'Crossword puzzles',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <NavBar isLoggedIn={!!user} />
        {children}
      </body>
    </html>
  );
}

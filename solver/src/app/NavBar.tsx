'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  isLoggedIn: boolean;
}

export default function NavBar({ isLoggedIn }: Props) {
  const pathname = usePathname();

  // The compiler pages manage their own full-screen layout — hide the shared nav there
  if (pathname?.startsWith('/compile') || pathname?.startsWith('/solve')) return null;

  return (
    <nav className="bg-gray-900 text-white px-5 py-2.5 flex items-center gap-4 text-sm flex-shrink-0">
      <Link href="/" className="text-xs font-medium tracking-tight text-gray-400 hover:text-white transition-colors uppercase">
        Crosswords
      </Link>
      <div className="ml-auto flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <Link href="/compile" className="text-gray-300 hover:text-white transition-colors">
              Compile
            </Link>
            <div className="w-px h-4 bg-gray-700" />
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-gray-400 hover:text-white transition-colors text-xs">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

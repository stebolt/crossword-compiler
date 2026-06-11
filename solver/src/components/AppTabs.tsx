'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function SolveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">
      <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
    </svg>
  );
}

function CompileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">
      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
    </svg>
  );
}

export default function AppTabs() {
  const pathname = usePathname();
  const isCompile = pathname?.startsWith('/compile');

  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1">
      <Link
        href="/"
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          !isCompile
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <SolveIcon />
        Solve
      </Link>
      <Link
        href="/compile"
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          isCompile
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <CompileIcon />
        Compile
      </Link>
    </div>
  );
}

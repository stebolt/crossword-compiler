'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminInvitePanel() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();
      if (res.ok) {
        setStatus('sent');
        setEmail('');
      } else {
        setErrorMsg(body.error ?? 'Something went wrong');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gray-900 text-white px-5 py-2.5 flex items-center gap-3 text-sm">
        <Link href="/compile" className="text-xs font-medium tracking-tight text-gray-400 hover:text-white transition-colors uppercase">
          ← My Puzzles
        </Link>
        <div className="w-px h-4 bg-gray-700" />
        <span className="text-sm font-semibold text-white">Invite User</span>
      </header>

      <main className="flex-1 flex items-start justify-center p-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full max-w-md p-6">
          <h1 className="text-base font-semibold text-gray-900 mb-1">Invite a compiler</h1>
          <p className="text-sm text-gray-500 mb-5">
            They&apos;ll receive an email with a link to set their password and access the compiler.
          </p>

          <form onSubmit={handleInvite} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder="friend@example.com"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-gray-900"
            />
            <button
              type="submit"
              disabled={status === 'sending' || !email}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {status === 'sending' ? 'Sending…' : 'Send invite'}
            </button>
          </form>

          {status === 'sent' && (
            <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              Invite sent.
            </p>
          )}
          {status === 'error' && (
            <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {errorMsg}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

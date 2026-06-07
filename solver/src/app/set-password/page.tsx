'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type State = 'loading' | 'ready' | 'saving' | 'done' | 'error';

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = useRef(createSupabaseBrowserClient());
  const [state, setState] = useState<State>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // createBrowserClient exchanges hash tokens asynchronously; wait for a session
    supabase.current.auth.getSession().then(({ data: { session } }) => {
      if (session) { setState('ready'); return; }
    });

    const { data: { subscription } } = supabase.current.auth.onAuthStateChange((_event, session) => {
      if (session) setState('ready');
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (password !== confirm) { setErrorMsg('Passwords do not match'); return; }
    if (password.length < 8) { setErrorMsg('Password must be at least 8 characters'); return; }

    setState('saving');
    const { error } = await supabase.current.auth.updateUser({ password });
    if (error) {
      setErrorMsg(error.message);
      setState('ready');
    } else {
      router.push('/compile');
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-sm p-8">
        <h1 className="text-lg font-semibold text-white mb-1">Set your password</h1>
        <p className="text-sm text-gray-400 mb-6">Choose a password to access the compiler.</p>

        {state === 'loading' && (
          <p className="text-sm text-gray-400">Verifying invite link…</p>
        )}

        {(state === 'ready' || state === 'saving') && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
            <button
              type="submit"
              disabled={state === 'saving'}
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {state === 'saving' ? 'Saving…' : 'Set password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

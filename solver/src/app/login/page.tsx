import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-sm p-8">
        <h1 className="text-lg font-semibold text-white mb-1">Crossword Compiler</h1>
        <p className="text-sm text-gray-400 mb-6">Sign in to your account</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

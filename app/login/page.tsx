'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'gitlab' | null>(null);

  const handleSocialSignIn = async (provider: 'github' | 'gitlab') => {
    try {
      setLoadingProvider(provider);
      await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
      });
    } catch (error) {
      console.error(`Failed to sign in with ${provider}:`, error);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Welcome to StateFile
          </h1>
          <p className="text-sm text-gray-400">
            Sign in to inspect and verify your infrastructure.
          </p>
        </div>

        <div className="space-y-3">

          <button
            onClick={() => handleSocialSignIn('github')}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600 active:scale-[0.99]"
          >
            {loadingProvider === 'github' ? (
              <Spinner />
            ) : (
              <GitHubIcon className="w-5 h-5 text-white" />
            )}
            <span>Continue with GitHub</span>
          </button>

          <button
            onClick={() => handleSocialSignIn('gitlab')}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#e24329]/10 hover:bg-[#e24329]/20 border border-[#e24329]/30 rounded-lg text-sm font-medium text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {loadingProvider === 'gitlab' ? (
              <Spinner />
            ) : (
              <GitLabIcon className="w-5 h-5 text-[#e24329]" />
            )}
            <span>Continue with GitLab</span>
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          By signing in, you grant read-only access to verify public repository metadata.
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// GitHub Icon SVG
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// GitLab Icon SVG
function GitLabIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 015.48 2a.43.43 0 01.41.28l2.39 7.35h7.44l2.39-7.35a.43.43 0 01.41-.28.42.42 0 01.38.21l2.44 7.51 1.22 3.78a.84.84 0 01-.31.94z" />
    </svg>
  );
}

'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Repo } from '@/types/repos';

export default function GetRepos() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await apiFetch<{ repositories: Repo[] }>(
        '/api/v1/get-repos',
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      setRepos(data.repositories);
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      setError('Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#e24329]/10 hover:bg-[#e24329]/20 border border-[#e24329]/30 rounded-lg text-sm font-medium text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
      >
        <span>
          {isLoading ? 'Fetching repositories...' : 'Get Repos'}
        </span>
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Your Repositories
                </h2>

                <p className="text-sm text-zinc-400">
                  {repos.length} repositories found
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md px-3 py-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto">
              {repos.length > 0 ? (
                repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <p className="font-medium text-white">
                      {repo.name}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-zinc-400">
                  No repositories found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

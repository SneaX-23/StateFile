import React, { useState, useEffect } from 'react';
import { Repo } from "@/types/repos"
import RepositoryComponent from './repository-component';
import { Loader2, DownloadCloud } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function GetRepos() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(new Set());

  const fetchRepos = async (pageToFetch: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await apiFetch<{ repositories: Repo[], hasMore: boolean }>(
        `/api/v1/get-repos?page=${page}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );


      setRepos((prevRepos) => {
        if (pageToFetch === 1) return data.repositories;
        const existingIds = new Set(prevRepos.map(r => r.id));
        const newUniqueRepos = data.repositories.filter(r => !existingIds.has(r.id));
        return [...prevRepos, ...newUniqueRepos];
      });
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      setError('Failed to fetch repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialClick = () => {
    setIsOpen(true);
    // only fetch if we dont have data yet
    if (repos.length === 0) {
      setPage(1);
      fetchRepos(1);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRepos(nextPage);
  };

  const handleToggleRepo = (id: number) => {
    setSelectedRepoIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <>
      <div className="max-w-md w-full space-y-6">

        <button
          onClick={handleInitialClick}
          disabled={isLoading && repos.length === 0}
          className="group/btn w-full flex items-center justify-center gap-3 px-2 py-1 hover:bg-zinc-900 border border-zinc-500 rounded-lg text-sm font-medium text-white  hover:text-blue-400 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isLoading && repos.length === 0 ? (
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          ) : (
            <DownloadCloud className="w-4 h-4 text-zinc-400 group-hover/btn:text-blue-400 transition-colors" />
          )}
          <span>
            {isLoading && repos.length === 0 ? 'Initializing...' : 'Select Repositories'}
          </span>
          {selectedRepoIds.size > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-xs py-0.5 px-2 rounded-full font-bold">
              {selectedRepoIds.size}
            </span>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-lg text-sm text-red-400 text-center">
            {error}
          </div>
        )}

      </div>

      {isOpen && (
        <RepositoryComponent
          repos={repos}
          selectedRepoIds={selectedRepoIds}
          onToggleRepo={handleToggleRepo}
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

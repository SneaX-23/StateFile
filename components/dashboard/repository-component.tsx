import React, { useState, useEffect } from 'react';
import { Star, GitFork, Check, X, Loader2, ChevronLeft, ChevronRight, DownloadCloud, GitBranch } from 'lucide-react';
import { Repo } from "@/types/repos"
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation'
interface RepositoryComponentProps {
  repos: Repo[];
  selectedRepoIds: Set<number>;
  onToggleRepo: (id: number) => void;
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  onClose: () => void;
}

const RepositoryComponent: React.FC<RepositoryComponentProps> = ({
  repos,
  selectedRepoIds,
  onToggleRepo,
  isLoading,
  onLoadMore,
  hasMore,
  onClose
}) => {

  // max selection variable
  const MAX_SELECTION_LIMIT = 3;

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalPages = Math.ceil(repos.length / ITEMS_PER_PAGE) || 1;
  const router = useRouter();
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [repos.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentDisplayRepos = repos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const handleToggleWrapper = (id: number) => {
    if (!selectedRepoIds.has(id) && selectedRepoIds.size >= MAX_SELECTION_LIMIT) {
      // no alert for better ux
      alert(`You can only select up to ${MAX_SELECTION_LIMIT} repositories.`);
      return;
    }
    onToggleRepo(id);
  };

  const handleConfirmSelection = async () => {
    const selectedRepoNames = repos
      .filter(repo => selectedRepoIds.has(repo.id))
      .map(repo => ({ id: repo.id, name: repo.name }));

    if (selectedRepoNames.length === 0) return;

    try {
      setIsSubmitting(true);
      await apiFetch('/api/v1/import-repos', {
        method: 'POST',
        body: JSON.stringify({ repositories: selectedRepoNames }),
        credentials: 'include'
      });
      onClose();
      router.refresh()
    } catch (error) {
      console.error("Failed to submit repositories:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-zinc-800 rounded-lg border border-zinc-700/50 text-zinc-100">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-sans text-zinc-100 tracking-tight">Select Repositories</h2>
              <p className="text-xs text-zinc-400 font-medium">Choose projects to import (Max {MAX_SELECTION_LIMIT})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="space-y-2">
            {currentDisplayRepos.map((repo) => {
              const isSelected = selectedRepoIds.has(repo.id);
              return (
                <div
                  key={repo.id}
                  onClick={() => handleToggleWrapper(repo.id)}
                  className={`
                    group flex items-center justify-between p-4 rounded-lg border transition-all duration-200 cursor-pointer
                    ${isSelected
                      ? 'bg-blue-900/10 border-blue-500/50 ring-1 ring-blue-500/20'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-800/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    {/* Custom Checkbox */}
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={isSelected}
                        readOnly
                      />
                      <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center
                          ${isSelected ? 'bg-zinc-800 border-zinc-400' : 'border-zinc-600 bg-zinc-900 group-hover:border-zinc-400'}
                       `}>
                        <Check className={`w-3 h-3 text-white transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-medium truncate transition-colors ${isSelected ? 'text-blue-100' : 'text-zinc-200 group-hover:text-white'}`}>
                        {repo.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800/50">
                      <Star className="w-3.5 h-3.5 text-amber-400/80" />
                      <span className="text-xs font-medium tabular-nums">{repo.stars.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800/50">
                      <GitFork className="w-3.5 h-3.5 text-emerald-400/80" />
                      <span className="text-xs font-medium tabular-nums">{repo.forks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {repos.length === 0 && !isLoading && (
              <div className="text-center py-12 text-zinc-500">
                <DownloadCloud className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p>No repositories found.</p>
              </div>
            )}
          </div>

          {/* Load More Trigger */}
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); onLoadMore(); }}
                disabled={isLoading}
                className="w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/30 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    Fetching more...
                  </>
                ) : (
                  'Load More Repositories'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-zinc-400 font-medium">
            <span className="text-zinc-200">{selectedRepoIds.size}</span> / {MAX_SELECTION_LIMIT} selected
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 tabular-nums font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleConfirmSelection}
            disabled={isSubmitting || selectedRepoIds.size === 0}
            className="w-full sm:w-auto px-6 py-2 border border-zinc-800 hover:border-zinc-500 hover:text-blueprint-500 text-white rounded-lg font-medium text-sm transition-colors focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepositoryComponent;

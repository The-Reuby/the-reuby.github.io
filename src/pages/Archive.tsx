import { useState, useEffect, useMemo } from 'react';
import { Issue } from '../types';
import { IssueCard } from '../components/IssueCard';
import { EmptyState } from '../components/EmptyState';
import { getAssetPath } from '../utils/pathUtils';
import { motion } from 'framer-motion';
import { revealGroup, revealItem } from '../utils/motion';

// Every issue at a glance: the current issues (newest first) followed by any
// older ones kept only in the archive.
export const Archive = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        // Add cache-busting parameter to prevent caching
        const timestamp = new Date().getTime();
        const [current, archived] = await Promise.all([
          fetch(getAssetPath(`/data/issues.json?t=${timestamp}`)),
          fetch(getAssetPath(`/data/archived-issues.json?t=${timestamp}`)),
        ]);
        if (!current.ok || !archived.ok) {
          throw new Error('Failed to fetch issues');
        }
        setIssues([...(await current.json()), ...(await archived.json())]);
      } catch (err) {
        setError('Failed to load issues. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  // Filter issues based on search query
  const filteredIssues = useMemo(() => {
    if (!searchQuery) return issues;
    const query = searchQuery.toLowerCase();
    return issues.filter(issue =>
      issue.name.toLowerCase().includes(query) ||
      issue.theme?.toLowerCase().includes(query) ||
      issue.editors.some(editor => editor.toLowerCase().includes(query))
    );
  }, [issues, searchQuery]);

  if (loading) {
    return (
      // Fill the screen so the footer doesn't flash up and then jump down
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-16 bg-desk">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm uppercase tracking-[0.2em] text-muted">Loading issues...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] py-16">
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-red-600 dark:text-red-400">Error</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-desk text-ink">
      <section className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-24">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-ink/15 pb-4">
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-none">All Issues</h1>
          <label className="relative w-full sm:w-64">
            <span className="sr-only">Search issues...</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-ink/20 pl-6 py-2 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </label>
        </header>

        {filteredIssues.length > 0 ? (
          // Covers cascade in, one after another, as the grid scrolls into view
          <motion.div
            className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-5 sm:gap-x-8 gap-y-12"
            {...revealGroup}
          >
            {filteredIssues.map((issue) => (
              <motion.div key={issue.slug} variants={revealItem}>
                <IssueCard issue={issue} isLatest={issue.slug === issues[0]?.slug} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="py-10">
            <EmptyState
              message={`No issues found${searchQuery ? ` matching "${searchQuery}"` : ''}.`}
              action={searchQuery ? {
                label: "Clear Search",
                onClick: () => {
                  setSearchQuery('');
                }
              } : undefined}
            />
          </div>
        )}
      </section>
    </div>
  );
};

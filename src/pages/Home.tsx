import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Issue } from '../types';
import { IssueStack } from '../components/IssueStack';
import { SubmissionHero, SubmissionTicker } from '../components/SubmissionBanner';
import { getAssetPath } from '../utils/pathUtils';
import { fetchOpenCall, type OpenCall } from '../utils/submissionCall';

export const Home = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCall, setOpenCall] = useState<OpenCall | null>(null);
  const location = useLocation();

  // Always fetch issues when this component mounts
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        // Add cache-busting parameter to prevent caching
        const timestamp = new Date().getTime();
        // Load the submissions call alongside, so it's in place when the page appears
        const [response, call] = await Promise.all([
          fetch(getAssetPath(`/data/issues.json?t=${timestamp}`)),
          fetchOpenCall(),
        ]);
        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }
        const data = await response.json();
        setIssues(data);
        setOpenCall(call);
      } catch (err) {
        setError('Failed to load issues. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [location.key]); // Re-run when navigation happens

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
    <div className="bg-desk text-ink">
      <h1 className="sr-only">Reuby Magazine</h1>

      {/* While a call is open it leads the page; the issues follow */}
      {openCall && (
        <>
          <SubmissionTicker call={openCall} />
          <SubmissionHero call={openCall} />
        </>
      )}

      <div className={`pb-16 ${openCall ? 'pt-16 sm:pt-24' : ''}`}>
        <IssueStack issues={issues} />
      </div>
    </div>
  );
};

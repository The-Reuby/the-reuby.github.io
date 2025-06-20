import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Issue } from '../types';
import { IssueCard } from '../components/IssueCard';
import { EmptyState } from '../components/EmptyState';
import { getAssetPath } from '../utils/pathUtils';

export const Archive = () => {
  const [archivedIssues, setArchivedIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Fetch archived issues
  useEffect(() => {
    const fetchArchivedIssues = async () => {
      try {
        setLoading(true);
        // Add cache-busting parameter to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(getAssetPath(`/data/archived-issues.json?t=${timestamp}`));
        if (!response.ok) {
          throw new Error('Failed to fetch archived issues');
        }
        const data = await response.json();
        setArchivedIssues(data);
        setFilteredIssues(data);
      } catch (err) {
        setError('Failed to load archived issues. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedIssues();
  }, []);

  // Filter issues based on search query
  useEffect(() => {
    let result = [...archivedIssues];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(issue => 
        issue.name.toLowerCase().includes(query) || 
        issue.editors.some(editor => editor.toLowerCase().includes(query))
      );
    }
    
    setFilteredIssues(result);
  }, [archivedIssues, searchQuery]);

  const handleIssueClick = (issue: Issue) => {
    // Navigate to the reader page with the selected issue
    navigate(`/reader?issue=${issue.slug}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-medium text-slate-700 dark:text-slate-200">Loading archived issues...</div>
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
    <div className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary-700 dark:text-primary-300 mb-4">Archived Issues</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Browse through past issues of Reuby Magazine
          </p>
          <div className="mt-8 h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
        </header>

        <div className="mb-10">
          <div className="relative w-full max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search archived issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="absolute left-3 top-3.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {filteredIssues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.slug}
                issue={issue}
                onClick={handleIssueClick}
                isLatest={false}
              />
            ))}
          </div>
        ) : (
          <div className="py-10">
            <EmptyState 
              message={searchQuery 
                ? `No archived issues found matching "${searchQuery}".` 
                : "No archived issues available yet."
              }
              action={searchQuery ? {
                label: "Clear Search",
                onClick: () => {
                  setSearchQuery('');
                }
              } : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 
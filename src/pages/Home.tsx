import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Issue } from '../types';
import { IssueCard } from '../components/IssueCard';
import { EmptyState } from '../components/EmptyState';
import { getAssetPath } from '../utils/pathUtils';

export const Home = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Always fetch issues when this component mounts
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        // Add cache-busting parameter to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(getAssetPath(`/data/issues.json?t=${timestamp}`));
        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }
        const data = await response.json();
        setIssues(data);
        setFilteredIssues(data);
      } catch (err) {
        setError('Failed to load issues. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [location.key]); // Re-run when navigation happens

  // Filter issues based on search query
  useEffect(() => {
    let result = [...issues];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(issue => 
        issue.name.toLowerCase().includes(query) || 
        issue.editors.some(editor => editor.toLowerCase().includes(query))
      );
    }
    
    setFilteredIssues(result);
  }, [issues, searchQuery]);

  const handleIssueClick = (issue: Issue) => {
    // Navigate to the reader page with the selected issue
    navigate(`/reader?issue=${issue.slug}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-medium text-slate-700 dark:text-slate-200">Loading issues...</div>
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
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary-700 dark:text-primary-300 mb-4">Reuby Magazine</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Browse and enjoy the collection of Reuben College student magazine issues
          </p>
          <div className="mt-8 h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
        </header>

        {/* Featured Latest Issue Section */}
        {filteredIssues.length > 0 && (
          <div className="mb-16">
            <div className="max-w-5xl mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">Latest Issue</span>
                      <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {filteredIssues[0].name}
                      </h3>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(filteredIssues[0].date).toLocaleDateString('en-UK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {filteredIssues[0].pageCount} pages
                    </span>
                  </div>
                </div>
                
                {/* Mobile date display */}
                <div className="sm:hidden mb-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {new Date(filteredIssues[0].date).toLocaleDateString('en-UK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Team</span>
                    <div className="flex flex-wrap gap-2">
                      {filteredIssues[0].editors.map((editor, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                        >
                          {editor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleIssueClick(filteredIssues[0])}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Read Latest Issue
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">All Issues</h2>
            </div>          
            <div className="relative w-full max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search issues..."
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
            {filteredIssues.map((issue, index) => (
              <IssueCard
                key={issue.slug}
                issue={issue}
                onClick={handleIssueClick}
                isLatest={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="py-10">
            <EmptyState 
              message={`No issues found${searchQuery ? ` matching "${searchQuery}"` : ''}.`}
              action={{
                label: "Clear Search",
                onClick: () => {
                  setSearchQuery('');
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 
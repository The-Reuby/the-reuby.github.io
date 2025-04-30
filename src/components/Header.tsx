import { useState } from 'react';
import { Issue } from '../types';
import { useDarkMode } from '../hooks/useDarkMode';

interface HeaderProps {
  issues: Issue[];
  currentIssue: Issue | null;
  onIssueChange: (slug: string) => void;
  onMenuToggle: () => void;
  onBackClick?: () => void;
}

export const Header = ({
  issues,
  currentIssue,
  onIssueChange,
  onMenuToggle,
  onBackClick
}: HeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleIssueSelect = (slug: string) => {
    onIssueChange(slug);
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        {onBackClick && (
          <button 
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={onBackClick}
            aria-label="Back to home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <button 
          className="lg:hidden p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-300">Reuby Magazine</h1>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        
        <div className="relative">
          <button 
            className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={toggleDropdown}
          >
            <span>{currentIssue?.name || 'Select Issue'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 py-2 glass rounded-md shadow-lg z-10">
              {issues.map((issue) => (
                <button
                  key={issue.slug}
                  className={`block w-full text-left px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 ${
                    currentIssue?.slug === issue.slug ? 'bg-primary-100 dark:bg-primary-900' : ''
                  }`}
                  onClick={() => handleIssueSelect(issue.slug)}
                >
                  {issue.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}; 
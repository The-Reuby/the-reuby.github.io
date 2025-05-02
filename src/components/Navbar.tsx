import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const pathname = location.pathname;
  
  return (
    <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-[60]">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="/images/reuby_logo.jpg" 
                  alt="Reuby Logo" 
                  className="h-12 w-auto mr-2" 
                />
                {/* <span className="font-bold text-xl text-primary-700 dark:text-primary-300">Reuby Magazine</span> */}
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                to="/"
                className={`${pathname === '/' ? 'border-primary-500 text-primary-600 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-700 hover:border-slate-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Home
              </Link>
              <Link 
                to="/about"
                className={`${pathname === '/about' ? 'border-primary-500 text-primary-600 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-700 hover:border-slate-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                About
              </Link>
              <Link 
                to="/archive"
                className={`${pathname === '/archive' ? 'border-primary-500 text-primary-600 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-700 hover:border-slate-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Archive
              </Link>
              <Link 
                to="/contributors"
                className={`${pathname === '/contributors' ? 'border-primary-500 text-primary-600 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-700 hover:border-slate-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Contributors
              </Link>
              <Link 
                to="/submission"
                className={`${pathname === '/submission' ? 'border-primary-500 text-primary-600 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-700 hover:border-slate-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Submission
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Search functionality commented out for now
            <div className="relative">
              <input
                type="text"
                placeholder="Search issues..."
                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <div className="absolute left-2 top-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            */}
            
            <button
              onClick={toggleDarkMode}
              className="ml-4 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 focus:outline-none"
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
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className={`${pathname === '/' ? 'bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500 text-primary-700 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-white border-l-4'} block pl-3 pr-4 py-2 text-base font-medium`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={`${pathname === '/about' ? 'bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500 text-primary-700 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-white border-l-4'} block pl-3 pr-4 py-2 text-base font-medium`}
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            to="/archive"
            className={`${pathname === '/archive' ? 'bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500 text-primary-700 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-white border-l-4'} block pl-3 pr-4 py-2 text-base font-medium`}
            onClick={() => setIsMenuOpen(false)}
          >
            Archive
          </Link>
          <Link
            to="/contributors"
            className={`${pathname === '/contributors' ? 'bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500 text-primary-700 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-white border-l-4'} block pl-3 pr-4 py-2 text-base font-medium`}
            onClick={() => setIsMenuOpen(false)}
          >
            Contributors
          </Link>
          <Link
            to="/submission"
            className={`${pathname === '/submission' ? 'bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500 text-primary-700 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-white border-l-4'} block pl-3 pr-4 py-2 text-base font-medium`}
            onClick={() => setIsMenuOpen(false)}
          >
            Submission
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center px-4">
            {/* Mobile search functionality commented out for now
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search issues..."
                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
              />
              <div className="absolute left-2 top-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            */}
            <button
              onClick={toggleDarkMode}
              className="ml-4 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 focus:outline-none"
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
          </div>
        </div>
      </div>
    </nav>
  );
};
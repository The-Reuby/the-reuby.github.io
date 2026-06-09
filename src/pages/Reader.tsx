import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Issue, Article, IssueMeta } from '../types';
import { PageViewer } from '../components/PageViewer';
// Lazy so pdf.js (~1MB core + worker) only loads when an issue actually uses it.
const PdfPageViewer = lazy(() => import('../components/PdfPageViewer'));
import { TableOfContents } from '../components/TableOfContents';
import { Navbar } from '../components/Navbar';
import { getAssetPath } from '../utils/pathUtils';
import { useMetaTags } from '../hooks/useMetaTags';

export const Reader = () => {
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [issueMeta, setIssueMeta] = useState<IssueMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  // Get the issue slug from URL parameters
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const issueSlug = params.get('issue');
  const pageParam = params.get('page');
  
  // Parse page number from URL, defaulting to 1 if not valid
  const initialPageNumber = pageParam ? parseInt(pageParam, 10) : 1;
  const [currentPage, setCurrentPage] = useState(isNaN(initialPageNumber) ? 1 : initialPageNumber);
  const lastNavigatedPageRef = useRef(initialPageNumber);
  
  // Refs for the comments containers (mobile and desktop)
  const mobileCommentsRef = useRef<HTMLDivElement>(null);
  const desktopCommentsRef = useRef<HTMLDivElement>(null);
  
  // Generate meta tags for the current issue
  const metaTagsOptions = currentIssue ? {
    title: `${currentIssue.name}`,
    type: 'magazine',
    url: `${window.location.origin}${window.location.pathname}#/reader?issue=${currentIssue.slug}`,
    description: `Read ${currentIssue.name} - ${new Date(currentIssue.date).toLocaleDateString('en-UK', {
      year: 'numeric',
      month: 'long'
    })} issue of The Reuby, Reuben College's student magazine.`
  } : null;
  
  // Update meta tags when issue changes
  useMetaTags(metaTagsOptions);
  
  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    // Initial check
    checkScreenSize();
    
    // Listen for window resize
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load Utterances comments when showComments is true and currentIssue is available
  useEffect(() => {
    if (showComments && currentIssue) {
      // Determine which container to use based on screen size
      const isMobile = window.innerWidth < 1024;
      const targetRef = isMobile ? mobileCommentsRef : desktopCommentsRef;
      
      if (targetRef.current) {
        // Clear any existing comments
        targetRef.current.innerHTML = '';
        
        // Create and configure the script element
        const script = document.createElement('script');
        script.src = 'https://utteranc.es/client.js';
        script.setAttribute('repo', 'The-Reuby/the-reuby.github.io');
        script.setAttribute('issue-term', `${currentIssue.name}`);
        script.setAttribute('label', 'Comment');
        script.setAttribute('theme', 'github-light');
        script.setAttribute('crossorigin', 'anonymous');
        script.async = true;
        
        // Append the script to the comments container
        targetRef.current.appendChild(script);
      }
      
      // Also clear the other container to avoid duplicate comments
      const otherRef = isMobile ? desktopCommentsRef : mobileCommentsRef;
      if (otherRef.current) {
        otherRef.current.innerHTML = '';
      }
    }
  }, [showComments, currentIssue]);
  
  // Fetch the issue data
  useEffect(() => {
    const fetchIssue = async () => {
      if (!issueSlug) {
        navigate('/');
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(getAssetPath('/data/issues.json'));
        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }
        
        const issues: Issue[] = await response.json();
        const issue = issues.find(i => i.slug === issueSlug);
        
        if (!issue) {
          throw new Error(`Issue "${issueSlug}" not found`);
        }
        
        setCurrentIssue(issue);
        
        // Fetch articles metadata for the issue
        try {
          // First try to fetch from /data/{issue.slug}.json (for reubyte format)
          let metaResponse = await fetch(getAssetPath(`/data/${issue.slug}.json`));
          
          // If not found, try the default location /data/{issue.slug}/meta.json
          if (!metaResponse.ok) {
            metaResponse = await fetch(getAssetPath(`/data/${issue.slug}/meta.json`));
          }
          
          if (!metaResponse.ok) {
            throw new Error('Failed to fetch issue metadata');
          }
          
          const meta: IssueMeta = await metaResponse.json();
          setIssueMeta(meta);
        } catch (metaErr) {
          console.error(metaErr);
          // Non-fatal error for metadata
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load issue. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchIssue();
  }, [issueSlug, navigate]);
  
  // Make sure URL reflects current page
  useEffect(() => {
    // Only update URL if the page has actually changed and is not 0
    if (currentPage !== lastNavigatedPageRef.current && currentPage > 0) {
      // Update the URL
      const newParams = new URLSearchParams(location.search);
      newParams.set('page', currentPage.toString());
      
      // Preserve any existing view mode parameter
      // This ensures the double page view setting is maintained
      if (params.has('doubleview')) {
        newParams.set('doubleview', params.get('doubleview') || 'true');
      }
      
      navigate(`?${newParams.toString()}`, { replace: true });
      
      // Update the last navigated page ref
      lastNavigatedPageRef.current = currentPage;
    }
  }, [currentPage, location.search, navigate, params]);
  
  // Handle article click from TOC
  const handleArticleClick = (article: Article) => {
    if (article.pages.length > 0) {
      // Get the first page of the article (ensure it's not page 0)
      const firstPage = article.pages[0] > 0 ? article.pages[0] : 1;
      
      // Update the URL directly to ensure it changes immediately
      const newParams = new URLSearchParams(location.search);
      newParams.set('page', firstPage.toString());
      
      // IMPORTANT: Preserve the doubleview parameter if it exists
      // This ensures double page view mode persists when navigating via TOC
      if (params.has('doubleview')) {
        newParams.set('doubleview', params.get('doubleview') || 'true');
      }
      
      navigate(`?${newParams.toString()}`);
      
      // Set the current page in state
      setCurrentPage(firstPage);
      lastNavigatedPageRef.current = firstPage;
    }
  };
  
  // Update page when changes from viewer component
  const handlePageChange = (page: number) => {
    // Ensure we never set page to 0 in the URL
    if (page > 0) {
      setCurrentPage(page);
    }
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prevState => !prevState);
  };
  
  // Close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Toggle comments section
  const toggleComments = () => {
    setShowComments(prevState => !prevState);
  };

  // Toggle single/double page view mode
  const toggleViewMode = () => {
    const newParams = new URLSearchParams(location.search);
    const currentDoubleView = params.get('doubleview') === 'true';
    
    if (currentDoubleView) {
      newParams.delete('doubleview');
    } else {
      newParams.set('doubleview', 'true');
    }
    
    navigate(`?${newParams.toString()}`, { replace: true });
  };

  // Close menu on escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isMobileMenuOpen]);
  
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh] py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-lg font-medium text-slate-700 dark:text-slate-200">Loading issue...</div>
          </div>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh] py-16">
          <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="mt-4 text-xl font-bold text-red-600 dark:text-red-400">Error</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{error}</p>
              <Link 
                to="/"
                className="mt-4 inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  if (!currentIssue) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh] py-16">
          <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="mt-4 text-xl font-bold text-slate-700 dark:text-slate-200">Issue Not Found</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">We couldn't find the requested magazine issue.</p>
              <Link 
                to="/"
                className="mt-4 inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Navbar */}
      <Navbar />
      
      {/* Reader Header */}
      <div className="bg-white dark:bg-slate-800 shadow-md z-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                className="lg:hidden p-2 mr-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={toggleMobileMenu}
                aria-label="Toggle table of contents"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-primary-700 dark:text-primary-300">{currentIssue.name}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(currentIssue.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })} · Page {currentPage} of {currentIssue.pageCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Comments toggle - hidden on mobile, shown on desktop */}
              <button
                onClick={toggleComments}
                className="hidden lg:flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Toggle comments"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {showComments ? 'Hide Comments' : 'Show Comments'}
              </button>
              
              {/* Single/Double page toggle - hidden on mobile, shown on desktop */}
              <button
                onClick={toggleViewMode}
                className="hidden lg:flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Toggle view mode"
              >
                {params.get('doubleview') === 'true' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                    </svg>
                    Single Page
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Double Page
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  try {
                    // First attempt - use React Router navigation
                    navigate('/', { replace: true });
                    
                    // Set a fallback - if the page doesn't change within 100ms, force reload
                    setTimeout(() => {
                      if (window.location.pathname.includes('/reader')) {
                        window.location.href = '/';
                      }
                    }, 100);
                  } catch (e) {
                    // Fallback to direct navigation if React Router fails
                    window.location.href = '/';
                  }
                }}
                className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Back to Issues list"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Issues
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reader Content */}
      <div className="flex flex-1 relative">
        {/* Table of Contents */}
        <TableOfContents
          issueMeta={issueMeta}
          currentIssue={currentIssue}
          isMobileMenuOpen={isMobileMenuOpen}
          onArticleClick={handleArticleClick}
          onMobileMenuClose={closeMobileMenu}
          currentPage={currentPage}
        />
        
        {/* Floating buttons for mobile */}
        <div className="lg:hidden fixed bottom-6 left-6 z-[95] flex flex-col gap-3">
          {/* TOC button */}
          <button
            className="p-3 rounded-full bg-primary-600 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={toggleMobileMenu}
            aria-label="Open table of contents"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Comments button */}
          <button
            className="p-3 rounded-full bg-slate-600 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            onClick={toggleComments}
            aria-label="Toggle comments"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
        
        {/* Page Viewer — PDF-direct rendering when the issue provides a pdfUrl,
            otherwise the pre-rendered PNG viewer. Both share the same API. */}
        {currentIssue.source === 'pdf' && currentIssue.pdfUrl ? (
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <PdfPageViewer
              currentIssue={{ pdfUrl: currentIssue.pdfUrl, pageCount: currentIssue.pageCount }}
              initialPage={currentPage}
              onPageChange={handlePageChange}
              isTocVisible={isLargeScreen || isMobileMenuOpen}
              doubleView={params.get('doubleview') === 'true'}
            />
          </Suspense>
        ) : (
          <PageViewer
            currentIssue={currentIssue}
            initialPage={currentPage}
            onPageChange={handlePageChange}
            isTocVisible={isLargeScreen || isMobileMenuOpen}
            doubleView={params.get('doubleview') === 'true'}
          />
        )}
        
        {/* Comments Section - Responsive Design */}
        {showComments && (
          <>
            {/* Mobile: Full-screen overlay */}
            <div className="lg:hidden fixed inset-0 z-[100] bg-white/60 dark:bg-slate-800/60 backdrop-blur-md">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200/40 dark:border-slate-700/40 bg-white/15 dark:bg-slate-800/15 backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Comments
                  </h2>
                  <button
                    onClick={toggleComments}
                    className="flex items-center px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Close comments"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </button>
                </div>
                
                {/* Mobile Comments Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {currentIssue.name}
                  </div>
                  <div 
                    ref={mobileCommentsRef}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Desktop: Right side panel */}
            <div className="hidden lg:block w-80 xl:w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 overflow-y-auto">
              <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Comments
                  </h2>
                  <button
                    onClick={toggleComments}
                    className="flex items-center px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Close comments"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {currentIssue.name}
                </div>
                <div 
                  ref={desktopCommentsRef}
                  className="w-full"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 
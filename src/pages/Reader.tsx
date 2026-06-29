import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Issue, Article, IssueMeta } from '../types';
import { PageViewer } from '../components/PageViewer';
// Lazy so pdf.js (~1MB core + worker) only loads when an issue actually uses it.
const PdfPageViewer = lazy(() => import('../components/PdfPageViewer'));
import { TableOfContents } from '../components/TableOfContents';
import { useDarkMode } from '../hooks/useDarkMode';
import { getAssetPath } from '../utils/pathUtils';
import { useMetaTags } from '../hooks/useMetaTags';

// The site-wide navigation, surfaced as a dropdown inside the immersive reader
// (mirrors the links in the global Navbar, which is hidden while reading).
const SITE_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/archive', label: 'Archive' },
  { to: '/contributors', label: 'Contributors' },
  { to: '/submission', label: 'Submission' },
  { to: '/voices', label: 'Voices' },
];

export const Reader = () => {
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null);
  const [issueMeta, setIssueMeta] = useState<IssueMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();

  // Site-nav dropdown (the immersive reader's stand-in for the global navbar).
  const [isSiteNavOpen, setIsSiteNavOpen] = useState(false);
  const siteNavRef = useRef<HTMLDivElement>(null);

  // Page zoom, lifted here so the controls live in the top toolbar; the PDF
  // viewer reports the allowed range and applies the value.
  const [zoom, setZoom] = useState(1);
  const [zoomMeta, setZoomMeta] = useState({ min: 0.5, max: 3 });
  const zoomIn = () => setZoom((z) => Math.min(zoomMeta.max, Math.round((z + 0.25) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(zoomMeta.min, Math.round((z - 0.25) * 100) / 100));

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

  // Sync the other way too: when the URL's page changes externally (e.g. a
  // "random article" jump that lands on the issue we're already viewing), move
  // the reader to it. Without this, same-issue jumps would be ignored because
  // the component stays mounted and currentPage keeps its old value.
  useEffect(() => {
    const urlPage = pageParam ? parseInt(pageParam, 10) : NaN;
    if (!isNaN(urlPage) && urlPage > 0 && urlPage !== currentPage) {
      setCurrentPage(urlPage);
      lastNavigatedPageRef.current = urlPage;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParam]);

  // Handle article click from TOC
  const handleArticleClick = (article: Article) => {
    if (article.pages.length > 0) {
      // First page of the article. Page 0 is the cover and is a valid target,
      // so only guard against negative/invalid values.
      const firstPage = Math.max(article.pages[0], 0);
      
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
    // Page 0 (the cover) is valid; only reject negative/invalid values.
    if (page >= 0) {
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

  // Jump to a random article (from the site-nav dropdown). Lightweight version
  // of the navbar's feature: pick a random issue + article and navigate there.
  const goToRandomArticle = async () => {
    setIsSiteNavOpen(false);
    try {
      const res = await fetch(getAssetPath('/data/issues.json'));
      const issues: { slug: string }[] = await res.json();
      if (!issues?.length) return;
      const issue = issues[Math.floor(Math.random() * issues.length)];

      let page = 1;
      try {
        const r = await fetch(getAssetPath(`/data/${issue.slug}.json`));
        if (r.ok) {
          const articles: { pages?: number[] }[] = (await r.json()).articles ?? [];
          if (articles.length) {
            const article = articles[Math.floor(Math.random() * articles.length)];
            page = article.pages?.[0] && article.pages[0] > 0 ? article.pages[0] : 1;
          }
        }
      } catch {
        // Couldn't read the article list — just open the issue at page 1.
      }

      navigate(`/reader?issue=${issue.slug}&page=${page}`);
    } catch (err) {
      console.error('Could not pick a random article', err);
    }
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

  // Dismiss the site-nav dropdown on outside click or Escape.
  useEffect(() => {
    if (!isSiteNavOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (siteNavRef.current && !siteNavRef.current.contains(e.target as Node)) {
        setIsSiteNavOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSiteNavOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isSiteNavOpen]);

  if (loading) {
    return (
      <>
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
      {/* Immersive single toolbar — the global navbar is hidden while reading */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-16">
            {/* Left: site menu · table of contents (mobile) · issue title */}
            <div className="flex items-center gap-1 min-w-0">
              <div className="relative" ref={siteNavRef}>
                <button
                  onClick={() => setIsSiteNavOpen((o) => !o)}
                  className="inline-flex items-center gap-1 h-10 pl-1 pr-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  aria-label="Site menu"
                  aria-haspopup="menu"
                  aria-expanded={isSiteNavOpen}
                >
                  <img src={getAssetPath('/images/reuby_logo.jpg')} alt="The Reuby" className="h-8 w-auto rounded" />
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-400 transition-transform ${isSiteNavOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isSiteNavOpen && (
                  <div role="menu" className="absolute left-0 top-full mt-1.5 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1.5 z-50">
                    {SITE_NAV_LINKS.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        role="menuitem"
                        onClick={() => setIsSiteNavOpen(false)}
                        className="block px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <button
                      onClick={goToRandomArticle}
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
                        <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" />
                        <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" />
                        <circle cx="12" cy="12" r="1.3" fill="currentColor" />
                        <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" />
                        <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" />
                      </svg>
                      Random article
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  try {
                    navigate('/', { replace: true });
                    setTimeout(() => {
                      if (window.location.pathname.includes('/reader')) {
                        window.location.href = '/';
                      }
                    }, 100);
                  } catch {
                    window.location.href = '/';
                  }
                }}
                className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                aria-label="Back to issues"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Issues</span>
              </button>

              <button
                onClick={toggleMobileMenu}
                className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                aria-label="Table of contents"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700 mx-1.5" />

              <div className="min-w-0">
                <h1 className="truncate text-base sm:text-lg font-bold text-primary-700 dark:text-primary-300 leading-tight">
                  {currentIssue.name}
                </h1>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400 leading-tight">
                  {new Date(currentIssue.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                  {' · '}
                  {currentPage === 0 ? 'Cover' : `Page ${currentPage} of ${currentIssue.pageCount}`}
                </p>
              </div>
            </div>

            {/* Right: zoom · view mode (desktop) · comments · dark mode */}
            <div className="flex items-center gap-1.5 shrink-0">
              {currentIssue.source === 'pdf' && currentIssue.pdfUrl && (
                <div className="hidden sm:flex items-center rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={zoomOut}
                    disabled={zoom <= zoomMeta.min}
                    className="flex h-9 w-8 items-center justify-center rounded-l-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                    aria-label="Zoom out"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setZoom(1)}
                    className="h-9 min-w-[3rem] px-1 text-center text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                    aria-label="Reset zoom to fit the page"
                    title="Reset zoom to fit the page"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    onClick={zoomIn}
                    disabled={zoom >= zoomMeta.max}
                    className="flex h-9 w-8 items-center justify-center rounded-r-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                    aria-label="Zoom in"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              )}

              <button
                onClick={toggleViewMode}
                className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                aria-label="Toggle one or two page view"
              >
                {params.get('doubleview') === 'true' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4h10v16H7z" />
                    </svg>
                    One page
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h7v14H4zM13 5h7v14h-7z" />
                    </svg>
                    Two pages
                  </>
                )}
              </button>

              <button
                onClick={toggleComments}
                className={`inline-flex items-center gap-1.5 h-9 px-2.5 lg:px-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                  showComments
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                aria-label="Toggle comments"
                aria-pressed={showComments}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden lg:inline">Comments</span>
              </button>

              <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

              <button
                onClick={toggleDarkMode}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
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
              zoom={zoom}
              onZoomChange={setZoom}
              onZoomMetaChange={setZoomMeta}
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
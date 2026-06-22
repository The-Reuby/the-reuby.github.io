import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import { getAssetPath } from '../utils/pathUtils';

// Small, shared caches so "Read a random article" is instant after the first
// load (the issue list + each issue's article metadata are tiny JSON files).
type IssueLite = { slug: string; name: string; pdfUrl?: string };
type ArticleLite = { title?: string; pages?: number[] };
let issuesCache: IssueLite[] | null = null;
const articleMetaCache = new Map<string, ArticleLite[]>();

// Background-load just the bytes for one page of an issue's PDF (range requests
// via pdf.js), warming the cache before the reader opens. pdf.js is imported
// dynamically so its ~1 MB worker stays out of the main bundle.
const preloadPdfPage = async (pdfUrl: string | undefined, appPage: number) => {
  if (!pdfUrl) return;
  try {
    const { loadPdf } = await import('../utils/pdf');
    const href = /^https?:\/\//.test(pdfUrl) ? pdfUrl : getAssetPath(pdfUrl);
    const task = loadPdf(href);
    const pdf = await task.promise;
    await pdf.getPage(appPage + 1); // app page -> PDF page (cover = app 0 -> PDF 1)
    pdf.destroy();
  } catch {
    // Ignore — the reader will load it normally.
  }
};

const prefetchRandomData = async () => {
  try {
    if (!issuesCache) {
      const res = await fetch(getAssetPath('/data/issues.json'));
      issuesCache = await res.json();
    }
    await Promise.all(
      (issuesCache ?? []).map(async (iss) => {
        if (articleMetaCache.has(iss.slug)) return;
        try {
          const r = await fetch(getAssetPath(`/data/${iss.slug}.json`));
          articleMetaCache.set(iss.slug, r.ok ? (await r.json()).articles ?? [] : []);
        } catch {
          articleMetaCache.set(iss.slug, []);
        }
      })
    );
  } catch {
    // Offline / fetch failed — the click handler will retry on demand.
  }
};

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDark, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  // Loading-modal state for the "random article" reveal.
  const [randomTarget, setRandomTarget] = useState<
    { slug: string; issue: string; title: string; page: number } | null
  >(null);
  const [revealStep, setRevealStep] = useState(0);

  // Warm the cache as soon as the nav mounts so the first click is instant.
  useEffect(() => {
    prefetchRandomData();
  }, []);

  // Pick a random issue + article, open the loading modal, prefetch the PDF, and
  // let the reveal timeline (below) take the reader there.
  const goToRandomArticle = async () => {
    try {
      let issues = issuesCache;
      if (!issues) {
        issues = await (await fetch(getAssetPath('/data/issues.json'))).json();
        issuesCache = issues;
      }
      if (!issues?.length) return;
      const issue = issues[Math.floor(Math.random() * issues.length)];

      let articles = articleMetaCache.get(issue.slug);
      if (!articles) {
        try {
          const r = await fetch(getAssetPath(`/data/${issue.slug}.json`));
          const data = r.ok ? await r.json() : {};
          articles = (data.articles ?? []) as ArticleLite[];
        } catch {
          articles = [];
        }
        articleMetaCache.set(issue.slug, articles);
      }

      let page = 1;
      let title = '';
      if (articles.length) {
        const article = articles[Math.floor(Math.random() * articles.length)];
        page = article.pages?.[0] && article.pages[0] > 0 ? article.pages[0] : 1;
        title = article.title ?? '';
      }

      setIsMenuOpen(false);
      setRevealStep(0);
      setRandomTarget({ slug: issue.slug, issue: issue.name, title: title || issue.name, page });

      // Actually load the target page in the background while the modal animates,
      // so by the time we navigate the bytes are already fetched. Wait for the
      // load (capped) AND a minimum animation time, whichever is longer.
      const minAnimation = new Promise<void>((r) => setTimeout(r, 2400));
      const maxWait = new Promise<void>((r) => setTimeout(r, 9000));
      await minAnimation;
      await Promise.race([preloadPdfPage(issue.pdfUrl, page), maxWait]);

      navigate(`/reader?issue=${issue.slug}&page=${page}`);
      setRandomTarget(null);
    } catch (err) {
      console.error('Could not pick a random article', err);
    }
  };

  // Reveal timeline: stagger the issue / article / page lines.
  useEffect(() => {
    if (!randomTarget) return;
    const timers = [
      window.setTimeout(() => setRevealStep(1), 550),
      window.setTimeout(() => setRevealStep(2), 1150),
      window.setTimeout(() => setRevealStep(3), 1750),
    ];
    return () => timers.forEach(clearTimeout);
  }, [randomTarget]);

  const DiceIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" />
    </svg>
  );

  return (
    <>
    <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-[60]">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src={getAssetPath("/images/reuby_logo.jpg")}
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
              <Link 
                to="/voices"
                className={`${pathname === '/voices' ? 'border-primary-500 text-primary-600 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-700 hover:border-slate-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Voices
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
              onClick={goToRandomArticle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold shadow-sm hover:bg-primary-700 hover:shadow transition-all duration-200"
              title="Read a random article"
            >
              <DiceIcon className="h-4 w-4" />
              Random
            </button>

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
          <Link
            to="/voices"
            className={`${pathname === '/voices' ? 'bg-primary-50 dark:bg-primary-900 border-l-4 border-primary-500 text-primary-700 dark:text-primary-300' : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-white border-l-4'} block pl-3 pr-4 py-2 text-base font-medium`}
            onClick={() => setIsMenuOpen(false)}
          >
            Voices
          </Link>
        </div>
        <div className="pt-4 pb-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 px-4">
            <button
              onClick={goToRandomArticle}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-base font-semibold shadow-sm hover:bg-primary-700 transition-colors"
            >
              <DiceIcon className="h-5 w-5" />
              Read a random article
            </button>
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

    {/* Random-article loading modal */}
    {randomTarget && (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 shadow-2xl p-8 text-center overflow-hidden animate-pop-in">
          {/* decorative glow */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary-500/10 blur-2xl"></div>

          {/* spinning dice */}
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-lg animate-spin [animation-duration:1.6s]">
            <DiceIcon className="w-8 h-8" />
          </div>

          <p className="text-lg font-bold text-slate-800 dark:text-white">
            Taking you to a random article<span className="animate-pulse">…</span>
          </p>

          <div className="mt-6 space-y-3 text-left min-h-[7rem]">
            {revealStep >= 1 && (
              <div className="animate-enter-right">
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400">Issue</p>
                <p className="font-semibold text-primary-700 dark:text-primary-300 leading-snug">{randomTarget.issue}</p>
              </div>
            )}
            {revealStep >= 2 && (
              <div className="animate-enter-right">
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400">Article</p>
                <p className="font-semibold text-slate-800 dark:text-white leading-snug">{randomTarget.title}</p>
              </div>
            )}
            {revealStep >= 3 && (
              <div className="animate-enter-right">
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400">Page</p>
                <p className="font-semibold text-slate-800 dark:text-white">{randomTarget.page}</p>
              </div>
            )}
          </div>

          {/* indeterminate loading bar — runs until the page has loaded */}
          <div className="relative mt-6 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/4 rounded-full bg-gradient-to-r from-primary-500 to-primary-700 animate-indeterminate"></div>
          </div>
          <p className="mt-3 text-xs text-slate-400">Loading the page…</p>
        </div>
      </div>
    )}
    </>
  );
};
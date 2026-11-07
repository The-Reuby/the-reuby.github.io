import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useDarkMode } from '../hooks/useDarkMode';
import { getAssetPath } from '../utils/pathUtils';
import { Logo } from './Logo';
import { NAV_LINKS } from '../utils/navLinks';

const menuList: Variants = { show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } };
const menuItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

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

const DarkModeToggle = ({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    aria-label="Toggle dark mode"
    className="p-2 text-ink/60 hover:text-accent transition-colors"
  >
    {isDark ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    )}
  </button>
);

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

  return (
    <>
    <nav className="sticky top-0 z-[60] bg-desk/90 backdrop-blur-md border-b border-ink/10 animate-nav-in motion-reduce:animate-none">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0 justify-self-start" onClick={() => setIsMenuOpen(false)}>
            <Logo className="h-6 sm:h-7 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                aria-current={pathname === to ? 'page' : undefined}
                className={`relative py-1 text-[12px] uppercase tracking-[0.16em] transition-colors ${pathname === to ? 'text-ink' : 'text-ink/55 hover:text-ink'}`}
              >
                {label}
                {/* The current section is marked with the ruby from the logo;
                    it glides to the new section on navigation */}
                {pathname === to && (
                  <motion.span
                    layoutId="nav-ruby"
                    aria-hidden="true"
                    className="absolute left-1/2 -bottom-2.5 -ml-[3px] h-1.5 w-1.5 rotate-45 bg-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center justify-self-end gap-3">
            <button
              onClick={goToRandomArticle}
              className="inline-flex items-center gap-1.5 py-1 text-[12px] uppercase tracking-[0.16em] text-accent hover:text-ink transition-colors"
              title="Read a random article"
            >
              <DiceIcon className="h-4 w-4" />
              Random
            </button>
            <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            className="md:hidden -mr-2 p-2 text-ink/70 hover:text-ink"
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? (
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>

    {/* Mobile menu: the sections set large, like a contents page */}
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          id="mobile-menu"
          className="md:hidden fixed inset-x-0 top-16 bottom-0 z-[55] overflow-y-auto bg-desk"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.ul className="px-6 pt-6" initial="hidden" animate="show" variants={menuList}>
            {NAV_LINKS.map(({ to, label }) => (
              <motion.li key={to} variants={menuItem} className="border-b border-ink/10">
                <Link
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={pathname === to ? 'page' : undefined}
                  className={`block py-3 text-4xl font-semibold tracking-tight ${pathname === to ? 'text-accent' : 'text-ink'}`}
                >
                  {label}
                </Link>
              </motion.li>
            ))}
          </motion.ul>
          <div className="flex items-center justify-between px-6 py-8">
            <button
              onClick={goToRandomArticle}
              className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-accent"
            >
              <DiceIcon className="h-5 w-5" />
              Read a random article
            </button>
            <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>

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
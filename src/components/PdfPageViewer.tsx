import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAssetPath } from '../utils/pathUtils';
import { loadPdf, type PdfDocument } from '../utils/pdf';

interface PdfPageViewerProps {
  currentIssue: {
    pdfUrl: string;
    pageCount: number;
  } | null;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  isTocVisible?: boolean;
  doubleView?: boolean;
}

/**
 * Drop-in sibling of `PageViewer` that renders a single linearized PDF directly
 * via pdf.js instead of pre-rendered PNGs. Same props/keyboard/page-change API,
 * so `Reader` can swap between the two with no other changes.
 *
 * Page-number semantics match the image reader: app "page 0" is the cover and
 * maps to PDF page 1; app page N maps to PDF page N + 1.
 *
 * Efficiency: only pages near the viewport are rendered to a canvas; pages that
 * scroll far away have their render cancelled and canvas dropped, bounding
 * memory. Combined with range-request loading (see `loadPdf`), only the bytes
 * for viewed pages are fetched.
 */
export const PdfPageViewer = ({
  currentIssue,
  initialPage = 1,
  onPageChange,
  isTocVisible = true,
  doubleView = false,
}: PdfPageViewerProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [viewMode, setViewMode] = useState<'single' | 'double'>(doubleView ? 'double' : 'single');
  const [isScreenWideEnough, setIsScreenWideEnough] = useState(false);

  // PDF document + derived page aspect ratio (width / height) for stable layout.
  const [docReady, setDocReady] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(595.44 / 842.16); // A4 fallback
  const [loadError, setLoadError] = useState<string | null>(null);

  const pdfRef = useRef<PdfDocument | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const renderObserverRef = useRef<IntersectionObserver | null>(null);
  const pageObserverRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);
  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  // Latest viewed page, read inside the (long-lived) render observer to decide
  // render priority without re-creating the observer on every page change.
  const currentPageRef = useRef(initialPage);

  // Per-page render bookkeeping: canvas + in-flight render task.
  type PageEntry = { canvas?: HTMLCanvasElement; task?: { cancel: () => void }; rendered?: boolean };
  const pageStateRef = useRef<Map<number, PageEntry>>(new Map());

  const pdfHref = currentIssue
    ? /^https?:\/\//.test(currentIssue.pdfUrl)
      ? currentIssue.pdfUrl
      : getAssetPath(currentIssue.pdfUrl)
    : '';

  // ---- Load the PDF document once per issue ---------------------------------
  useEffect(() => {
    if (!currentIssue) return;
    let cancelled = false;
    setDocReady(false);
    setLoadError(null);

    const task = loadPdf(pdfHref);
    task.promise
      .then(async (pdf) => {
        if (cancelled) {
          pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        // Read page 1's aspect ratio so placeholders are sized correctly without
        // fetching every page up front (magazine pages are uniformly sized).
        const first = await pdf.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        if (!cancelled) {
          setAspectRatio(vp.width / vp.height);
          setDocReady(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load PDF:', err);
          setLoadError('Failed to load this issue. Please try again later.');
        }
      });

    return () => {
      cancelled = true;
      task.destroy?.();
      // Cancel any in-flight renders and free canvases.
      pageStateRef.current.forEach((entry) => {
        entry.task?.cancel();
        entry.canvas?.remove();
      });
      pageStateRef.current.clear();
      pdfRef.current?.destroy();
      pdfRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfHref]);

  // ---- Screen-width / view-mode constraints (mirrors PageViewer) ------------
  useEffect(() => {
    const checkScreenWidth = () => {
      const wide = window.innerWidth >= 1024;
      setIsScreenWideEnough(wide);
      if ((!wide || !isTocVisible) && viewMode === 'double') setViewMode('single');
    };
    checkScreenWidth();
    window.addEventListener('resize', checkScreenWidth);
    return () => window.removeEventListener('resize', checkScreenWidth);
  }, [viewMode, isTocVisible]);

  useEffect(() => {
    if (doubleView && isScreenWideEnough && isTocVisible) setViewMode('double');
    else if (!doubleView) setViewMode('single');
  }, [doubleView, isScreenWideEnough, isTocVisible]);

  // Keep the URL's doubleview param in sync (mirrors PageViewer).
  useEffect(() => {
    const hasParam = searchParams.get('doubleview') === 'true';
    if (doubleView && !hasParam && isScreenWideEnough && isTocVisible) {
      const p = new URLSearchParams(searchParams);
      p.set('doubleview', 'true');
      setSearchParams(p, { replace: true });
    } else if (!doubleView && hasParam) {
      const p = new URLSearchParams(searchParams);
      p.delete('doubleview');
      setSearchParams(p, { replace: true });
    }
  }, [searchParams, doubleView, isScreenWideEnough, isTocVisible, setSearchParams]);

  // ---- Canvas rendering window ----------------------------------------------
  const renderPage = useCallback(async (appPage: number) => {
    const pdf = pdfRef.current;
    const container = pageContainerRef.current;
    if (!pdf || !container) return;

    const state = pageStateRef.current;
    const existing = state.get(appPage);
    if (existing?.rendered || existing?.task) return; // already rendered or rendering

    const slot = container.querySelector<HTMLElement>(`[data-pdf-page="${appPage}"]`);
    if (!slot) return;

    const entry: PageEntry = {};
    state.set(appPage, entry);

    try {
      const page = await pdf.getPage(appPage + 1); // app page -> PDF page (1-based, cover = page 1)
      const cssWidth = slot.clientWidth || 600;
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = (cssWidth / base.width) * dpr;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.className = 'w-full h-full object-contain bg-white';
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const task = page.render({ canvasContext: ctx, viewport });
      entry.task = task;
      entry.canvas = canvas;

      await task.promise;
      entry.task = undefined;
      entry.rendered = true;

      // Swap placeholder for the rendered canvas.
      if (state.get(appPage) === entry) {
        slot.querySelector('.pdf-placeholder')?.remove();
        if (!slot.contains(canvas)) slot.appendChild(canvas);
      } else {
        canvas.remove(); // page was released mid-render
      }
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name;
      if (name !== 'RenderingCancelledException') console.error(`Render failed for page ${appPage}:`, err);
      if (state.get(appPage) === entry) state.delete(appPage);
    }
  }, []);

  // Keep the priority ref in sync with the viewed page.
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const releasePage = useCallback((appPage: number) => {
    const state = pageStateRef.current;
    const entry = state.get(appPage);
    if (!entry) return;
    entry.task?.cancel();
    entry.canvas?.remove();
    state.delete(appPage);
  }, []);

  // ---- Observers: render window + current-page tracking ---------------------
  useEffect(() => {
    if (!docReady || !pageContainerRef.current) return;
    const container = pageContainerRef.current;

    // Render pages within one viewport above/below; release the rest.
    renderObserverRef.current?.disconnect();
    renderObserverRef.current = new IntersectionObserver(
      (entries) => {
        const toRender: number[] = [];
        entries.forEach((e) => {
          const appPage = parseInt((e.target as HTMLElement).getAttribute('data-pdf-page') || '-1', 10);
          if (appPage < 0) return;
          if (e.isIntersecting) toRender.push(appPage);
          else releasePage(appPage);
        });
        // Render the page nearest the one being viewed first, so the visible
        // page paints before off-screen neighbours.
        toRender
          .sort((a, b) => Math.abs(a - currentPageRef.current) - Math.abs(b - currentPageRef.current))
          .forEach(renderPage);
      },
      { root: container, rootMargin: '100% 0px 100% 0px', threshold: 0 }
    );

    // Track the most-visible page to drive the page counter / URL (mirrors PageViewer).
    pageObserverRef.current?.disconnect();
    let mostVisible = { pageNum: currentPage, ratio: 0 };
    pageObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current || userScrollingRef.current) return;
        mostVisible = { pageNum: mostVisible.pageNum, ratio: 0 };
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const spreadStart = parseInt(el.getAttribute('data-spread-start') || '0', 10);
          const pageNum = parseInt(el.getAttribute('data-page') || '0', 10);
          const num = viewMode === 'double' && spreadStart > 0 ? spreadStart : pageNum;
          if (entry.intersectionRatio > mostVisible.ratio) {
            mostVisible = { pageNum: num, ratio: entry.intersectionRatio };
          }
        });
        if (mostVisible.ratio > 0.5 && mostVisible.pageNum !== currentPage) {
          setCurrentPage(mostVisible.pageNum);
          onPageChange?.(mostVisible.pageNum);
        }
      },
      { root: container, rootMargin: '50px', threshold: [0.5, 0.75] }
    );

    container.querySelectorAll('[data-pdf-page]').forEach((el) => renderObserverRef.current?.observe(el));
    container.querySelectorAll('[data-page], [data-spread-start]').forEach((el) => pageObserverRef.current?.observe(el));

    return () => {
      renderObserverRef.current?.disconnect();
      pageObserverRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docReady, viewMode, renderPage, releasePage, onPageChange]);

  // ---- Scroll-to-page (mirrors PageViewer) ----------------------------------
  const scrollToPage = useCallback((pageNum: number, smooth = true) => {
    const container = pageContainerRef.current;
    if (!container || !currentIssue) return;
    isScrollingRef.current = true;

    const attempt = (tries = 0) => {
      let target: HTMLElement | null = document.getElementById(`page-${pageNum}`);
      if (!target && viewMode === 'double' && pageNum > 0) {
        const spreadStart = pageNum % 2 === 0 ? pageNum - 1 : pageNum;
        target = document.getElementById(`page-${spreadStart}`);
      }
      if (target) {
        // Instant ('auto') jumps land directly on the page without smooth-
        // scrolling through (and rendering) every page in between.
        target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        setTimeout(() => (isScrollingRef.current = false), 500);
      } else if (tries < 3) {
        setTimeout(() => attempt(tries + 1), 100 * (tries + 1));
      } else {
        isScrollingRef.current = false;
      }
    };
    attempt();
  }, [viewMode, currentIssue]);

  // React to initialPage changes coming from the parent (TOC clicks, URL, a
  // random-article jump). Jump instantly so we don't scroll through (and render)
  // every page on the way.
  useEffect(() => {
    if (initialPage !== currentPage) {
      setCurrentPage(initialPage);
      currentPageRef.current = initialPage;
      if (docReady) {
        renderPage(initialPage); // paint the target first
        scrollToPage(initialPage, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPage, docReady]);

  // Jump straight to the initial page once the document is ready.
  useEffect(() => {
    if (docReady) {
      currentPageRef.current = initialPage;
      renderPage(initialPage); // prioritise the landing page
      if (initialPage > 1) setTimeout(() => scrollToPage(initialPage, false), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docReady]);

  // Track user vs programmatic scrolling.
  useEffect(() => {
    const container = pageContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (!isScrollingRef.current) {
        userScrollingRef.current = true;
        if (scrollTimeoutRef.current !== null) window.clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = window.setTimeout(() => {
          userScrollingRef.current = false;
          scrollTimeoutRef.current = null;
        }, 150);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current !== null) window.clearTimeout(scrollTimeoutRef.current);
    };
  }, [docReady]);

  // Keyboard navigation (mirrors PageViewer).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentIssue) return;
      if (e.key === 'ArrowRight') {
        const step = viewMode === 'double' ? 2 : 1;
        const next = Math.min(currentPage + step, currentIssue.pageCount);
        setCurrentPage(next);
        scrollToPage(next);
        onPageChange?.(next);
      } else if (e.key === 'ArrowLeft') {
        const step = viewMode === 'double' ? 2 : 1;
        const prev = Math.max(currentPage - step, 0);
        setCurrentPage(prev);
        scrollToPage(prev);
        onPageChange?.(prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIssue, currentPage, onPageChange, scrollToPage, viewMode]);

  if (!currentIssue) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-lg text-slate-500">Please select an issue to begin reading</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-lg text-red-500">{loadError}</p>
      </div>
    );
  }

  // A canvas target slot with a loading placeholder, sized by the page aspect ratio.
  const pageSlot = (appPage: number, rounding: string, label: string, labelSide: 'left' | 'right') => (
    <div
      className={`relative w-full overflow-hidden ${rounding} shadow-lg bg-white`}
      style={{ aspectRatio: String(aspectRatio) }}
      data-pdf-page={appPage}
    >
      <div className="pdf-placeholder absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800/40">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <div className={`absolute bottom-2 ${labelSide === 'left' ? 'left-2' : 'right-2'} z-10 text-sm px-2 py-1 bg-white/80 dark:bg-slate-800/80 rounded-md`}>
        {label}
      </div>
    </div>
  );

  const renderPages = () => {
    const pages = [];

    // Cover (app page 0 -> PDF page 1).
    pages.push(
      <div key="cover" className="page-container my-6 mx-auto max-w-4xl" data-page={0} id="page-0">
        {pageSlot(0, 'rounded-lg', 'Cover', 'right')}
      </div>
    );

    if (viewMode === 'single') {
      for (let i = 1; i <= currentIssue.pageCount; i++) {
        pages.push(
          <div key={`page-${i}`} className="page-container my-6 mx-auto max-w-4xl" data-page={i} id={`page-${i}`}>
            {pageSlot(i, 'rounded-lg', String(i), 'right')}
          </div>
        );
      }
    } else {
      for (let i = 1; i <= currentIssue.pageCount; i += 2) {
        const left = i;
        const right = i + 1;
        const hasRight = right <= currentIssue.pageCount;
        pages.push(
          <div
            key={`spread-${left}`}
            className="page-container my-6 mx-auto max-w-6xl"
            data-page={`${left}${hasRight ? ',' + right : ''}`}
            data-spread-start={left}
            data-spread-end={hasRight ? right : left}
            id={`page-${left}`}
          >
            <div className="flex flex-col sm:flex-row gap-1 justify-center">
              <div className="sm:max-w-xl w-full">{pageSlot(left, 'rounded-l-lg', String(left), 'left')}</div>
              {hasRight ? (
                <div className="sm:max-w-xl w-full">{pageSlot(right, 'rounded-r-lg', String(right), 'right')}</div>
              ) : (
                <div
                  className="relative sm:max-w-xl w-full overflow-hidden rounded-r-lg bg-slate-100 dark:bg-slate-800/30"
                  style={{ aspectRatio: String(aspectRatio) }}
                />
              )}
            </div>
          </div>
        );
        if (hasRight) {
          pages.push(
            <div key={`page-${right}-anchor`} id={`page-${right}`} style={{ height: 0, overflow: 'hidden' }} aria-hidden="true" />
          );
        }
      }
    }
    return pages;
  };

  return (
    <div ref={pageContainerRef} className="flex-1 h-[calc(100vh-8rem)] overflow-y-auto px-4 py-6 scroll-smooth">
      {!docReady && !loadError ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-lg font-medium text-slate-700 dark:text-slate-200">Loading PDF…</div>
          </div>
        </div>
      ) : (
        renderPages()
      )}
    </div>
  );
};

export default PdfPageViewer;

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
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
  /** Current zoom factor (1 = fit a whole page to the viewport height). Owned by the reader toolbar. */
  zoom?: number;
  /** Report the allowed zoom range so the toolbar can enable/disable its buttons. */
  onZoomMetaChange?: (meta: { min: number; max: number }) => void;
  /** Ask the reader to change the zoom (used to clamp when the range shrinks). */
  onZoomChange?: (zoom: number) => void;
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
  zoom = 1,
  onZoomMetaChange,
  onZoomChange,
}: PdfPageViewerProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [viewMode, setViewMode] = useState<'single' | 'double'>(doubleView ? 'double' : 'single');
  const [isScreenWideEnough, setIsScreenWideEnough] = useState(false);

  // Zoom (1.0 = fit a whole page in the viewport height) is owned by the reader
  // toolbar and passed in. `fitWidth` is the single-page width that achieves the
  // fit; `availWidth` is how wide a page can grow before it fills the scroll area
  // — both are measured from the container and define the zoom range.
  const [fitWidth, setFitWidth] = useState(0);
  const [availWidth, setAvailWidth] = useState(0);

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
  // The user's intended page, used to restore position across a view-mode
  // toggle. Unlike `currentPage` it is NOT overwritten by the double-mode
  // spread-start reporting, so repeated toggling stays put instead of drifting.
  const anchorPageRef = useRef(initialPage);

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

  // ---- Measure the fit-to-height page width ---------------------------------
  // The scroll container is a fixed height (100vh - 8rem). Work out the page
  // width that lets one whole page fit inside it, so the default zoom shows the
  // full page. Re-measured on resize (and once the aspect ratio is known).
  useLayoutEffect(() => {
    const compute = () => {
      const c = pageContainerRef.current;
      if (!c) return;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      // clientHeight includes the container's py-6 padding (3rem); a centred
      // page also carries my-6 margins (3rem). Subtract both so one page fits.
      const usableH = c.clientHeight - 6 * rem;
      // clientWidth includes the px-4 padding (2rem); that's the widest a page
      // can get before it fills the column.
      setFitWidth(Math.max(0, usableH) * aspectRatio);
      setAvailWidth(Math.max(0, c.clientWidth - 2 * rem));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [aspectRatio]);

  // Report the allowed zoom range to the reader toolbar, and clamp the current
  // zoom if that range shrinks (e.g. the window narrowed). Zoom-in stops once a
  // page fills the column; the minimum is a half-size multi-page overview.
  useEffect(() => {
    const max = fitWidth > 0 ? Math.max(1, Math.min(3, availWidth / fitWidth)) : 3;
    onZoomMetaChange?.({ min: 0.5, max });
    if (zoom > max) onZoomChange?.(max);
  }, [fitWidth, availWidth, zoom, onZoomMetaChange, onZoomChange]);

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
      // In double-page mode every spread is anchored by its left (odd) page id,
      // so map any page to its spread start. Resolving this *first* matters: the
      // even-page elements sit at the end of a spread, so targeting them
      // directly would scroll a whole spread too far.
      const targetId =
        viewMode === 'double' && pageNum > 0
          ? `page-${pageNum % 2 === 0 ? pageNum - 1 : pageNum}`
          : `page-${pageNum}`;
      const target = document.getElementById(targetId);
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

  // Compute the page closest to the centre of the viewport right now (reads the
  // DOM, so it's accurate even after a fast scroll the observer didn't track).
  const computeVisiblePage = useCallback(() => {
    const container = pageContainerRef.current;
    if (!container) return null;
    const cRect = container.getBoundingClientRect();
    const centerY = cRect.top + cRect.height / 2;
    let bestPage: number | null = null;
    let bestDist = Infinity;
    container.querySelectorAll<HTMLElement>('[data-page]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < cRect.top || r.top > cRect.bottom) return; // out of view
      const dist = Math.abs(r.top + r.height / 2 - centerY);
      const spreadStart = parseInt(el.getAttribute('data-spread-start') || '0', 10);
      const pageNum = parseInt(el.getAttribute('data-page') || '0', 10);
      const num = viewMode === 'double' && spreadStart > 0 ? spreadStart : pageNum;
      if (dist < bestDist) {
        bestDist = dist;
        bestPage = num;
      }
    });
    return bestPage;
  }, [viewMode]);

  // React to initialPage changes coming from the parent (TOC clicks, URL, a
  // random-article jump). Jump instantly so we don't scroll through (and render)
  // every page on the way.
  useEffect(() => {
    if (initialPage !== currentPage) {
      setCurrentPage(initialPage);
      currentPageRef.current = initialPage;
      anchorPageRef.current = initialPage;
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
      anchorPageRef.current = initialPage;
      renderPage(initialPage); // prioritise the landing page
      if (initialPage > 1) setTimeout(() => scrollToPage(initialPage, false), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docReady]);

  // Switching single <-> double reflows the pages into a completely different
  // layout, so the browser's preserved scroll offset now points at the wrong
  // page. Re-assert the page we were on after the new layout commits (rAF), and
  // a couple more times to defeat any lazy-layout settling.
  useEffect(() => {
    if (!docReady) return;
    const page = anchorPageRef.current; // stable target, not the spread-start
    isScrollingRef.current = true; // suppress page-tracking while we restore
    const timers: number[] = [];
    const raf = requestAnimationFrame(() => {
      scrollToPage(page, false);
      timers.push(window.setTimeout(() => scrollToPage(page, false), 180));
      timers.push(window.setTimeout(() => scrollToPage(page, false), 450));
    });
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

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
          // When the user stops scrolling, read the actually-visible page so our
          // anchor/indicator are accurate (the observer can miss fast scrolls).
          if (!isScrollingRef.current) {
            const p = computeVisiblePage();
            if (p !== null) {
              anchorPageRef.current = p;
              currentPageRef.current = p;
              if (p !== currentPage) {
                setCurrentPage(p);
                onPageChange?.(p);
              }
            }
          }
        }, 150);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current !== null) window.clearTimeout(scrollTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docReady, computeVisiblePage, onPageChange]);

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

  // Re-render the visible pages crisply after a zoom change. Each canvas is
  // rasterised to the page's pixel width at render time, so CSS-scaling it to a
  // new size would blur; instead drop the canvases and repaint at the new width.
  useEffect(() => {
    if (!docReady) return;
    const id = window.setTimeout(() => {
      const container = pageContainerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      Array.from(pageStateRef.current.keys()).forEach((appPage) => releasePage(appPage));
      // Repaint pages within ~one viewport of the visible area.
      container.querySelectorAll<HTMLElement>('[data-pdf-page]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < cRect.top - cRect.height || r.top > cRect.bottom + cRect.height) return;
        const appPage = parseInt(el.getAttribute('data-pdf-page') || '-1', 10);
        if (appPage >= 0) renderPage(appPage);
      });
    }, 250);
    return () => window.clearTimeout(id);
  }, [zoom, docReady, releasePage, renderPage]);

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
  const pageSlot = (appPage: number, rounding: string) => (
    <div
      className={`relative w-full overflow-hidden ${rounding} shadow-lg bg-white`}
      style={{ aspectRatio: String(aspectRatio) }}
      data-pdf-page={appPage}
    >
      <div className="pdf-placeholder absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800/40">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const renderPages = () => {
    const pages = [];
    // Page width at the current zoom, capped so it never overflows the column.
    // (`availWidth || …` keeps a sensible size for the first paint before the
    // container is measured.)
    const singleMax = Math.min((fitWidth || 896) * zoom, availWidth || Infinity);
    const spreadMax = singleMax * 2 + 8; // two pages + the gap-1 between them

    // Cover (app page 0 -> PDF page 1).
    pages.push(
      <div key="cover" className="page-container my-6 mx-auto" style={{ maxWidth: singleMax }} data-page={0} id="page-0">
        {pageSlot(0, 'rounded-lg')}
      </div>
    );

    if (viewMode === 'single') {
      for (let i = 1; i <= currentIssue.pageCount; i++) {
        pages.push(
          <div key={`page-${i}`} className="page-container my-6 mx-auto" style={{ maxWidth: singleMax }} data-page={i} id={`page-${i}`}>
            {pageSlot(i, 'rounded-lg')}
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
            className="page-container my-6 mx-auto"
            style={{ maxWidth: spreadMax }}
            data-page={`${left}${hasRight ? ',' + right : ''}`}
            data-spread-start={left}
            data-spread-end={hasRight ? right : left}
            id={`page-${left}`}
          >
            <div className="flex flex-col sm:flex-row gap-1 justify-center">
              <div className="w-full">{pageSlot(left, 'rounded-l-lg')}</div>
              {hasRight ? (
                <div className="w-full">{pageSlot(right, 'rounded-r-lg')}</div>
              ) : (
                <div
                  className="relative w-full overflow-hidden rounded-r-lg bg-slate-100 dark:bg-slate-800/30"
                  style={{ aspectRatio: String(aspectRatio) }}
                />
              )}
            </div>
          </div>
        );
      }
    }
    return pages;
  };

  return (
    <div ref={pageContainerRef} className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6 scroll-smooth">
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

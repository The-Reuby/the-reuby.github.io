import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAssetPath } from '../utils/pathUtils';

interface PageViewerProps {
  currentIssue: {
    folder: string;
    pageCount: number;
  } | null;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  isTocVisible?: boolean;
  doubleView?: boolean;
}

export const PageViewer = ({ 
  currentIssue, 
  initialPage = 1,
  onPageChange,
  isTocVisible = true,
  doubleView = false
}: PageViewerProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [viewMode, setViewMode] = useState<'single' | 'double'>(
    doubleView ? 'double' : 'single'
  );
  const [isScreenWideEnough, setIsScreenWideEnough] = useState(false);
  const [showTooNarrowMessage, setShowTooNarrowMessage] = useState(false);
  const [tooNarrowReason, setTooNarrowReason] = useState('');
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingRef = useRef(false);
  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const navigatingRef = useRef(false);
  const messageTimeoutRef = useRef<number | null>(null);

  // Sync view mode with URL parameter on mount and URL changes
  useEffect(() => {
    // This effect is now mainly for setting search parameters based on prop changes
    // The main source of truth for view mode is now the doubleView prop
    
    // If doubleView is true but the parameter isn't set, set it
    const hasDoubleViewParam = searchParams.get('doubleview') === 'true';
    
    if (doubleView && !hasDoubleViewParam && isScreenWideEnough && isTocVisible) {
      // Set parameter if not already set
      const newParams = new URLSearchParams(searchParams);
      newParams.set('doubleview', 'true');
      setSearchParams(newParams, { replace: true });
    } 
    else if (!doubleView && hasDoubleViewParam) {
      // Remove parameter if it exists but shouldn't
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('doubleview');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, doubleView, isScreenWideEnough, isTocVisible, setSearchParams]);

  // Check if screen is wide enough for two-page view
  useEffect(() => {
    const checkScreenWidth = () => {
      // Desktop/tablet breakpoint - large enough for TOC + content
      const isWideEnough = window.innerWidth >= 1024; // lg breakpoint in Tailwind
      setIsScreenWideEnough(isWideEnough);
      
      // Force single view mode if screen isn't wide enough or TOC is hidden
      if ((!isWideEnough || !isTocVisible) && viewMode === 'double') {
        setViewMode('single');
      }
    };

    // Check on initial load
    checkScreenWidth();

    // Listen for resize events
    window.addEventListener('resize', checkScreenWidth);
    return () => window.removeEventListener('resize', checkScreenWidth);
  }, [viewMode, isTocVisible]);

  // React to TOC visibility changes
  useEffect(() => {
    // If TOC is hidden and in double view mode, switch to single
    if (!isTocVisible && viewMode === 'double') {
      setViewMode('single');
    }
  }, [isTocVisible, viewMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Track user scrolling vs programmatic scrolling
  useEffect(() => {
    const container = pageContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If not in programmatic scrolling, user is scrolling
      if (!isScrollingRef.current) {
        userScrollingRef.current = true;
        
        // Clear any existing timeout
        if (scrollTimeoutRef.current !== null) {
          window.clearTimeout(scrollTimeoutRef.current);
        }
        
        // Reset user scrolling flag after scrolling stops
        scrollTimeoutRef.current = window.setTimeout(() => {
          userScrollingRef.current = false;
          scrollTimeoutRef.current = null;
        }, 150);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to a specific page with smooth behavior
  const scrollToPage = useCallback((pageNum: number) => {
    if (!pageContainerRef.current || !currentIssue) return;
    
    isScrollingRef.current = true;
    console.log(`Attempting to scroll to page ${pageNum} in ${viewMode} mode`);
    
    // Function to attempt scrolling with retries
    const attemptScroll = (attempts = 0) => {
      // Always prioritize exact element ID matches first
      let targetElement = document.getElementById(`page-${pageNum}`);
      
      // If not found and this is double page mode, adjust our search
      if (!targetElement && viewMode === 'double' && pageNum > 0) {
        // For double mode, pages are grouped in spreads - find the containing spread
        const spreadStartPage = pageNum % 2 === 0 ? pageNum - 1 : pageNum;
        
        // Look for spread by ID first
        targetElement = document.getElementById(`page-${spreadStartPage}`);
        
        // If still not found, try data attributes
        if (!targetElement) {
          // Try finding by data-spread-start attribute
          const element = pageContainerRef.current?.querySelector(`[data-spread-start="${spreadStartPage}"]`);
          if (element) {
            targetElement = element as HTMLElement;
          }
          
          // Last resort - look for any element that might contain this page number
          if (!targetElement) {
            const potentialElements = pageContainerRef.current?.querySelectorAll('[data-page]');
            if (potentialElements) {
              for (const el of potentialElements) {
                const pageAttr = (el as HTMLElement).getAttribute('data-page');
                if (pageAttr && pageAttr.includes(String(pageNum))) {
                  targetElement = el as HTMLElement;
                  break;
                }
              }
            }
          }
        }
      } else if (pageNum === 0) {
        // Cover page handling (should be the same in both modes)
        targetElement = document.getElementById('page-0');
      }
      
      if (targetElement) {
        console.log(`Found element for page ${pageNum}, scrolling to it`);
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Reset scrolling flag after animation completes
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      } else if (attempts < 3) {
        // Retry a few times with increasing delays
        console.warn(`Could not find element for page ${pageNum}, retrying... (${attempts + 1}/3)`);
        setTimeout(() => attemptScroll(attempts + 1), 100 * (attempts + 1));
      } else {
        console.warn(`Failed to find page element after ${attempts} attempts for page ${pageNum}`);
        
        // Fall back to a position estimation
        if (pageContainerRef.current) {
          const totalHeight = pageContainerRef.current.scrollHeight;
          // Adjust position calculation based on page number and total pages
          const position = (pageNum / (currentIssue.pageCount + 1)) * totalHeight;
          pageContainerRef.current.scrollTo({
            top: position,
            behavior: 'smooth'
          });
          
          console.log(`Using fallback position calculation: ${position}px for page ${pageNum}`);
        }
        
        isScrollingRef.current = false;
      }
    };
    
    // Start scroll attempt
    attemptScroll();
  }, [viewMode, currentIssue]);

  // Update current page when initialPage prop changes
  useEffect(() => {
    if (initialPage !== currentPage) {
      setCurrentPage(initialPage);
      scrollToPage(initialPage);
    }
  }, [initialPage, currentPage, scrollToPage]);

  // Add a one-time effect to ensure initial page is set at mount
  useEffect(() => {
    // This runs only once when the component mounts
    if (initialPage > 1 && currentIssue) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        scrollToPage(initialPage);
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentIssue) return;
      
      if (e.key === 'ArrowRight') {
        const increment = viewMode === 'double' ? 2 : 1;
        const newPage = Math.min(currentPage + increment, currentIssue.pageCount);
        setCurrentPage(newPage);
        scrollToPage(newPage);
        onPageChange?.(newPage);
      } else if (e.key === 'ArrowLeft') {
        const decrement = viewMode === 'double' ? 2 : 1;
        const newPage = Math.max(currentPage - decrement, 0);
        setCurrentPage(newPage);
        scrollToPage(newPage);
        onPageChange?.(newPage);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIssue, currentPage, onPageChange, scrollToPage, viewMode]);

  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!pageContainerRef.current) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const options = {
      root: null,
      rootMargin: '50px',
      threshold: [0.5, 0.75]  // Observe at 50% and 75% visibility
    };

    // Track the most visible page
    let mostVisiblePage = {
      pageNum: currentPage,
      ratio: 0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      // Skip if programmatic scrolling or navigating is in progress
      if (isScrollingRef.current || navigatingRef.current || userScrollingRef.current) {
        return;
      }

      // Reset most visible page tracking for this batch of observations
      mostVisiblePage = {
        pageNum: mostVisiblePage.pageNum,
        ratio: 0
      };

      // Find the most visible page in this batch
      entries.forEach(entry => {
        // Only process visible elements
        if (!entry.isIntersecting) return;

        // Get the data attributes
        const el = entry.target as HTMLElement;
        const pageNum = parseInt(el.getAttribute('data-page') || '0', 10);
        const spreadStart = parseInt(el.getAttribute('data-spread-start') || '0', 10);
        
        // Determine current page based on view mode
        let currentPageNum = pageNum;
        if (viewMode === 'double' && spreadStart > 0) {
          currentPageNum = spreadStart;
        }
        
        // Update most visible page if this one is more visible
        if (entry.intersectionRatio > mostVisiblePage.ratio) {
          mostVisiblePage = {
            pageNum: currentPageNum,
            ratio: entry.intersectionRatio
          };
        }
      });

      // Only update if we have a significantly visible page (>50%) and it's different from current
      if (mostVisiblePage.ratio > 0.5 && mostVisiblePage.pageNum !== currentPage) {
        setCurrentPage(mostVisiblePage.pageNum);
        onPageChange?.(mostVisiblePage.pageNum);
      }
    }, options);

    // Observe all page elements
    const pageElements = pageContainerRef.current.querySelectorAll('[data-page], [data-spread-start]');
    pageElements.forEach(el => {
      observerRef.current?.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [currentIssue, onPageChange, viewMode, currentPage]);

  // Toggle between single and double page view
  const toggleViewMode = () => {
    // Don't allow double page view when screen is too narrow or TOC is hidden
    if (!isScreenWideEnough || !isTocVisible) {
      const tooNarrowReason = !isScreenWideEnough 
        ? "Two-page view is only available on larger screens" 
        : "Two-page view is only available when the table of contents is open";
        
      setShowTooNarrowMessage(true);
      setTooNarrowReason(tooNarrowReason);
      
      // Hide the message after 3 seconds
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      
      messageTimeoutRef.current = window.setTimeout(() => {
        setShowTooNarrowMessage(false);
        messageTimeoutRef.current = null;
      }, 3000);
      
      return;
    }
    
    // Update the URL parameter instead of directly changing state
    const newMode = viewMode === 'single' ? 'double' : 'single';
    
    // Create a new URLSearchParams instance
    const newParams = new URLSearchParams(searchParams);
    
    if (newMode === 'double') {
      newParams.set('doubleview', 'true');
    } else {
      newParams.delete('doubleview');
    }
    
    // Update search params (this will trigger the useEffect in the parent via URL change)
    setSearchParams(newParams, { replace: true });
    
    // Also update local state for immediate effect
    setViewMode(newMode);
    
    // Force reload the pages and reset observer
    setTimeout(() => {
      if (pageContainerRef.current && observerRef.current) {
        // Disconnect existing observer
        observerRef.current.disconnect();
        
        // Wait for DOM to update then re-observe
        setTimeout(() => {
          if (pageContainerRef.current && observerRef.current) {
            const pageElements = pageContainerRef.current.querySelectorAll('[data-page], [data-spread-start]');
            pageElements.forEach(el => {
              observerRef.current?.observe(el);
            });
            console.log(`Re-observed ${pageElements.length} elements after mode change to ${newMode}`);
            
            // Scroll to current page in new view mode
            scrollToPage(currentPage);
          }
        }, 200);
      }
    }, 100);
  };

  // Update view mode when doubleView prop changes
  useEffect(() => {
    if (doubleView && isScreenWideEnough && isTocVisible) {
      setViewMode('double');
    } else if (!doubleView) {
      setViewMode('single');
    }
  }, [doubleView, isScreenWideEnough, isTocVisible]);

  if (!currentIssue) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-lg text-slate-500">Please select an issue to begin reading</p>
      </div>
    );
  }

  // Format page number with leading zeros
  const formatPageNumber = (num: number) => {
    return num.toString().padStart(3, '0');
  };

  // Get image source for a given page
  const getPageImageSrc = (pageNum: number) => {
    if (!currentIssue || !currentIssue.folder) return '';
    
    // Special case for cover page
    if (pageNum === 0) {
      return getAssetPath(`${currentIssue.folder}/000.png`);
    }
    return getAssetPath(`${currentIssue.folder}/${formatPageNumber(pageNum)}.png`);
  };

  // Generate pages for both single and double page view
  const renderPages = () => {
    const pages = [];
    
    // Add cover page first (000.png)
    pages.push(
      <div 
        key="cover" 
        className="page-container my-6 mx-auto max-w-4xl" 
        data-page={0}
        id="page-0"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-lg">
          <img
            src={getPageImageSrc(0)}
            alt="Cover"
            className="w-full h-full object-contain bg-white"
            // Use eager loading for cover and initial page
            loading={0 === initialPage ? "eager" : "lazy"}
            onError={(e) => {
              console.error(`Failed to load cover image:`, e);
              // Add a fallback or retry mechanism if needed
              const imgElement = e.currentTarget as HTMLImageElement;
              
              // Try an alternative format if PNG fails (e.g., jpg)
              if (imgElement.src.endsWith('.png')) {
                imgElement.src = imgElement.src.replace('.png', '.jpg');
              }
            }}
          />
          <div className="absolute bottom-2 right-2 text-sm px-2 py-1 bg-white/80 dark:bg-slate-800/80 rounded-md">
            Cover
          </div>
        </div>
      </div>
    );
    
    if (viewMode === 'single') {
      // Single page view - start from page 1
      for (let i = 1; i <= currentIssue.pageCount; i++) {
        const pageNum = i;
        // Determine if this page should be eagerly loaded
        const shouldEagerLoad = pageNum === initialPage;
        
        pages.push(
          <div 
            key={`page-${pageNum}`} 
            className="page-container my-6 mx-auto max-w-4xl" 
            data-page={pageNum}
            id={`page-${pageNum}`}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-lg">
              <img
                src={getPageImageSrc(pageNum)}
                alt={`Page ${pageNum}`}
                className="w-full h-full object-contain bg-white"
                loading={shouldEagerLoad ? "eager" : "lazy"}
                onError={(e) => {
                  console.error(`Failed to load image for page ${pageNum}:`, e);
                  // Add a fallback or retry mechanism if needed
                  const imgElement = e.currentTarget as HTMLImageElement;
                  
                  // Try an alternative format if PNG fails (e.g., jpg)
                  if (imgElement.src.endsWith('.png')) {
                    imgElement.src = imgElement.src.replace('.png', '.jpg');
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 text-sm px-2 py-1 bg-white/80 dark:bg-slate-800/80 rounded-md">
                {pageNum}
              </div>
            </div>
          </div>
        );
      }
    } else {
      // Double page view - show pages in spreads with left pages always odd
      // First add all spreads with odd-numbered pages on the left
      for (let i = 1; i <= currentIssue.pageCount; i += 2) {
        const leftPageNum = i;
        const rightPageNum = i + 1;
        
        // Check if right page exists (for odd page count)
        const hasRightPage = rightPageNum <= currentIssue.pageCount;
        
        // Determine if this spread should be eagerly loaded
        const shouldEagerLoad = leftPageNum === initialPage || rightPageNum === initialPage;
        
        // Create individual IDs for both the spread and the pages within it
        // This allows better targeting for navigation
        pages.push(
          <div 
            key={`spread-${leftPageNum}`} 
            className="page-container my-6 mx-auto max-w-6xl"
            data-page={`${leftPageNum}${hasRightPage ? ',' + rightPageNum : ''}`}
            data-spread-start={leftPageNum}
            data-spread-end={hasRightPage ? rightPageNum : leftPageNum}
            id={`page-${leftPageNum}`}
          >
            <div className="flex flex-col sm:flex-row gap-1 justify-center">
              {/* Left page */}
              <div 
                className="relative aspect-[3/4] sm:max-w-xl w-full overflow-hidden rounded-l-lg shadow-lg"
                data-page-num={leftPageNum}
                id={`page-${leftPageNum}-content`}
              >
                <img
                  src={getPageImageSrc(leftPageNum)}
                  alt={`Page ${leftPageNum}`}
                  className="w-full h-full object-contain bg-white"
                  loading={shouldEagerLoad ? "eager" : "lazy"}
                  onError={(e) => {
                    console.error(`Failed to load image for page ${leftPageNum}:`, e);
                    // Add a fallback or retry mechanism if needed
                    const imgElement = e.currentTarget as HTMLImageElement;
                    
                    // Try an alternative format if PNG fails (e.g., jpg)
                    if (imgElement.src.endsWith('.png')) {
                      imgElement.src = imgElement.src.replace('.png', '.jpg');
                    }
                  }}
                />
                <div className="absolute bottom-2 left-2 text-sm px-2 py-1 bg-white/80 dark:bg-slate-800/80 rounded-md">
                  {leftPageNum}
                </div>
              </div>
              
              {/* Right page - only render if it exists */}
              {hasRightPage ? (
                <div 
                  className="relative aspect-[3/4] sm:max-w-xl w-full overflow-hidden rounded-r-lg shadow-lg"
                  data-page-num={rightPageNum}
                  id={`page-${rightPageNum}-content`}
                >
                  <img
                    src={getPageImageSrc(rightPageNum)}
                    alt={`Page ${rightPageNum}`}
                    className="w-full h-full object-contain bg-white"
                    loading={shouldEagerLoad ? "eager" : "lazy"}
                    onError={(e) => {
                      console.error(`Failed to load image for page ${rightPageNum}:`, e);
                      // Add a fallback or retry mechanism if needed
                      const imgElement = e.currentTarget as HTMLImageElement;
                      
                      // Try an alternative format if PNG fails (e.g., jpg)
                      if (imgElement.src.endsWith('.png')) {
                        imgElement.src = imgElement.src.replace('.png', '.jpg');
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-2 text-sm px-2 py-1 bg-white/80 dark:bg-slate-800/80 rounded-md">
                    {rightPageNum}
                  </div>
                </div>
              ) : (
                <div 
                  className="relative aspect-[3/4] sm:max-w-xl w-full overflow-hidden rounded-r-lg bg-slate-100 dark:bg-slate-800/30"
                ></div>
              )}
            </div>
          </div>
        );
        
        // Create a hidden anchor for direct navigation to right page if it exists
        // This helps with TOC navigation to even-numbered pages
        if (hasRightPage) {
          pages.push(
            <div 
              key={`page-${rightPageNum}-anchor`}
              id={`page-${rightPageNum}`}
              style={{ height: 0, overflow: 'hidden' }}
              data-alias-for={leftPageNum}
              aria-hidden="true"
            />
          );
        }
      }
    }
    
    return pages;
  };

  return (
    <div 
      ref={pageContainerRef}
      className="flex-1 h-[calc(100vh-8rem)] overflow-y-auto px-4 py-6 scroll-smooth"
    >
      {renderPages()}
      
      {/* Message for when screen is too narrow or TOC is hidden */}
      {showTooNarrowMessage && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-[35] animate-fade-in">
          {tooNarrowReason}
        </div>
      )}
      
      {/* Navigation and view mode controls - visible when screen is wide enough */}
      <div className={`fixed bottom-4 right-4 flex space-x-2 z-[30] ${(!isScreenWideEnough || !isTocVisible) ? 'hidden lg:flex' : ''}`}>
        <button
          className="p-3 rounded-full glass hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          onClick={toggleViewMode}
          aria-label={viewMode === 'single' ? "Switch to double page view" : "Switch to single page view"}
          title={viewMode === 'single' ? "Double page view" : "Single page view"}
        >
          {viewMode === 'single' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}; 
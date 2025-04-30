import { motion } from 'framer-motion';
import { Article, Issue } from '../types';
import { useEffect, useState } from 'react';

interface TableOfContentsProps {
  issueMeta: { slug: string; articles: Article[] } | null;
  currentIssue: Issue | null;
  isMobileMenuOpen: boolean;
  onArticleClick: (article: Article) => void;
  onMobileMenuClose: () => void;
  currentPage?: number;
}

export const TableOfContents = ({
  issueMeta,
  currentIssue,
  isMobileMenuOpen,
  onArticleClick,
  onMobileMenuClose,
  currentPage = 1
}: TableOfContentsProps) => {
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  // Update active article based on current page
  useEffect(() => {
    if (!issueMeta?.articles || !currentPage) return;
    
    // Find which article contains the current page
    const article = issueMeta.articles.find(article => 
      article.pages.includes(currentPage)
    );
    
    if (article) {
      setActiveArticleId(article.id);
    }
  }, [issueMeta?.articles, currentPage]);

  const handleArticleClick = (article: Article) => {
    // First set the active article ID
    setActiveArticleId(article.id);
    
    // Important: Trigger navigation before closing the menu
    // This ensures the navigation isn't lost when the menu closes
    onArticleClick(article);
    
    // Now close the mobile menu with a slight delay
    // This ensures navigation happens first
    setTimeout(() => {
      onMobileMenuClose();
    }, 50);
  };

  const isArticleActive = (articleId: string): boolean => {
    return articleId === activeArticleId;
  };

  const renderArticleItem = (article: Article) => {
    const isActive = isArticleActive(article.id);
    return (
      <li key={article.id}>
        <button
          className={`w-full text-left p-2 rounded-md transition-colors ${
            isActive 
              ? 'bg-primary-100 dark:bg-primary-900/50 border-l-4 border-primary-500' 
              : 'hover:bg-primary-50 dark:hover:bg-primary-900/30'
          }`}
          onClick={() => handleArticleClick(article)}
          aria-current={isActive ? 'page' : undefined}
        >
          <h4 className={`font-medium ${isActive ? 'text-primary-700 dark:text-primary-300' : ''}`}>
            {article.title}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            by {article.author}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Pages {article.pages.join(', ')}
          </p>
        </button>
      </li>
    );
  };

  // For desktop, we always show the TOC
  const desktopTOC = (
    <div className="hidden lg:block w-64 p-4 h-[calc(100vh-8rem)] overflow-y-auto bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-r border-white/20 dark:border-slate-700/20">
      <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
      {currentIssue && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">{currentIssue.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {new Date(currentIssue.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Team: {currentIssue.editors.join(', ')}
          </p>
        </div>
      )}
      <ul className="space-y-2">
        {issueMeta?.articles?.map(renderArticleItem)}
      </ul>
    </div>
  );

  // For mobile, we show the TOC as a slide-in menu
  const mobileTOC = (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: isMobileMenuOpen ? 0 : '-100%' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 w-72 h-full z-[100] lg:hidden bg-white dark:bg-slate-800 shadow-xl"
      style={{ height: '100%' }}
    >
      <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold">Table of Contents</h2>
        <button
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
          onClick={onMobileMenuClose}
          aria-label="Close menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 4rem)' }}>
        {currentIssue && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">{currentIssue.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {new Date(currentIssue.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>
          </div>
        )}
        <ul className="space-y-2">
          {issueMeta?.articles?.map(renderArticleItem)}
        </ul>
      </div>
    </motion.div>
  );

  // Overlay for mobile menu - clicking this also triggers navigation
  const mobileOverlay = isMobileMenuOpen && (
    <div
      className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
      onClick={(e) => {
        // Prevent clicks on the overlay from navigating
        e.preventDefault();
        e.stopPropagation();
        onMobileMenuClose();
      }}
    />
  );

  return (
    <>
      {desktopTOC}
      {mobileOverlay}
      {mobileTOC}
    </>
  );
}; 
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAssetPath } from '../utils/pathUtils';
import { daysUntil, formatDeadline, isDeadlineOpen } from '../utils/deadline';
import { Ticker } from '../components/Ticker';

interface Guideline {
  id: string;
  title: string;
  theme: string;
  issue?: string;
  prompt?: string;
  highlights?: string[];
  file: string;
  deadline: string;
  posters?: Poster[];
}

interface Poster {
  src: string;
  label: string;
  alt: string;
}

interface GuidelinesData {
  current: Guideline;
  archived: Guideline[];
}

// Load the markdown content for a specific guideline file
const fetchGuidelineContent = async (filename: string): Promise<string> => {
  try {
    const response = await fetch(getAssetPath(`/data/submission/${filename}?t=${new Date().getTime()}`));
    if (!response.ok) {
      throw new Error('Failed to fetch guideline content');
    }
    return await response.text();
  } catch (err) {
    console.error('Error loading guideline content:', err);
    return '# Error\nCould not load the selected guideline. Please try again later.';
  }
};

export const Submission = () => {
  const [guidelinesData, setGuidelinesData] = useState<GuidelinesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [selectedGuideline, setSelectedGuideline] = useState<string>('current');
  // Index into the selected guideline's posters of the one shown enlarged
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Fetch guidelines JSON data
  useEffect(() => {
    const fetchGuidelinesData = async () => {
      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        const response = await fetch(getAssetPath(`/data/submission/guidelines.json?t=${timestamp}`));
        if (!response.ok) {
          throw new Error('Failed to fetch guidelines data');
        }
        const data = await response.json();
        setGuidelinesData(data);
        
        // Load the current guidelines by default
        fetchGuidelineContent(data.current.file).then(setMarkdownContent);
      } catch (err) {
        setError('Failed to load submission guidelines. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuidelinesData();
  }, []);

  const loadGuidelineContent = async (filename: string) => {
    setMarkdownContent(await fetchGuidelineContent(filename));
  };

  // Handle guideline selection change
  const handleGuidelineChange = (value: string) => {
    setSelectedGuideline(value);
    setOpenIndex(null);
    
    if (guidelinesData) {
      if (value === 'current') {
        loadGuidelineContent(guidelinesData.current.file);
      } else {
        const archivedGuideline = guidelinesData.archived.find(g => g.id === value);
        if (archivedGuideline) {
          loadGuidelineContent(archivedGuideline.file);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-medium text-slate-700 dark:text-slate-200">Loading guidelines...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] py-16">
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-red-600 dark:text-red-400">Error</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const selected = guidelinesData
    ? selectedGuideline === 'current'
      ? guidelinesData.current
      : guidelinesData.archived.find(g => g.id === selectedGuideline)
    : undefined;
  const posters = selected?.posters ?? [];
  const isCurrentOpen = selectedGuideline === 'current' && !!selected && isDeadlineOpen(selected.deadline);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-primary-700 dark:text-primary-300 mb-4">
            Submission Guidelines
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Submit your work to Reuby Magazine
          </p>
          <div className="mt-8 h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
        </header>

        {selected && posters.length > 0 && (() => {
          const deadline = formatDeadline(selected.deadline);
          const days = daysUntil(selected.deadline);
          const daysLeft = days === 0 ? 'Last day!' : `${days} day${days === 1 ? '' : 's'} left`;
          const issueName = selected.issue ?? selected.title;
          const tickerItems = isCurrentOpen
            ? ['Submissions open', `${issueName} — ${selected.theme}`, ...(selected.highlights ?? []), `Deadline ${deadline}`, daysLeft]
            : ['Submissions closed', `${issueName} — ${selected.theme}`, `Deadline was ${deadline}`];

          return (
            // Same editorial look as the home page banner: ticker strip, then a spread
            <section className="group overflow-hidden rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md mb-10">
              <Ticker items={tickerItems} />

              <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-center p-6 sm:p-10">
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                    The Reuby · {issueName}
                  </p>
                  <h2 className="mt-2 font-serif text-5xl sm:text-6xl leading-none tracking-tight text-primary-700 dark:text-primary-300">
                    {selected.theme}
                  </h2>
                  {selected.prompt && (
                    <p className="mt-4 max-w-md font-serif italic text-lg sm:text-xl leading-snug text-slate-600 dark:text-slate-300">
                      “{selected.prompt}”
                    </p>
                  )}

                  <dl className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700 grid sm:grid-cols-2 gap-4 max-w-md">
                    <div>
                      <dt className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Deadline</dt>
                      <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{deadline}</dd>
                      {isCurrentOpen && <dd className="text-sm text-slate-500 dark:text-slate-400">{daysLeft}</dd>}
                    </div>
                    <div>
                      <dt className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Send to</dt>
                      <dd className="mt-1">
                        <a href="mailto:thereuby@reuben.ox.ac.uk?subject=Submission" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                          thereuby@reuben.ox.ac.uk
                        </a>
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-7 flex flex-wrap gap-3">
                    {isCurrentOpen && (
                      <a
                        href="mailto:thereuby@reuben.ox.ac.uk?subject=Submission"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
                      >
                        Email your submission
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    )}
                    <a
                      href="#guidelines"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Read the guidelines
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="flex justify-center items-end gap-4 sm:gap-6">
                  {posters.map((poster, i) => (
                    <figure key={poster.src} className="text-center">
                      <button
                        type="button"
                        onClick={() => setOpenIndex(i)}
                        title={`${poster.label}: click to enlarge`}
                        className="block rounded-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-400 transition-transform duration-300 hover:-translate-y-1"
                      >
                        <img
                          src={getAssetPath(poster.src)}
                          alt={poster.alt}
                          className={`${posters.length === 1 ? 'h-80 sm:h-96' : 'h-56 sm:h-72'} w-auto rounded-sm shadow-xl ring-1 ring-slate-200 dark:ring-slate-600 hover:shadow-2xl transition-shadow`}
                        />
                      </button>
                      <figcaption className="mt-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        Click to enlarge
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {guidelinesData && (
          <div id="guidelines" className="scroll-mt-24 bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                  {selectedGuideline === 'current' 
                    ? `Current: ${guidelinesData.current.title}` 
                    : guidelinesData.archived.find(g => g.id === selectedGuideline)?.title}
                </h2>
                
                <div className="w-full sm:w-auto">
                  <select
                    value={selectedGuideline}
                    onChange={(e) => handleGuidelineChange(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700 dark:text-slate-200"
                  >
                    <option value="current">
                      Current: {guidelinesData.current.title}
                    </option>
                    <optgroup label="Past Guidelines">
                      {guidelinesData.archived.map((guideline) => (
                        <option key={guideline.id} value={guideline.id}>
                          {guideline.title}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {posters.length === 0 && (
              <div className="theme-tag inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium mb-6">
                Theme: {selectedGuideline === 'current'
                  ? guidelinesData.current.theme
                  : guidelinesData.archived.find(g => g.id === selectedGuideline)?.theme}
              </div>
              )}

              {/* The main markdown content area with proper styling */}
              <div className="prose prose-headings:text-primary-700 dark:prose-headings:text-primary-300 prose-a:text-primary-600 dark:prose-a:text-primary-400 dark:prose-invert prose-slate lg:prose-lg max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom components for better rendering
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="my-3" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 my-3" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-3" {...props} />,
                    li: ({node, ...props}) => <li className="my-1" {...props} />,
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-primary-300 dark:border-primary-700 pl-4 italic my-4" {...props} />
                    ),
                    code: ({node, className, children, ...props}) => {
                      const isInline = !className
                      return isInline ? 
                        <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code> : 
                        <code className="block bg-slate-100 dark:bg-slate-700 p-4 rounded-lg overflow-x-auto text-sm" {...props}>
                          {children}
                        </code>
                    },
                  }}
                >
                  {markdownContent}
                </ReactMarkdown>
              </div>
              
              <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/30 rounded-lg border border-primary-100 dark:border-primary-800">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                      <span className="font-medium">To submit your work, please send it to </span>
                      <a href="mailto:thereuby@reuben.ox.ac.uk" className="text-primary-600 dark:text-primary-400 hover:underline">
                        thereuby@reuben.ox.ac.uk
                      </a>
                    </p>
                    <p className="text-slate-700 dark:text-slate-300">
                      Please include the word 'Submission' in the subject line. You can use this email to contact us with any questions or issues.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-slate-700 dark:text-slate-300">
                <p>All the best,</p>
                <p className="font-medium">The Reuby Team</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {openIndex !== null && posters[openIndex] && (
        <PosterLightbox
          posters={posters}
          index={openIndex}
          onChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
};
// Full-screen poster viewer: Escape closes, arrow keys step through posters.
const PosterLightbox = ({
  posters,
  index,
  onChange,
  onClose,
}: {
  posters: Poster[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) => {
  const poster = posters[index];
  const hasMany = posters.length > 1;
  const step = (delta: number) => onChange((index + delta + posters.length) % posters.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (hasMany && e.key === 'ArrowRight') onChange((index + 1) % posters.length);
      else if (hasMany && e.key === 'ArrowLeft') onChange((index - 1 + posters.length) % posters.length);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, hasMany, posters.length, onChange, onClose]);

  const arrowClass =
    'absolute top-1/2 -translate-y-1/2 h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-colors';

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={poster.label}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 h-11 w-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <img
        key={poster.src}
        src={getAssetPath(poster.src)}
        alt={poster.alt}
        className="max-h-[80vh] max-w-full rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      <p className="mt-4 text-sm text-white/80">
        {poster.label}
        {hasMany && <span className="text-white/50"> · {index + 1} / {posters.length}</span>}
      </p>

      {hasMany && (
        <>
          <button
            type="button"
            aria-label="Previous poster"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            className={`${arrowClass} left-2 sm:left-6`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next poster"
            onClick={(e) => { e.stopPropagation(); step(1); }}
            className={`${arrowClass} right-2 sm:right-6`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

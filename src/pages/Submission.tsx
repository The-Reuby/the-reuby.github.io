import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAssetPath } from '../utils/pathUtils';

interface Guideline {
  id: string;
  title: string;
  theme: string;
  file: string;
  deadline: string;
}

interface GuidelinesData {
  current: Guideline;
  archived: Guideline[];
}

export const Submission = () => {
  const [guidelinesData, setGuidelinesData] = useState<GuidelinesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [selectedGuideline, setSelectedGuideline] = useState<string>('current');

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
        loadGuidelineContent(data.current.file);
      } catch (err) {
        setError('Failed to load submission guidelines. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuidelinesData();
  }, []);

  // Load the markdown content for a specific guideline file
  const loadGuidelineContent = async (filename: string) => {
    try {
      const response = await fetch(getAssetPath(`/data/submission/${filename}?t=${new Date().getTime()}`));
      if (!response.ok) {
        throw new Error('Failed to fetch guideline content');
      }
      const content = await response.text();
      setMarkdownContent(content);
    } catch (err) {
      console.error('Error loading guideline content:', err);
      setMarkdownContent('# Error\nCould not load the selected guideline. Please try again later.');
    }
  };

  // Handle guideline selection change
  const handleGuidelineChange = (value: string) => {
    setSelectedGuideline(value);
    
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

        {guidelinesData && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
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

              <div className="theme-tag inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium mb-6">
                Theme: {selectedGuideline === 'current'
                  ? guidelinesData.current.theme
                  : guidelinesData.archived.find(g => g.id === selectedGuideline)?.theme}
              </div>

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
    </div>
  );
};
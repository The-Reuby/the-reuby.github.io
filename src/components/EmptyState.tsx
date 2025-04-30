interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ message, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center max-w-lg mx-auto">
      <div className="relative mb-6">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-300 to-primary-600 rounded-full blur opacity-30 animate-pulse"></div>
        <div className="relative bg-white dark:bg-slate-800 p-5 rounded-full shadow-xl">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-24 w-24 text-primary-400 dark:text-primary-300" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
            />
          </svg>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3">Nothing to show</h3>
      <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">{message}</p>
      {action && (
        <button
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}; 
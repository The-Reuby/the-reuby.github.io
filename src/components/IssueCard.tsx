import { Issue } from '../types';
import { getAssetPath } from '../utils/pathUtils';

interface IssueCardProps {
  issue: Issue;
  onClick: (issue: Issue) => void;
  isLatest?: boolean;
}

export const IssueCard = ({ issue, onClick, isLatest = false }: IssueCardProps) => {
  const date = new Date(issue.date).toLocaleDateString('en-UK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate the path to the cover image (000.png)
  const coverImagePath = getAssetPath(`${issue.folder}000.png`);

  return (
    <div 
      className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-primary-300 dark:hover:border-primary-500"
      onClick={() => onClick(issue)}
    >
      {/* Latest badge */}
      {isLatest && (
        <div className="absolute top-3 left-3 z-20 bg-red-600/90 backdrop-blur-md text-white text-sm font-extrabold px-4 py-2 rounded-lg shadow-xl border border-red-400/50">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            New
          </div>
        </div>
      )}
      
      {/* Cover image with gradient overlay */}
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-30 group-hover:opacity-50 transition-opacity" />
        <img 
          src={coverImagePath} 
          alt={`${issue.name} cover`} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      
      <div className="p-5 bg-white dark:bg-slate-800">
        <div className="mb-3">
          <h3 className="text-xl font-extrabold text-primary-700 dark:text-primary-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">{issue.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{issue.oxfordTerm}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{date}</p>

        </div>
        
        <div className="mb-4 space-y-1.5">
          <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="font-semibold text-primary-600 dark:text-primary-400">Team:</span> 
            <span className="line-clamp-1">{issue.editors.join(', ')}</span>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="font-semibold text-primary-600 dark:text-primary-400">Pages:</span> 
            <span>{issue.pageCount}</span>
          </p>
        </div>
        
        <button 
          className="relative overflow-hidden w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-md transition-all duration-300 shadow-sm hover:shadow-md group-hover:shadow-primary-300/40 dark:group-hover:shadow-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
          onClick={(e) => {
            e.stopPropagation();
            onClick(issue);
          }}
          aria-label={`Read ${issue.name}`}
        >
          <span className="relative z-10">Read Issue</span>
          <span className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 group-hover:translate-y-0"></span>
        </button>
      </div>
    </div>
  );
}; 
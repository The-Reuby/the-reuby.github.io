import { Issue } from '../types';

interface IssueCardProps {
  issue: Issue;
  onClick: (issue: Issue) => void;
}

export const IssueCard = ({ issue, onClick }: IssueCardProps) => {
  const date = new Date(issue.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate the path to the cover image (000.png)
  const coverImagePath = `${issue.folder}000.png`;

  return (
    <div 
      className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-primary-300 dark:hover:border-primary-500"
      onClick={() => onClick(issue)}
    >
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
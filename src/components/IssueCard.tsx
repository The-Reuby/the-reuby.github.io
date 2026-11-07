import { Link } from 'react-router-dom';
import { Issue } from '../types';
import { getCoverPath, getReaderPath } from '../utils/pathUtils';

interface IssueCardProps {
  issue: Issue;
  isLatest?: boolean;
}

// A back issue on the desk: the cover at its true A-series proportion, and a
// caption in the magazine's type. Picking it up (hover) lifts it slightly.
export const IssueCard = ({ issue, isLatest = false }: IssueCardProps) => (
  <Link to={getReaderPath(issue.slug)} className="group block focus:outline-none" aria-label={`Read ${issue.name}`}>
    <div className="relative aspect-[1/1.414] overflow-hidden rounded-sm bg-paper shadow-page transition-[transform,box-shadow] duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-xl group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-desk">
      <img
        src={getCoverPath(issue)}
        alt={`${issue.name} cover`}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(e) => {
          // No cover uploaded yet: hide the broken image so the blank page shows.
          (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
        }}
      />
    </div>
    <div className="mt-4">
      <h3 className="text-lg font-semibold tracking-tight leading-snug text-ink group-hover:text-accent transition-colors">
        {issue.theme ?? issue.name}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {issue.name} · {issue.oxfordTerm}
        {isLatest && (
          <span className="ml-2 text-[11px] uppercase tracking-[0.2em] text-accent">New</span>
        )}
      </p>
    </div>
  </Link>
);

import { Fragment } from 'react';

// Endless strip of announcements, like a magazine cover strapline. The list is
// rendered twice so the `marquee` keyframe (shift by -50%) loops seamlessly.
// Pauses while an ancestor with the `group` class is hovered.
export const Ticker = ({ items }: { items: string[] }) => {
  const run = [...items, ...items];
  return (
    <div aria-hidden="true" className="overflow-hidden bg-primary-700 text-white py-2">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center">
            {run.map((text, i) => (
              <Fragment key={i}>
                <span className="px-5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] whitespace-nowrap">
                  {text}
                </span>
                <span className="text-[8px] text-primary-300">◆</span>
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { NAV_LINKS } from '../utils/navLinks';

// Set like a magazine's colophon: small, quiet, ruled off from the page above.
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-desk border-t border-ink/10">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-7">
            <Link to="/" className="inline-block">
              <Logo className="h-9 sm:h-11 w-auto" />
            </Link>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
              Reuby Reader is the platform for Reuben College's student magazine, showcasing the talent and creativity of our community.
            </p>
          </div>

          <nav className="md:col-span-5 md:justify-self-end">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted mb-4">
              Navigation
            </h3>
            <ul className="grid grid-cols-2 gap-x-12 gap-y-2.5">
              {NAV_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-ink/80 hover:text-accent transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 pt-6 border-t border-ink/10">
          <p className="text-xs text-muted">
            &copy; {currentYear} Reuben College Student Magazine. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

import { useEffect, useRef, useState } from 'react';
import contributorsData from '../data/contributors.json';

interface Contributor {
  name: string;
  role?: string;
  department?: string;
  programme?: string;
  image: string | null;
  bio?: string;
}

interface Team {
  year: string;
  issue: string;
  slug: string;
  term: string;
  members: Contributor[];
}

// Load every per-issue team file (src/data/teams/*.json) at build time, so new
// files like reuby4.json are picked up automatically. We drop blank template
// rows (no name) and surface any year that still has named members, even if
// their bios aren't filled in yet.
const editorialTeams: Team[] = Object.values(
  import.meta.glob<{ default: Team }>('../data/teams/*.json', { eager: true })
)
  .map((mod) => mod.default)
  .map((team) => ({ ...team, members: team.members.filter((m) => m.name?.trim()) }))
  .filter((team) => team.members.length > 0)
  .sort((a, b) => Number(b.year) - Number(a.year));

// Transparent freeze-frame cutout lives alongside the original photo.
const cutoutSrc = (image?: string | null) =>
  image ? `/images/people/cutout/${image.split('/').pop()!.replace(/\.[^.]+$/, '')}.png` : undefined;

// Shown as a full photo — Katherine's shot interacts with the Reuben dinosaur,
// which a cutout would throw away.
const noCutout = new Set(['Katherine Faulkner']);

export const Contributors = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  // Direction of the last navigation, so the incoming member slides in from the
  // matching side (1 = forward/right, -1 = back/left).
  const [direction, setDirection] = useState(1);

  // The newest year is the current editorial team; every older year is "past".
  const latestTeam = editorialTeams[0];
  const pastTeams = editorialTeams.slice(1);
  const members = latestTeam?.members ?? [];

  // Which past year is shown via the tabs (0 = most recent past year).
  const [selectedPastIndex, setSelectedPastIndex] = useState(0);
  const selectedPastTeam = pastTeams[selectedPastIndex];

  const openModal = () => {
    setDirection(1);
    setCurrentMemberIndex(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const goToMember = (index: number) => {
    if (index < 0 || index > members.length - 1) return;
    setDirection(index >= currentMemberIndex ? 1 : -1);
    setCurrentMemberIndex(index);
  };

  const nextMember = () => goToMember(currentMemberIndex + 1);
  const prevMember = () => goToMember(currentMemberIndex - 1);

  // Keyboard navigation + body scroll lock while the modal is open.
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowRight') nextMember();
      else if (e.key === 'ArrowLeft') prevMember();
    };

    window.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
    // currentMemberIndex is included so the handlers see the latest index.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, currentMemberIndex, members.length]);

  // Preload every photo + cutout once the modal opens, so switching members is
  // instant instead of flashing the previous frame while the new one decodes.
  useEffect(() => {
    if (!isModalOpen) return;
    (latestTeam?.members ?? []).forEach((m) => {
      if (!m.image) return;
      new Image().src = m.image;
      if (!noCutout.has(m.name)) {
        const c = cutoutSrc(m.image);
        if (c) new Image().src = c;
      }
    });
  }, [isModalOpen, latestTeam]);

  // On mobile the faces are a horizontal strip — keep the active one centred.
  const activeFaceRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isModalOpen && window.matchMedia('(max-width: 1023px)').matches) {
      activeFaceRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }, [currentMemberIndex, isModalOpen]);

  const currentMember = members[currentMemberIndex];
  const enterAnimation = direction >= 0 ? 'animate-enter-right' : 'animate-enter-left';

  const initials = (name: string) =>
    name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent mb-6">
            Contributors
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
          Meet the talented team behind The Reuby
          </p>
          <div className="mt-8 flex justify-center">
            <div className="h-1 w-32 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"></div>
          </div>
        </header>

        {/* Editorial Team — the newest year */}
        {latestTeam && (
        <section className="mb-20">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-primary-700 dark:text-primary-300 mb-4">Editorial Team</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-3">
            The Reuby is brought to life by a dedicated team of students from Reuben College who volunteer their time and talents to create each issue.
            </p>
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-8">
              {latestTeam.issue} · {latestTeam.year}
            </p>

            <div className="flex items-center justify-center">
              <button
                onClick={openModal}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:from-primary-700 hover:to-primary-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Introducing the Team
                <span className="ml-3 text-xs font-semibold text-white/70">{members.length} members</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {members.map((person: Contributor, index: number) => (
              <div key={index} className="group bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center ring-4 ring-primary-50 dark:ring-primary-900/50">
                        {person.image ? (
                          <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-primary-700 dark:text-primary-300 mb-2">{person.name}</h3>
                      {person.role && (
                        <p className="text-primary-500 dark:text-primary-400 font-medium mb-1">{person.role}</p>
                      )}
                      {person.programme && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{person.programme}</p>
                      )}
                      {person.bio && (
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{person.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* Faculty Advisors */}
        <section className="mb-20">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-primary-700 dark:text-primary-300 mb-4">Faculty Advisors</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Our publication is supported by the following faculty members who provide guidance and mentorship.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {contributorsData.advisors.map((person: Contributor, index: number) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                                             <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center">
                        {person.image ? (
                          <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primary-700 dark:text-primary-300 mb-2">{person.name}</h3>
                      <p className="text-amber-600 dark:text-amber-400 font-medium mb-3">{person.department}</p>
                      {person.bio && (
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">{person.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Past Editorial Team — older years, grouped by issue */}
        {pastTeams.length > 0 && (
        <section className="mb-20">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-primary-700 dark:text-primary-300 mb-4">Past Editorial Team</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We would like to thank all those who have contributed to building The Reuby in previous years.
            </p>
          </div>

          {/* Year selector — pick which past year's team to view (scales to many years) */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <label htmlFor="past-year" className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Viewing
            </label>
            <select
              id="past-year"
              value={selectedPastIndex}
              onChange={(e) => setSelectedPastIndex(Number(e.target.value))}
              className="px-5 py-3 rounded-xl border border-primary-200 dark:border-primary-700/50 bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-300 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              {pastTeams.map((team, index) => (
                <option key={team.slug} value={index}>
                  {team.year} — {team.issue}
                </option>
              ))}
            </select>
          </div>

          {selectedPastTeam && (
              <div key={selectedPastTeam.slug}>
                <h3 className="text-2xl font-bold text-primary-700 dark:text-primary-300 mb-6 text-center">
                  {selectedPastTeam.issue} <span className="text-slate-400 dark:text-slate-500 font-medium">· {selectedPastTeam.year}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedPastTeam.members.map((person: Contributor, index: number) => (
                    <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                              {person.image ? (
                                <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-primary-700 dark:text-primary-300 mb-1">{person.name}</h3>
                            {person.role && (
                              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">{person.role}</p>
                            )}
                            {person.programme && (
                              <p className="text-slate-400 dark:text-slate-500 text-sm mb-2">{person.programme}</p>
                            )}
                            {person.bio && (
                              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{person.bio}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          )}
        </section>
        )}

        {/* Content Contributors */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-primary-700 dark:text-primary-300 mb-4">Content Contributors</h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                We're grateful to the following individuals who have submitted and published their work in The Reuby.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {(contributorsData.contributors as string[]).map((name: string, index: number) => (
                  <div key={index} className="bg-white dark:bg-slate-800 rounded-lg px-4 py-3 text-center shadow-sm hover:shadow-md transition-shadow duration-200">
                    <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">{name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Join Our Team */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-12">
              <div className="max-w-3xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-white/20 backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold text-white mb-6">Join Our Team</h2>
                <p className="text-xl text-primary-100 mb-8 leading-relaxed">
                The Reuby welcomes new contributors from the Reuben College community. We're always looking for writers, editors, photographers, illustrators, and designers to join our team.
                </p>
                <a 
                  href="mailto:thereuby@reuben.ox.ac.uk" 
                  className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-bold rounded-xl shadow-lg hover:bg-gray-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Get Involved
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

            {/* Team Introduction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-md animate-fade-in"
            onClick={closeModal}
          ></div>

          {/* Modal panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${latestTeam?.issue ?? 'Editorial team'} — meet the team`}
            className="relative w-full max-w-6xl h-[94vh] sm:h-[92vh] lg:h-[720px] bg-white/20 dark:bg-slate-900/30 backdrop-blur-2xl shadow-2xl rounded-2xl lg:rounded-3xl overflow-hidden border border-white/30 dark:border-slate-700/50 flex flex-col animate-pop-in"
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-4 right-4 z-30 p-2.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:rotate-90 transition-all duration-300 shadow-lg hover:shadow-xl border border-white/30 dark:border-slate-700/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Stage — the focused member */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              {/* Portrait — freeze-frame "introduce myself": cutout pops off its own slightly-blurred photo */}
              <div key={currentMember.name} className="lg:w-[42%] h-[44vh] sm:h-72 lg:h-auto relative overflow-hidden bg-slate-900">
                {/* Background photo: slightly blurred behind a cutout, or the full sharp shot for environment portraits */}
                {currentMember.image && (
                  <img
                    src={currentMember.image}
                    alt={noCutout.has(currentMember.name) ? currentMember.name : ''}
                    aria-hidden={!noCutout.has(currentMember.name)}
                    className={`absolute inset-0 w-full h-full object-cover object-center animate-fade-in ${
                      noCutout.has(currentMember.name) ? 'saturate-105' : 'blur-[2px] brightness-90 saturate-110'
                    }`}
                  />
                )}
                {/* Cutout members get the warm duotone + halftone poster grade; full photos stay clear */}
                {noCutout.has(currentMember.name) ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"></div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-950/75 via-primary-900/15 to-primary-700/5"></div>
                    <div className="absolute inset-0 bg-amber-400/15 mix-blend-soft-light"></div>
                    <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle,_rgba(0,0,0,0.45)_1px,_transparent_1.3px)] [background-size:7px_7px]"></div>
                  </>
                )}

                {/* Giant ghost first-name behind the figure (cutout members only) */}
                {currentMember.image && !noCutout.has(currentMember.name) && (
                  <span
                    aria-hidden
                    className="absolute z-[6] inset-x-0 top-4 lg:top-5 text-center font-black uppercase tracking-tighter leading-none whitespace-nowrap select-none pointer-events-none text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.45)] lg:[-webkit-text-stroke:2px_rgba(255,255,255,0.45)] text-[3.25rem] sm:text-[4.5rem] lg:text-[6rem]"
                  >
                    {currentMember.name.split(' ')[0]}
                  </span>
                )}

                {/* Sharp cutout, aligned to the same crop so the figure leaps off the blur */}
                {currentMember.image ? (
                  !noCutout.has(currentMember.name) && (
                    <img
                      src={cutoutSrc(currentMember.image)}
                      alt={currentMember.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      className="absolute inset-0 w-full h-full object-cover object-center z-10 scale-[1.045] -translate-y-2 lg:-translate-y-3 drop-shadow-[0_14px_22px_rgba(0,0,0,0.42)] animate-fade-in"
                    />
                  )
                ) : (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-white/15 ring-4 ring-white/40 flex items-center justify-center text-4xl font-black text-white">
                      {initials(currentMember.name)}
                    </div>
                  </div>
                )}

                {/* Stickers */}
                <span className="absolute top-3 left-3 lg:top-4 lg:left-4 z-30 -rotate-3 bg-primary-600 text-white text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.15em] px-2 lg:px-2.5 py-1 rounded shadow-md">
                  The Reuby · {currentMemberIndex + 1}/{members.length}
                </span>
                <span className="absolute top-3 right-12 lg:top-4 lg:right-14 z-30 rotate-3 bg-amber-400 text-slate-900 text-[8px] lg:text-[9px] font-extrabold uppercase tracking-[0.15em] leading-tight px-1.5 lg:px-2 py-1 rounded shadow-md text-right">
                  Meet<br />the team
                </span>

                {/* Name plate */}
                <div className="absolute z-30 inset-x-0 bottom-4 lg:bottom-6 flex flex-col items-center px-4">
                  <div className="bg-white rounded-xl lg:rounded-2xl px-4 lg:px-5 py-1.5 lg:py-2 shadow-2xl -rotate-1 max-w-full">
                    <p className="text-base sm:text-lg lg:text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight text-center">
                      {currentMember.name}
                    </p>
                  </div>
                  {currentMember.role && (
                    <span className="mt-1.5 lg:mt-2 rotate-1 bg-amber-400 text-slate-900 text-[10px] lg:text-xs font-bold uppercase tracking-wide px-2.5 lg:px-3 py-0.5 lg:py-1 rounded shadow-md max-w-[92%] truncate">
                      {currentMember.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Story — a bottom-sheet on mobile, the right column on desktop */}
              <div className="relative z-20 flex-1 lg:flex-none lg:w-[58%] flex flex-col min-h-0 rounded-t-3xl lg:rounded-none bg-white/95 dark:bg-slate-900/90 lg:bg-gradient-to-br lg:from-white/30 lg:to-white/5 lg:dark:from-slate-800/40 lg:dark:to-slate-900/20 backdrop-blur-lg shadow-[0_-8px_24px_rgba(0,0,0,0.15)] lg:shadow-none">
                {/* Grab handle (mobile sheet affordance) */}
                <div className="lg:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"></div>
                <div key={currentMemberIndex} className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide p-5 pt-4 sm:p-6 lg:p-9 flex flex-col ${enterAnimation}`}>
                  {/* Eyebrow + index */}
                  <div className="flex items-center justify-between mb-4 pr-10 lg:pr-12">
                    <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-primary-600 dark:text-primary-400">
                      Meet the Team
                    </p>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                      {String(currentMemberIndex + 1).padStart(2, '0')}<span className="text-slate-300 dark:text-slate-600"> / {String(members.length).padStart(2, '0')}</span>
                    </p>
                  </div>

                  {/* Name + accent */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight">
                    {currentMember.name}
                  </h1>
                  <div className="mt-3 h-1.5 w-12 bg-primary-500 rounded-full"></div>

                  {/* Meta rows */}
                  <div className="mt-4 space-y-2">
                    {currentMember.role && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <svg className="w-4 h-4 text-primary-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.96 0 1.36 1.24.58 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.75 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.79.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.4 9.61c-.78-.57-.38-1.81.58-1.81h4.4a1 1 0 00.95-.69L9.05 2.93z" />
                        </svg>
                        <span className="font-semibold text-primary-700 dark:text-primary-300">{currentMember.role}</span>
                      </div>
                    )}
                    {currentMember.programme && (
                      <div className="flex items-start gap-2.5 text-sm">
                        <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2L1 6l9 4 7.5-3.33V12a1 1 0 102 0V6L10 2z" />
                          <path d="M4 10.4V13c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-2.6l-6 2.67-6-2.67z" />
                        </svg>
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{currentMember.programme}</span>
                      </div>
                    )}
                  </div>

                  {/* Bio — flows naturally; the column scrolls invisibly only if a bio is unusually long */}
                  <div className="relative mt-5 bg-white/70 dark:bg-slate-900/60 rounded-2xl p-5 lg:p-6 pt-7 shadow-inner border border-slate-200/50 dark:border-slate-700/40">
                    <span className="absolute top-1 left-4 text-6xl leading-none text-primary-300/60 dark:text-primary-700/50 font-serif select-none">“</span>
                    <p className="relative text-slate-700 dark:text-slate-300 leading-relaxed text-base lg:text-lg">
                      {currentMember.bio}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar dock — every member at a glance; click any face to focus them */}
            <div className="shrink-0 border-t border-white/25 dark:border-slate-700/40 bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl px-3 sm:px-6 pt-5 pb-5 lg:pt-7 lg:pb-6">
              <div className="flex items-center justify-center gap-2 lg:gap-4">
                {/* Prev */}
                <button
                  onClick={prevMember}
                  disabled={currentMemberIndex === 0}
                  aria-label="Previous member"
                  className="hidden sm:flex shrink-0 w-10 h-10 lg:w-11 lg:h-11 rounded-full items-center justify-center bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg hover:bg-white dark:hover:bg-slate-800 hover:-translate-x-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Faces — horizontal strip on mobile (active auto-centred), wrapping huddle on desktop */}
                <div className="flex items-center flex-nowrap lg:flex-wrap justify-start lg:justify-center overflow-x-auto lg:overflow-visible scrollbar-hide gap-x-3 gap-y-5 px-2 py-1 w-full lg:w-auto lg:max-w-2xl">
                  {members.map((person, index) => {
                    const active = index === currentMemberIndex;
                    return (
                      <button
                        key={index}
                        ref={active ? activeFaceRef : undefined}
                        onClick={() => goToMember(index)}
                        aria-current={active}
                        aria-label={person.name}
                        title={person.name}
                        className="group relative shrink-0 focus:outline-none"
                      >
                        <span
                          className={`block rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center transition-all duration-300 ease-out ${
                            active
                              ? 'w-12 h-12 lg:w-16 lg:h-16 ring-[3px] lg:ring-4 ring-primary-500 ring-offset-2 ring-offset-white/40 dark:ring-offset-slate-900/40 shadow-xl -translate-y-1 scale-105'
                              : 'w-10 h-10 lg:w-12 lg:h-12 ring-2 ring-white/50 dark:ring-slate-700/60 opacity-65 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-primary-300'
                          }`}
                        >
                          {person.image ? (
                            <img src={person.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full text-sm">{initials(person.name)}</span>
                          )}
                        </span>
                        {/* Name label: always shown for active, on hover for the rest */}
                        <span
                          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-5 whitespace-nowrap text-[11px] font-semibold transition-all duration-200 ${
                            active
                              ? 'text-primary-700 dark:text-primary-300 opacity-100'
                              : 'text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {person.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Next */}
                <button
                  onClick={nextMember}
                  disabled={currentMemberIndex === members.length - 1}
                  aria-label="Next member"
                  className="hidden sm:flex shrink-0 w-10 h-10 lg:w-11 lg:h-11 rounded-full items-center justify-center bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg hover:bg-white dark:hover:bg-slate-800 hover:translate-x-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}; 
import { useState } from 'react';
import contributorsData from '../data/contributors.json';

interface Contributor {
  name: string;
  role?: string;
  department?: string;
  image: string | null;
  bio?: string;
}

export const Contributors = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);

  const openModal = () => {
    setIsModalOpen(true);
    setCurrentMemberIndex(0);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextMember = () => {
    if (currentMemberIndex < contributorsData.editorial.length - 1) {
      setCurrentMemberIndex(currentMemberIndex + 1);
    }
  };

  const prevMember = () => {
    if (currentMemberIndex > 0) {
      setCurrentMemberIndex(currentMemberIndex - 1);
    }
  };

  const currentMember = contributorsData.editorial[currentMemberIndex];

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

        {/* Editorial Team */}
        <section className="mb-20">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-primary-700 dark:text-primary-300 mb-4">Editorial Team</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            The Reuby is brought to life by a dedicated team of students from Reuben College who volunteer their time and talents to create each issue.
            </p>
            <button
              onClick={openModal}
              className="hidden sm:inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:from-primary-700 hover:to-primary-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Introducing the Team
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {contributorsData.editorial.map((person: Contributor, index: number) => (
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
                      <p className="text-primary-500 dark:text-primary-400 font-medium mb-3">{person.role}</p>
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

        {/* Past Team Members */}
        <section className="mb-20">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-primary-700 dark:text-primary-300 mb-4">Past Editorial Team</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We would like to thank all those who have contributed to building The Reuby in previous years.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contributorsData.past.map((person: Contributor, index: number) => (
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
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-2">{person.role}</p>
                      {person.bio && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{person.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-md transition-all duration-300"
            onClick={closeModal}
          ></div>

          {/* Modal panel */}
          <div className="relative w-full max-w-7xl h-[600px] bg-white/20 dark:bg-slate-900/30 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden border border-white/30 dark:border-slate-700/50">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 z-20 p-2.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/30 dark:border-slate-700/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main content */}
            <div className="flex flex-col lg:flex-row h-full">
              {/* Photo section - Full height, immersive */}
              <div className="lg:w-2/5 h-48 lg:h-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                {currentMember.image ? (
                  <div className="relative w-full h-full group">
                    <img 
                      src={currentMember.image} 
                      alt={currentMember.name} 
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Subtle overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/15"></div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-400 dark:bg-slate-600 flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Team Member</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content section */}
              <div className="lg:w-3/5 flex flex-col h-full bg-white/10 dark:bg-slate-800/20 backdrop-blur-lg">
                <div className="flex-1 p-6 lg:p-10 flex flex-col justify-center">
                  {/* Name */}
                  <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3 leading-tight tracking-tight">
                    {currentMember.name}
                  </h1>
                  
                  {/* Role tag */}
                  <div className="inline-flex items-center px-5 py-2.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold mb-7 w-fit shadow-sm border border-primary-200/60 dark:border-primary-700/40">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-2.5"></div>
                    {currentMember.role}
                  </div>

                  {/* Bio */}
                  <div className="flex-1 overflow-y-auto max-h-80 bg-white/60 dark:bg-slate-900/60 rounded-xl p-5 shadow-inner border border-slate-200/40 dark:border-slate-700/40">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base lg:text-lg">
                      {currentMember.bio}
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between border-t border-white/20 dark:border-slate-700/30 bg-white/10 dark:bg-slate-900/20 backdrop-blur-lg px-6 lg:px-10 py-5">
                  <button
                    onClick={prevMember}
                    disabled={currentMemberIndex === 0}
                    className={`flex items-center px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                      currentMemberIndex === 0 
                        ? 'text-slate-400 cursor-not-allowed opacity-50' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md hover:-translate-x-0.5'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  {/* Progress indicator */}
                  <div className="flex items-center space-x-5">
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-semibold px-3 py-1.5 bg-white/60 dark:bg-slate-800/60 rounded-lg shadow-sm">
                      {currentMemberIndex + 1} of {contributorsData.editorial.length}
                    </span>
                    <div className="flex items-center space-x-2.5">
                      {contributorsData.editorial.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentMemberIndex(index)}
                          className={`h-2.5 rounded-full transition-all duration-300 hover:scale-125 ${
                            index === currentMemberIndex 
                              ? 'bg-primary-600 dark:bg-primary-400 w-7 shadow-md' 
                              : 'bg-slate-300 dark:bg-slate-600 hover:bg-primary-400 dark:hover:bg-primary-500 w-2.5'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={nextMember}
                    disabled={currentMemberIndex === contributorsData.editorial.length - 1}
                    className={`flex items-center px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                      currentMemberIndex === contributorsData.editorial.length - 1 
                        ? 'text-slate-400 cursor-not-allowed opacity-50' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md hover:translate-x-0.5'
                    }`}
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}; 
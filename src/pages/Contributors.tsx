import contributorsData from '../data/contributors.json';

interface Contributor {
  name: string;
  role?: string;
  department?: string;
  image: string | null;
}

export const Contributors = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-16 text-center">
          <div className="inline-block mb-6 p-2 rounded-full bg-primary-100 dark:bg-primary-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold text-primary-700 dark:text-primary-300 mb-4">Contributors</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Meet the talented team behind The Reuby
          </p>
          <div className="mt-8 h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
        </header>

        <div className="prose dark:prose-invert lg:prose-lg prose-slate mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">Editorial Team</h2>
              <p className="mb-6">
                The Reuby is brought to life by a dedicated team of students from Reuben College who volunteer their time and talents to create each issue.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {contributorsData.editorial.map((person: Contributor, index: number) => (
                  <div className="text-center" key={index}>
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      {person.image ? (
                        <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-primary-700 dark:text-primary-300">{person.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{person.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">Content Contributors</h2>
              <p className="mb-4">
                We're grateful to the following individuals who have submitted and published their work in The Reuby:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 mt-6">
                {(contributorsData.contributors as string[]).map((name: string, index: number) => (
                  <div key={index} className="text-slate-700 dark:text-slate-300 text-sm">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">Faculty Advisors</h2>
              <p className="mb-4">
                Our publication is supported by the following faculty members who provide guidance and mentorship:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {contributorsData.advisors.map((person: Contributor, index: number) => (
                  <div className="flex items-center space-x-4" key={index}>
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      {person.image ? (
                        <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600 dark:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-700 dark:text-primary-300">{person.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{person.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">Past Editorial Team Members</h2>
              <p className="mb-4">
                We would like to thank all those who have contributed to building The Reuby in previous years:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 mt-6">
                {contributorsData.past.map((person: Contributor, index: number) => (
                  <div className="flex items-center space-x-3" key={index}>
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-50 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                      {person.image ? (
                        <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-primary-700 dark:text-primary-300">{person.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{person.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">Join Our Team</h2>
              <p className="mb-6">
                The Reuby welcomes new contributors from the Reuben College community. We're always looking for writers, editors, photographers, illustrators, and designers to join our team.
              </p>
              <div className="mt-6">
                <a href="mailto:thereuby@reuben.ox.ac.uk" className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-200">
                  Get Involved
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
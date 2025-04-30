import { Link } from 'react-router-dom';

export const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-16 text-center">
          <div className="flex justify-center mb-8">
            <Link to="/">
              <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
                <img 
                  src="/images/reuby_logo.jpg" 
                  alt="Reuby Logo" 
                  className="h-32 object-contain rounded-md" 
                />
              </div>
            </Link>
          </div>
            <div className="flex flex-col items-center mb-6">
            
            <h1 className="text-5xl font-extrabold text-primary-700 dark:text-primary-300">
              Reuby Magazine
            </h1>
            </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Student-led magazine at Reuben College
          </p>
          <div className="mt-8 h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
        </header>

        <div className="prose dark:prose-invert lg:prose-lg prose-slate mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
            <img 
              src="/images/about-cover.png" 
              alt="Magazine team" 
              className="w-full h-120 object-cover object-center"
            />
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">Our Story</h2>
              <p className="mb-4">
                The Reuby is Reuben College's student-led magazine, which serves as a creative outlet for our members and fellows run by students - a channel through which to give a voice to all Reubenites, and a platform through which they can reach out to the world, inspire and make an impact. The Reuby offers, through science and art, an interdisciplinary and innovative treatment of 21st century challenges that includes news and actuality, feature articles, critical reviews, poetry and prose, and visual art.
              </p>
              <p className="mb-4">
                You can read the 1st and 2nd editions of The Reuby, as well as The Reubyte - a mini edition of the magazine from Trinity Term 2024.
              </p>
              <p>
                Please note that this is a student publication and does not reflect the views of the College.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden h-full">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">Our Mission</h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Great Mission one</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Great Mission two</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Great Mission three</span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Great Mission four</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden h-full">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">Publication Schedule</h2>
                <p className="mb-4">
                  We publish once a year, in the summer term. Coming issues will be announced here.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-0.5">M</div>
                    <span><strong>Last Issue</strong> - The Reubyte - Trinity Term 2024</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-0.5">H</div>
                    <span><strong>Next Issue</strong> - Instinction - Trinity Term 2025 </span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-0.5">T</div>
                    <span><strong>Future Issue</strong> - TBC </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">Get Involved</h2>
              <p className="mb-4">
                We welcome contributions from all members of the Reuben College community. Whether you're a writer, artist, photographer, or have ideas to share, there are many ways to get involved:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Submit articles, essays, poetry, or artwork for publication</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Join our editorial team as a writer, editor, or designer</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Provide feedback on published issues</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Suggest themes for upcoming issues</span>
                </li>
              </ul>
              <div className="mt-6">
                <a href="mailto:thereuby@reuben.ox.ac.uk" className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-200">
                  Contact Our Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
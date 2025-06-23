import { Link } from 'react-router-dom';
import { getAssetPath } from '../utils/pathUtils';
import { SyncedLyricsPlayer } from '../components/SyncedLyricsPlayer';

export const Voices = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-16 text-center">
          <div className="flex justify-center mb-8">
            <Link to="/">
              <div className="p-3 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
                <img 
                  src={getAssetPath("/images/reuby_logo.jpg")}
                  alt="Reuby Logo" 
                  className="h-32 object-contain rounded-md" 
                />
              </div>
            </Link>
          </div>
          <div className="flex flex-col items-center mb-6">
            <h1 className="text-5xl font-extrabold text-primary-700 dark:text-primary-300">
              Voices of the Reuby
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Listen to the sounds and stories from our magazine community
          </p>
          <div className="mt-8 h-1 w-24 bg-primary-500 mx-auto rounded-full"></div>
        </header>

        <div className="prose dark:prose-invert lg:prose-lg prose-slate mx-auto">
          {/* Voices of the Reuby Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-300">Voices of the Reuby</h2>
              <div className="mb-6">
                <SyncedLyricsPlayer />
              </div>

              
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">About This Song</h3>
                <div className="space-y-4">
                  <p className="mb-4">
                    This song was created using Generative AI. The lyrics and prompts for SUNO were generated with ChatGPT and the melody was produced by SUNO. The AI models were instructed to blend classical choral traditions with modern harmonic progressions. This song was cherry-picked with care from about 25 different generated outputs. It has been chosen for its musical quality, feeling, and originality. The song serves as an experiment to demonstrate the creativity of AI, and we leave it to you to decide if there is indeed any.
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                    — Puyu Wang
                  </p>                  
                </div>
              </div>
            </div>
          </div>

          {/* Ellen's Song Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-primary-700 dark:text-primary-300">Ellen's Song</h2>
              <div className="mb-6">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <iframe 
                    width="100%" 
                    height="166" 
                    scrolling="no" 
                    frameBorder="no" 
                    allow="autoplay" 
                    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1285150105&color=%23771825&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
                    title="Ellen's Song - SoundCloud Player"
                    className="rounded-md"
                  />
                  <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                    <a 
                      href="https://soundcloud.com/user-669742496" 
                      title="The Reuby Magazine" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      The Reuby Magazine
                    </a>
                    {' · '}
                    <a 
                      href="https://soundcloud.com/user-669742496/ellens-song" 
                      title="Ellen's Song" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Ellen's Song
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">About This Song</h3>
                <p className="mb-4">
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-10">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-primary-700 dark:text-primary-300">More Voices</h2>  
              <p className="mb-4">
                As we expand our multimedia offerings, you'll find more audio content, interviews, and spoken word pieces from our community here.
              </p>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M6.343 6.343a9 9 0 000 12.728m2.829-2.829a5 5 0 000-7.07M9 12h6" />
                </svg>
                <p className="text-slate-600 dark:text-slate-400 font-medium">More audio content coming soon</p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                  Stay tuned for interviews, readings, and more voices from our community
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
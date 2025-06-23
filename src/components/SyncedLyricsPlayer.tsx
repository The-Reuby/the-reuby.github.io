import { useState, useEffect, useRef, useCallback } from 'react';
import { getAssetPath } from '../utils/pathUtils';

interface LyricLine {
  time: number; // time in seconds
  text: string;
  section?: string; // verse, chorus, bridge, outro
}

export const SyncedLyricsPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [volume, setVolume] = useState(0.7);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(true);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Load lyrics from external file
  useEffect(() => {
    const loadLyrics = async () => {
      try {
        setLyricsLoading(true);
        const response = await fetch(getAssetPath('/audio/voices-lyrics.json'));
        if (!response.ok) {
          throw new Error('Failed to load lyrics');
        }
        const lyricsData = await response.json();
        setLyrics(lyricsData);
        setLyricsError(null);
      } catch (error) {
        console.error('Error loading lyrics:', error);
        setLyricsError('Failed to load lyrics');
      } finally {
        setLyricsLoading(false);
      }
    };

    loadLyrics();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId: number;
    
    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      // Use requestAnimationFrame for more frequent updates when playing
      if (!audio.paused) {
        animationFrameId = requestAnimationFrame(updateTime);
      }
    };
    
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (isLooping) {
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
      }
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      updateTime(); // Start the animation frame loop
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    // Use both timeupdate (for fallback) and requestAnimationFrame (for smooth updates)
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      audio.removeEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [isLooping]);

  useEffect(() => {
    // Optimized lyric finding for better sync
    let currentIndex = -1;
    
    // More efficient search - find the last lyric whose time has passed
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        currentIndex = i;
        break;
      }
    }
    
    // Only update if the index actually changed to avoid unnecessary re-renders
    if (currentIndex !== currentLyricIndex) {
      setCurrentLyricIndex(currentIndex);
    }
  }, [currentTime, lyrics, currentLyricIndex]);

  // Auto-scroll to current lyric - always keep current lyric perfectly centered
  useEffect(() => {
    if (currentLyricIndex >= 0 && lyricRefs.current[currentLyricIndex] && lyricsContainerRef.current) {
      const currentLyricElement = lyricRefs.current[currentLyricIndex];
      const container = lyricsContainerRef.current;
      
      if (currentLyricElement) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          // Get the precise positions relative to the container
          const containerRect = container.getBoundingClientRect();
          const elementRect = currentLyricElement.getBoundingClientRect();
          
          // Calculate the current scroll position
          const currentScrollTop = container.scrollTop;
          
          // Calculate where the element currently is relative to container
          const elementRelativeTop = elementRect.top - containerRect.top + currentScrollTop;
          
          // Calculate the center position
          const containerCenter = container.clientHeight / 2;
          const elementCenter = currentLyricElement.offsetHeight / 2;
          
          // Calculate the scroll position needed to center the element
          const targetScrollTop = elementRelativeTop - containerCenter + elementCenter;
          
          // Smoothly scroll to center the current lyric
          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: 'smooth'
          });
        });
      }
    }
  }, [currentLyricIndex]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  // Improved progress bar handling
  const calculateProgress = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (!progressBar) return 0;
    
    const rect = progressBar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    return x / rect.width;
  }, []);

  const seek = useCallback((percentage: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    
    const newTime = percentage * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const percentage = calculateProgress(e);
    seek(percentage);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current) return;
      
      const rect = progressRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = x / rect.width;
      seek(percentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, seek]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSectionLabel = (section?: string) => {
    switch (section) {
      case 'verse1': return 'Verse 1';
      case 'verse2': return 'Verse 2';
      case 'chorus1':
      case 'chorus2':
      case 'chorus3': return 'Chorus';
      case 'bridge': return 'Bridge';
      case 'outro': return 'Outro';
      default: return '';
    }
  };

  const jumpToLyric = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass rounded-2xl overflow-hidden max-w-2xl mx-auto">
      <audio
        ref={audioRef}
        src={getAssetPath("/audio/Voices_of_the_Reuby.mp3")}
        preload="metadata"
        loop={isLooping}
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg">Voices of the Reuby</h3>
            <p className="text-white/80 text-sm">Reuby Magazine</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6">
        {/* Main Controls */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          {/* Loop Button */}
          <button
            onClick={toggleLoop}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isLooping 
                ? 'bg-primary-500 text-white hover:bg-primary-600' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
            title={isLooping ? 'Disable loop' : 'Enable loop'}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
            </svg>
          </button>

          <button
            onClick={togglePlayPause}
            className="w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center group"
          >
            {isPlaying ? (
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-0.5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          {/* Volume Control */}
          <div className="relative">
            <button
              onClick={() => setIsVolumeVisible(!isVolumeVisible)}
              className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            
            {isVolumeVisible && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl p-3 animate-fade-in">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(164, 41, 46) 0%, rgb(164, 41, 46) ${volume * 100}%, rgb(226, 232, 240) ${volume * 100}%, rgb(226, 232, 240) 100%)`
                  }}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div 
            ref={progressRef}
            className={`relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2 cursor-pointer group ${isDragging ? 'scale-y-125' : ''} transition-transform duration-200`}
            onMouseDown={handleProgressMouseDown}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-none pointer-events-none"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Lyrics Display */}
      <div className="border-t border-slate-200 dark:border-slate-700">
        <div ref={lyricsContainerRef} className="max-h-80 overflow-y-auto px-6 py-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {lyricsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading lyrics...</span>
              </div>
            </div>
          ) : lyricsError ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-red-500 text-center">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{lyricsError}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {lyrics.map((lyric, index) => {
                const isActive = index === currentLyricIndex;
                const sectionLabel = getSectionLabel(lyric.section);
                
                return (
                  <div key={index} className="group">
                    <div
                      ref={(el) => { lyricRefs.current[index] = el; }}
                      onClick={() => jumpToLyric(lyric.time)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-500 flex items-center text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        isActive ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/50 dark:to-primary-800/50 shadow-md scale-105 transform' : ''
                      }`}
                    >
                      <div className="w-20 flex-shrink-0 mr-3">
                        {sectionLabel && isActive && (
                          <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider animate-fade-in">
                            [{sectionLabel}]
                          </span>
                        )}
                      </div>
                      {lyric.text && (
                        <div className={`leading-relaxed flex-1 ${isActive ? 'text-lg' : 'text-base'} transition-all duration-300`}>
                          {lyric.text}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
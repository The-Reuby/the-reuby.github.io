import { useState, useEffect } from 'react';

/**
 * Hook for managing dark mode functionality
 * @returns {Object} Object containing isDark state and toggle function
 */
export const useDarkMode = () => {
  // Initialize with stored preference, defaulting to light if no preference
  const getInitialDarkMode = () => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      return savedDarkMode === 'true';
    }
    // Default to light mode if no saved preference
    return false;
  };

  const [isDark, setIsDark] = useState(getInitialDarkMode);
  
  useEffect(() => {
    // Apply dark mode class when component mounts or isDark changes
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  
  const toggleDarkMode = () => {
    setIsDark(prevDark => {
      const newDarkMode = !prevDark;
      localStorage.setItem('darkMode', newDarkMode.toString());
      
      return newDarkMode;
    });
  };
  
  return { isDark, toggleDarkMode };
}; 
import { useEffect } from 'react';
import { updateOpenGraphTags, clearOpenGraphTags } from '../utils/metaTags';

interface UseMetaTagsOptions {
  title: string;
  type: string;
  url: string;
  image?: string;
  description?: string;
}

export const useMetaTags = (options: UseMetaTagsOptions | null) => {
  useEffect(() => {
    if (options) {
      updateOpenGraphTags(options);
    }

    // Cleanup function to remove meta tags when component unmounts
    return () => {
      clearOpenGraphTags();
    };
  }, [options]);
}; 
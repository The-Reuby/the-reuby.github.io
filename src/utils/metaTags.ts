interface MetaTagOptions {
  title: string;
  type: string;
  url: string;
  image?: string;
  description?: string;
}

export const updateOpenGraphTags = (options: MetaTagOptions) => {
  // Helper function to set or update a meta tag
  const setMetaTag = (property: string, content: string) => {
    let metaTag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('property', property);
      document.head.appendChild(metaTag);
    }
    
    metaTag.setAttribute('content', content);
  };

  // Update the page title
  document.title = options.title;

  // Set Open Graph meta tags
  setMetaTag('og:title', options.title);
  setMetaTag('og:type', options.type);
  setMetaTag('og:url', options.url);
  
  if (options.image) {
    setMetaTag('og:image', options.image);
  }
  
  if (options.description) {
    setMetaTag('og:description', options.description);
  }
};

export const clearOpenGraphTags = () => {
  // Remove Open Graph meta tags when navigating away
  const ogTags = document.querySelectorAll('meta[property^="og:"]');
  ogTags.forEach(tag => tag.remove());
}; 
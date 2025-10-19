import { useEffect } from 'react';

interface Metadata {
  title: string;
  description: string;
  path: string;
  imageUrl?: string;
}

const SITE_NAME = "CineStream";
const BASE_URL = window.location.origin + window.location.pathname.replace('index.html', '');

export const usePageMetadata = (metadata: Metadata) => {
  useEffect(() => {
    // Update Title
    document.title = `${metadata.title} | ${SITE_NAME}`;

    // Helper to set meta tag content
    const setMetaTag = (selector: string, content: string) => {
      const element = document.querySelector(selector) as HTMLMetaElement | null;
      if (element) {
        element.content = content;
      }
    };
    
    const setLinkTag = (selector: string, href: string) => {
        const element = document.querySelector(selector) as HTMLLinkElement | null;
        if (element) {
            element.href = href;
        }
    }
    
    // Ensure the base URL ends with a slash if it's not just the origin
    const cleanBaseUrl = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    const canonicalUrl = `${cleanBaseUrl}#${metadata.path}`;

    // Update Standard Meta/Link Tags
    setMetaTag('meta[name="description"]', metadata.description);
    setLinkTag('link[rel="canonical"]', canonicalUrl);
    
    // Open Graph Tags
    setMetaTag('meta[property="og:title"]', metadata.title);
    setMetaTag('meta[property="og:description"]', metadata.description);
    setMetaTag('meta[property="og:url"]', canonicalUrl);

    // Twitter Tags
    setMetaTag('meta[name="twitter:title"]', metadata.title);
    setMetaTag('meta[name="twitter:description"]', metadata.description);

    // Update image tags, falling back to the default image specified in index.html
    const defaultImageUrl = `${cleanBaseUrl}og-default-image.png`;
    const imageUrlToSet = metadata.imageUrl || defaultImageUrl;
    
    setMetaTag('meta[property="og:image"]', imageUrlToSet);
    setMetaTag('meta[name="twitter:image"]', imageUrlToSet);

  }, [metadata]);
};

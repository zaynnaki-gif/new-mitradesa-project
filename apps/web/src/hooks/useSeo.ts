import { useEffect } from 'react';
import { APP_NAME, API_BASE_URL } from '@/lib/constants';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

/**
 * SEO Hook
 * Sets document metadata for search engines and social sharing
 */
export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  noIndex = false,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
    const defaultDescription = 'Sistem Manajemen Informasi dan Administrasi Desa';
    const pageDescription = description || defaultDescription;
    const pageCanonical = canonical || window.location.href;
    const defaultOgImage = `${API_BASE_URL}/og-image.png`;
    const pageOgImage = ogImage || defaultOgImage;

    // Set title
    document.title = fullTitle;

    // Set or update meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Basic meta tags
    updateMeta('description', pageDescription);
    updateMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph tags
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', pageDescription, true);
    updateMeta('og:type', 'website', true);
    updateMeta('og:url', pageCanonical, true);
    updateMeta('og:image', pageOgImage, true);
    updateMeta('og:site_name', APP_NAME, true);

    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', pageDescription);
    updateMeta('twitter:image', pageOgImage);

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = pageCanonical;

    // Cleanup function
    return () => {
      // Don't remove on unmount - SEO meta should persist
    };
  }, [title, description, canonical, ogImage, noIndex]);
}

/**
 * Generate page title
 */
export function getPageTitle(pageName: string, villageName?: string): string {
  if (villageName) {
    return `${pageName} ${villageName}`;
  }
  return `${pageName} | ${APP_NAME}`;
}

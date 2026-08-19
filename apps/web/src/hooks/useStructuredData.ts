import { useEffect } from 'react';
import { APP_NAME } from '@/lib/constants';

/**
 * Hook to add JSON-LD structured data to the page
 */
export function useStructuredData(data: Record<string, unknown>) {
  useEffect(() => {
    if (Object.keys(data).length === 0) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    script.id = 'structured-data';

    // Remove existing structured data
    const existing = document.getElementById('structured-data');
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(script);

    return () => {
      const current = document.getElementById('structured-data');
      if (current) {
        current.remove();
      }
    };
  }, [data]);
}

/**
 * Generate Organization structured data
 */
export function getOrganizationSchema(name: string, url: string, logo?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    ...(logo && { logo: { '@type': 'ImageObject', url: logo } }),
  };
}

/**
 * Generate Village Government Organization schema
 */
export function getGovernmentOrganizationSchema(
  name: string,
  address: string,
  telephone?: string,
  email?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOrganization',
    name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressCountry: 'ID',
    },
    ...(telephone && { telephone }),
    ...(email && { email }),
  };
}

/**
 * Generate NewsArticle schema for berita
 */
export function getNewsArticleSchema(
  title: string,
  description: string,
  publishedAt: string,
  author: string,
  image?: string,
  url?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    datePublished: publishedAt,
    author: {
      '@type': 'Person',
      name: author,
    },
    ...(image && { image: { '@type': 'ImageObject', url: image } }),
    ...(url && { url }),
    publisher: {
      '@type': 'Organization',
      name: APP_NAME,
    },
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'], // Hide Admin and API from Google
    },
    sitemap: 'https://brijeshtiwari.in/sitemap.xml',
  };
}
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.vijitaxi.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/book', '/faq', '/cancellation', '/privacy'],
      disallow: [
        '/admin/',
        '/driver/',
        '/api/',
        '/profile',
        '/rides',
        '/book/confirm',
        '/book/success',
        '/login',
        '/signup',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

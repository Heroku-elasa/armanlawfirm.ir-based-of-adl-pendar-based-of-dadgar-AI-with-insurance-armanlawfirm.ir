
export const onRequestGet = async () => {
  const baseUrl = "https://armanlawfirm.ir";
  const date = new Date().toISOString().split('T')[0];

  // Define all public routes in the application
  const pages = [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/services', changefreq: 'weekly', priority: 0.9 },
    { path: '/pricing', changefreq: 'weekly', priority: 0.9 },
    { path: '/blog', changefreq: 'daily', priority: 0.8 },
    
    // Core Tools
    { path: '/legal-drafter', changefreq: 'weekly', priority: 0.9 },
    { path: '/lawyer-finder', changefreq: 'weekly', priority: 0.9 },
    { path: '/notary-finder', changefreq: 'weekly', priority: 0.8 },
    { path: '/court-assistant', changefreq: 'weekly', priority: 0.9 },
    { path: '/case-strategist', changefreq: 'weekly', priority: 0.8 },
    
    // Analyzers
    { path: '/contract-analyzer', changefreq: 'weekly', priority: 0.8 },
    { path: '/evidence-analyzer', changefreq: 'weekly', priority: 0.8 },
    { path: '/web-analyzer', changefreq: 'weekly', priority: 0.7 },
    { path: '/resume-analyzer', changefreq: 'weekly', priority: 0.8 },
    { path: '/site-architect', changefreq: 'weekly', priority: 0.7 },
    
    // Services
    { path: '/corporate-services', changefreq: 'weekly', priority: 0.8 },
    { path: '/insurance-services', changefreq: 'weekly', priority: 0.8 },
    { path: '/job-assistant', changefreq: 'daily', priority: 0.8 },
    
    // Content & Info
    { path: '/news-summarizer', changefreq: 'daily', priority: 0.7 },
    { path: '/content-hub', changefreq: 'daily', priority: 0.7 },
    { path: '/general-questions', changefreq: 'weekly', priority: 0.6 },
    { path: '/image-generator', changefreq: 'weekly', priority: 0.6 },
    { path: '/faryadresi', changefreq: 'monthly', priority: 0.5 },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.path === '/' ? '' : page.path}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

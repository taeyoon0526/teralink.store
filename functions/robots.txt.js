// Cloudflare Pages Functions - robots.txt handler
// Override default Cloudflare robots.txt

export async function onRequest(context) {
  const robotsTxt = `# robots.txt - Prevent indexing of source files
User-agent: *
Disallow: /*.js$
Disallow: /*.css$
Disallow: /lite/*.js
Disallow: /lite/*.css
Disallow: /api/
Disallow: /_middleware.js
Disallow: /worker.js
Disallow: /application.js
Disallow: /vpn.js

# Block common crawlers and bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: archive.org_bot
Disallow: /

User-agent: ia_archiver
Disallow: /

# Allow only main pages
Allow: /
Allow: /lite/
Allow: /hacking/
Allow: /application/
Allow: /vpn/

# Sitemap (optional)
Sitemap: https://teralink.store/sitemap.xml
`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    }
  });
}

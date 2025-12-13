// Cloudflare Pages Functions - Source Code Protection
// This function blocks direct access to source files

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  const referer = request.headers.get('Referer') || '';
  
  // Block view-source: access
  if (url.protocol === 'view-source:') {
    return new Response('Access Denied', { status: 403 });
  }
  
  // Block direct .js file access (except from the site itself)
  if (url.pathname.endsWith('.js')) {
    // Allow if referer is from our domain
    if (!referer || !referer.includes('teralink.store')) {
      // Block direct access
      return new Response('403 Forbidden - Direct script access is not allowed', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Robots-Tag': 'noindex, nofollow',
        }
      });
    }
  }
  
  // Block requests with suspicious user agents (but allow legitimate bots)
  const suspiciousPatterns = [
    'curl',
    'wget',
    'python-requests',
    'scrapy',
    'headless',
    'phantom',
    'selenium',
  ];
  
  const lowerUA = userAgent.toLowerCase();
  
  // Allow legitimate search engine bots
  const legitBots = ['googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot'];
  const isLegitBot = legitBots.some(bot => lowerUA.includes(bot));
  
  if (!isLegitBot) {
    const isSuspicious = suspiciousPatterns.some(pattern => 
      lowerUA.includes(pattern.toLowerCase())
    );
    
    if (isSuspicious && !url.pathname.startsWith('/api/')) {
      return new Response('403 Forbidden - Automated access is not allowed', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }
  }
  
  // Continue to the asset or page
  return context.next();
}

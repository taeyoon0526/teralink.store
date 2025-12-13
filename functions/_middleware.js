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
  
  // Block requests with suspicious user agents
  const suspiciousPatterns = [
    'curl',
    'wget',
    'python',
    'scrapy',
    'bot',
    'spider',
    'crawler',
  ];
  
  const lowerUA = userAgent.toLowerCase();
  const isSuspicious = suspiciousPatterns.some(pattern => 
    lowerUA.includes(pattern.toLowerCase())
  );
  
  if (isSuspicious && !url.pathname.startsWith('/api/')) {
    return new Response('403 Forbidden - Bot access is not allowed', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  }
  
  // Continue to the asset or page
  return context.next();
}

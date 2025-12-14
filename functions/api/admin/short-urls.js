// ============================================
// 단축 URL 관리 API
// ============================================

async function verifyToken(token) {
  if (!token) return null;
  const JWT_SECRET = env.JWT_SECRET;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [encodedHeader, encodedPayload, signature] = parts;
  const buffer = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  if (signature !== expectedSignature) return null;
  
  try {
    const payload = JSON.parse(atob(encodedPayload));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

async function requireAuth(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return await verifyToken(token);
}

export async function onRequestGet({ request, env }) {
  const user = await requireAuth(request);
  if (!user) {
    return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'all';
    
    const db = env.LOG_DB;
    if (!db) {
      throw new Error('Database not available');
    }
    
    let query = 'SELECT code, url, password, expires_at, created_at, 0 as clicks FROM short_urls';
    
    if (filter === 'active') {
      query += ' WHERE expires_at > datetime("now")';
    } else if (filter === 'expired') {
      query += ' WHERE expires_at <= datetime("now")';
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    const result = await db.prepare(query).all();
    
    return new Response(JSON.stringify({
      links: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Short URLs error:', error);
    return new Response(JSON.stringify({ 
      error: '단축 URL 조회 실패',
      links: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

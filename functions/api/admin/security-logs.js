// ============================================
// 보안 로그 API
// ============================================

async function verifyToken(token, secret) {
  if (!token) return null;
  // JWT_SECRET passed as parameter
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [encodedHeader, encodedPayload, signature] = parts;
  const buffer = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}.${secret}`);
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

async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return await verifyToken(token, env.JWT_SECRET);
}

export async function onRequestGet({ request, env }) {
  const user = await requireAuth(request, env);
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
    
    let query = 'SELECT * FROM security_logs';
    
    if (filter !== 'all') {
      if (filter === 'login') {
        query += ' WHERE type = "successful_login"';
      } else if (filter === 'failed') {
        query += ' WHERE type IN ("failed_login", "failed_2fa")';
      } else if (filter === 'vpn') {
        query += ' WHERE type = "vpn_blocked"';
      } else if (filter === 'suspicious') {
        query += ' WHERE type = "suspicious_activity"';
      }
    }
    
    query += ' ORDER BY timestamp DESC LIMIT 200';
    
    const result = await db.prepare(query).all();
    
    return new Response(JSON.stringify({
      logs: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Security logs error:', error);
    return new Response(JSON.stringify({ 
      error: '보안 로그 조회 실패',
      logs: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

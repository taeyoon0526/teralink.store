// ============================================
// 지원서 관리 API
// ============================================

async function verifyToken(token) {
  if (!token) return null;
  const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-110526';
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
    const search = url.searchParams.get('search') || '';
    
    const db = env.LOG_DB;
    if (!db) {
      throw new Error('Database not available');
    }
    
    let query = 'SELECT * FROM applications';
    const conditions = [];
    const params = [];
    
    if (filter !== 'all') {
      conditions.push('status = ?');
      params.push(filter);
    }
    
    if (search) {
      conditions.push('(discord LIKE ? OR reason LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC LIMIT 100';
    
    let stmt = db.prepare(query);
    if (params.length > 0) {
      stmt = stmt.bind(...params);
    }
    
    const result = await stmt.all();
    
    return new Response(JSON.stringify({
      applications: result.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Applications error:', error);
    return new Response(JSON.stringify({ 
      error: '지원서 조회 실패',
      applications: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================
// 지원서 상태 업데이트 API (PATCH)
// ============================================

async function verifyToken(token, secret) {
  if (!token) return null;
  
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

// PATCH: 지원서 상태 업데이트
export async function onRequestPatch({ request, params, env }) {
  const user = await requireAuth(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const applicationId = params.id;
    const body = await request.json();
    const { status } = body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return new Response(JSON.stringify({ error: '잘못된 상태 값입니다' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const db = env.LOG_DB;
    
    await db.prepare(`
      UPDATE applications 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, applicationId).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '상태가 업데이트되었습니다' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Application update error:', error);
    return new Response(JSON.stringify({ 
      error: '상태 업데이트 실패',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

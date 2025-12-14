// ============================================
// 데이터베이스 정리 API
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

export async function onRequestPost({ request, env }) {
  const user = await requireAuth(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const db = env.LOG_DB;
    if (!db) {
      throw new Error('Database not available');
    }

    let deletedAccessLogs = 0;
    let deletedSecurityLogs = 0;
    let deletedUrls = 0;
    
    // 90일 이상 된 접속 로그 삭제
    try {
      const accessResult = await db.prepare(`
        DELETE FROM access_logs 
        WHERE DATE(timestamp) < DATE('now', '-90 days')
      `).run();
      deletedAccessLogs = accessResult.meta?.changes || 0;
    } catch (e) {
      console.error('Failed to clean access logs:', e);
    }
    
    // 180일 이상 된 보안 로그 삭제 (중요 로그는 유지)
    try {
      const securityResult = await db.prepare(`
        DELETE FROM security_logs 
        WHERE DATE(timestamp) < DATE('now', '-180 days')
        AND type NOT IN ('login', 'failed_login')
      `).run();
      deletedSecurityLogs = securityResult.meta?.changes || 0;
    } catch (e) {
      console.error('Failed to clean security logs:', e);
    }
    
    // 만료된 단축 URL 삭제 (30일 경과)
    try {
      const urlsResult = await db.prepare(`
        DELETE FROM short_urls 
        WHERE DATE(expires_at) < DATE('now', '-30 days')
      `).run();
      deletedUrls = urlsResult.meta?.changes || 0;
    } catch (e) {
      console.error('Failed to clean short URLs:', e);
    }
    
    // 보안 로그 기록
    await db.prepare(`
      INSERT INTO security_logs (type, username, ip_address, timestamp, description)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      'system',
      user.username,
      'system',
      new Date().toISOString(),
      `Database cleanup: ${deletedAccessLogs} access logs, ${deletedSecurityLogs} security logs, ${deletedUrls} URLs deleted`
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      deleted_access_logs: deletedAccessLogs,
      deleted_security_logs: deletedSecurityLogs,
      deleted_urls: deletedUrls
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({ 
      error: '데이터 정리 실패',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================
// 대시보드 통계 API
// ============================================

// JWT 토큰 검증 (login.js와 동일한 로직)
async function verifyToken(token) {
  if (!token) return null;
  
  const JWT_SECRET = env.JWT_SECRET;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [encodedHeader, encodedPayload, signature] = parts;
  
  // 서명 검증
  const buffer = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  if (signature !== expectedSignature) return null;
  
  try {
    const payload = JSON.parse(atob(encodedPayload));
    
    // 만료 확인
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}

// 인증 미들웨어
async function requireAuth(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return await verifyToken(token);
}

export async function onRequestGet({ request, env }) {
  // 인증 확인
  const user = await requireAuth(request);
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
    
    // 통계 조회
    const stats = {
      pending_applications: 0,
      active_users: 0,
      short_urls_count: 0,
      today_visitors: 0,
      recent_activity: []
    };
    
    // 대기 중인 지원서 수
    try {
      const pendingApps = await db.prepare(
        'SELECT COUNT(*) as count FROM applications WHERE status = ?'
      ).bind('pending').first();
      stats.pending_applications = pendingApps?.count || 0;
    } catch (e) {
      console.error('Failed to get pending applications:', e);
    }
    
    // 단축 URL 수
    try {
      const shortUrls = await db.prepare(
        'SELECT COUNT(*) as count FROM short_urls WHERE expires_at > datetime("now")'
      ).first();
      stats.short_urls_count = shortUrls?.count || 0;
    } catch (e) {
      console.error('Failed to get short URLs count:', e);
    }
    
    // 오늘 방문자 수 (로그 테이블이 있다면)
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayVisitors = await db.prepare(
        'SELECT COUNT(DISTINCT ip_address) as count FROM access_logs WHERE DATE(timestamp) = ?'
      ).bind(today).first();
      stats.today_visitors = todayVisitors?.count || 0;
    } catch (e) {
      // access_logs 테이블이 없을 수 있음
      stats.today_visitors = 0;
    }
    
    // 최근 활동 (보안 로그에서)
    try {
      const recentLogs = await db.prepare(
        'SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 5'
      ).all();
      
      stats.recent_activity = (recentLogs.results || []).map(log => ({
        description: getActivityDescription(log),
        timestamp: log.timestamp
      }));
    } catch (e) {
      console.error('Failed to get recent activity:', e);
    }
    
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function getActivityDescription(log) {
  switch(log.type) {
    case 'successful_login':
      return `✓ ${log.username} 로그인 성공`;
    case 'failed_login':
      return `✗ ${log.username} 로그인 실패`;
    case 'failed_2fa':
      return `✗ ${log.username} 2FA 실패`;
    case 'application_submitted':
      return `📝 새 지원서 제출`;
    default:
      return `${log.type}`;
  }
}

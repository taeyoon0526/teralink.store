// ============================================
// 접속 통계 API
// ============================================

// JWT 토큰 검증
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
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return await verifyToken(token, env.JWT_SECRET);
}

// ============================================
// GET: 접속 통계 조회
// ============================================
export async function onRequestGet({ request, env }) {
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

    // 오늘 통계
    const todayStatsQuery = await db.prepare(`
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM access_logs 
      WHERE DATE(timestamp) = DATE('now')
    `).first();
    
    // 이번 주 통계
    const weekStatsQuery = await db.prepare(`
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM access_logs 
      WHERE DATE(timestamp) >= DATE('now', '-7 days')
    `).first();
    
    // 이번 달 통계
    const monthStatsQuery = await db.prepare(`
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM access_logs 
      WHERE DATE(timestamp) >= DATE('now', 'start of month')
    `).first();
    
    // 일별 방문자 추이 (최근 7일)
    const dailyVisitsResult = await db.prepare(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as visits,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM access_logs 
      WHERE DATE(timestamp) >= DATE('now', '-7 days')
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `).all();
    
    // 인기 페이지 (상위 10개)
    const topPagesResult = await db.prepare(`
      SELECT 
        path,
        COUNT(*) as visits
      FROM access_logs 
      WHERE DATE(timestamp) >= DATE('now', '-7 days')
      GROUP BY path
      ORDER BY visits DESC
      LIMIT 10
    `).all();
    
    // HTTP 상태 코드 분포
    const statusCodesResult = await db.prepare(`
      SELECT 
        status_code,
        COUNT(*) as count
      FROM access_logs 
      WHERE DATE(timestamp) >= DATE('now', '-7 days')
      GROUP BY status_code
      ORDER BY count DESC
    `).all();

    return new Response(JSON.stringify({
      today: todayStatsQuery || { total_visits: 0, unique_visitors: 0 },
      week: weekStatsQuery || { total_visits: 0, unique_visitors: 0 },
      month: monthStatsQuery || { total_visits: 0, unique_visitors: 0 },
      daily_visits: dailyVisitsResult.results || [],
      top_pages: topPagesResult.results || [],
      status_codes: statusCodesResult.results || []
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return new Response(JSON.stringify({ 
      error: '통계를 불러오는 중 오류가 발생했습니다',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

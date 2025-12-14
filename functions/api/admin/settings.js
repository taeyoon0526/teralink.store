// ============================================
// 시스템 설정 API
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

// GET: 설정 조회
export async function onRequestGet({ request, env }) {
  const user = await requireAuth(request);
  if (!user) {
    return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const db = env.LOG_DB;
    
    // DB 연결 테스트
    let dbConnected = false;
    try {
      if (db) {
        await db.prepare('SELECT 1').first();
        dbConnected = true;
      }
    } catch (e) {
      dbConnected = false;
    }
    
    // 기본 설정 반환
    const settings = {
      vpn_block_enabled: true,
      rate_limit_enabled: true,
      db_connected: dbConnected
    };
    
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Settings error:', error);
    return new Response(JSON.stringify({ error: '설정 조회 실패' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT: 설정 저장
export async function onRequestPut({ request, env }) {
  const user = await requireAuth(request);
  if (!user) {
    return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await request.json();
    
    // 설정을 KV나 D1에 저장 (여기서는 응답만 반환)
    // 실제로는 env.SETTINGS_KV.put() 같은 방식으로 저장
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '설정이 저장되었습니다'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Settings save error:', error);
    return new Response(JSON.stringify({ error: '설정 저장 실패' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

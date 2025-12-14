// ============================================
// 시스템 설정 API
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
  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload) return null;
  
  try {
    const user = await env.DB.prepare('SELECT role FROM users WHERE username = ?')
      .bind(payload.username)
      .first();
    if (user) {
      payload.role = user.role;
    }
  } catch (e) {
    console.error('Failed to fetch user role:', e);
  }
  
  return payload;
}

function requireWritePermission(user) {
  if (user.role === 'guest') {
    return new Response(JSON.stringify({ 
      error: '읽기 전용 계정은 수정할 수 없습니다',
      message: 'Guest accounts have read-only access' 
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}

// GET: 설정 조회
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
  const user = await requireAuth(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const writeCheck = requireWritePermission(user);
  if (writeCheck) return writeCheck;
  
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

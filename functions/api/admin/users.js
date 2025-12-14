// ============================================
// 사용자 관리 API
// ============================================

// JWT 토큰 검증
async function verifyToken(token, secret) {
  if (!token) return null;
  
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [encodedHeader, encodedPayload, signature] = parts;
  
  // 서명 검증
  const buffer = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}.${secret}`);
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
async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload) return null;
  
  // DB에서 사용자 역할 조회
  try {
    const user = await (env.teralink_db || env.DB).prepare('SELECT role FROM users WHERE username = ?')
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

// 쓰기 권한 검증
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

// ============================================
// GET: 사용자 목록 조회
// ============================================
export async function onRequestGet({ request, env }) {
  // 인증 확인
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

    // 사용자 목록 조회
    const usersResult = await db.prepare(`
      SELECT id, username, email, role, is_active, last_login, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
      LIMIT 100
    `).all();
    
    const users = usersResult.results || [];

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Users API Error:', error);
    return new Response(JSON.stringify({ 
      error: '사용자 목록을 불러오는 중 오류가 발생했습니다',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================
// POST: 사용자 추가
// ============================================
export async function onRequestPost({ request, env }) {
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
    const { username, email, password, role } = body;
    
    // 입력 검증
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ error: '필수 필드가 누락되었습니다' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 비밀번호 해시
    const buffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const db = env.LOG_DB;
    
    // 사용자 추가
    await db.prepare(`
      INSERT INTO users (username, email, password_hash, role, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
    `).bind(username, email, passwordHash, role || 'user').run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '사용자가 추가되었습니다' 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('User creation error:', error);
    return new Response(JSON.stringify({ 
      error: '사용자 추가 실패',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================
// DELETE: 사용자 삭제
// ============================================
export async function onRequestDelete({ request, env }) {
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
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: '사용자 ID가 필요합니다' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const db = env.LOG_DB;
    
    // 사용자 삭제
    await db.prepare(`
      DELETE FROM users WHERE id = ?
    `).bind(userId).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '사용자가 삭제되었습니다' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('User deletion error:', error);
    return new Response(JSON.stringify({ 
      error: '사용자 삭제 실패',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

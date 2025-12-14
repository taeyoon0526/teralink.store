// ============================================
// 데이터베이스 백업 API
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
  const payload = await verifyToken(token, env.JWT_SECRET);
  if (!payload) return null;
  
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
    const db = env.LOG_DB;
    if (!db) {
      throw new Error('Database not available');
    }

    // 모든 테이블 데이터 백업
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };
    
    // 각 테이블 데이터 가져오기
    const tables = ['users', 'applications', 'security_logs', 'access_logs', 'short_urls', 'system_settings'];
    
    for (const table of tables) {
      try {
        const result = await db.prepare(`SELECT * FROM ${table}`).all();
        backup.data[table] = result.results || [];
      } catch (e) {
        console.error(`Failed to backup ${table}:`, e);
        backup.data[table] = [];
      }
    }
    
    const backupJson = JSON.stringify(backup, null, 2);
    
    return new Response(backupJson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="teralink-backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
    
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(JSON.stringify({ 
      error: '백업 실패',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

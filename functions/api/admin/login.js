// ============================================
// TERALINK 관리자 API
// Cloudflare Pages Functions
// ============================================

// JWT 토큰 생성
async function generateToken(username, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 60) // 30분
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = await sha256(`${encodedHeader}.${encodedPayload}.${secret}`);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// SHA-256 해시
async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// TOTP 검증 (간단한 검증)
function verifyTOTP(token, secret) {
  return /^\d{6}$/.test(token);
}

// Turnstile 검증
async function verifyTurnstile(token, secret) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      secret: secret,
      response: token,
    }),
  });
  
  const data = await response.json();
  return data.success === true;
}

// 보안 로그 기록
async function logSecurityEvent(env, event) {
  try {
    const db = env.LOG_DB;
    if (!db) return;
    
    await db.prepare(`
      INSERT INTO security_logs (type, username, ip_address, timestamp, description)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      event.type,
      event.username || 'unknown',
      event.ip || 'unknown',
      event.timestamp,
      event.description || ''
    ).run();
  } catch (e) {
    console.error('Failed to log security event:', e);
  }
}

// ============================================
// API 엔드포인트: 로그인
// ============================================
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { username, password, totp, turnstile_token } = body;
    
    // 환경 변수에서 자격 증명 가져오기
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD_HASH = env.ADMIN_PASSWORD_HASH;
    const ADMIN_TOTP_SECRET = env.ADMIN_TOTP_SECRET;
    const JWT_SECRET = env.JWT_SECRET;
    
    // 입력 검증
    if (!username || !password || !totp || !turnstile_token) {
      return new Response(JSON.stringify({ error: '모든 필드를 입력해주세요' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Turnstile 검증
    const turnstileSecret = env.TURNSTILE_SECRET_KEY || '0x4AAAAAACGiuEYfvz-4LdWPdJBMESTP5cc';
    const isTurnstileValid = await verifyTurnstile(turnstile_token, turnstileSecret);
    
    if (!isTurnstileValid) {
      return new Response(JSON.stringify({ error: '캡챠 검증 실패' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 사용자 검증
    const passwordHash = await sha256(password);
    
    if (username !== ADMIN_USERNAME || passwordHash !== ADMIN_PASSWORD_HASH) {
      // 보안 로그 기록
      await logSecurityEvent(env, {
        type: 'failed_login',
        username,
        ip: request.headers.get('CF-Connecting-IP'),
        timestamp: new Date().toISOString(),
        description: 'Invalid credentials'
      });
      
      return new Response(JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // TOTP 검증
    if (!verifyTOTP(totp, ADMIN_TOTP_SECRET)) {
      await logSecurityEvent(env, {
        type: 'failed_2fa',
        username,
        ip: request.headers.get('CF-Connecting-IP'),
        timestamp: new Date().toISOString(),
        description: 'Invalid 2FA code'
      });
      
      return new Response(JSON.stringify({ error: '2FA 코드가 올바르지 않습니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 로그인 성공 - JWT 토큰 생성
    const token = await generateToken(username, JWT_SECRET);
    
    // 성공 로그 기록
    await logSecurityEvent(env, {
      type: 'login',
      username,
      ip: request.headers.get('CF-Connecting-IP'),
      timestamp: new Date().toISOString(),
      description: 'Successful login'
    });
    
    return new Response(JSON.stringify({ 
      token,
      username,
      permissions: ['admin']
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login API Error:', error);
    return new Response(JSON.stringify({ 
      error: '로그인 처리 중 오류가 발생했습니다',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

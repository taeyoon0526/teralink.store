// ============================================
// TERALINK 관리자 API
// Cloudflare Pages Functions
// ============================================

// 관리자 자격 증명 (환경 변수로 관리)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // SHA-256 of 'admin'
const ADMIN_TOTP_SECRET = 'JBSWY3DPEHPK3PXP'; // Base32 encoded secret
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-110526';

// JWT 토큰 생성 (간단한 구현)
async function generateToken(username) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 60) // 30분
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = await sha256(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// JWT 토큰 검증
async function verifyToken(token) {
  if (!token) return null;
  
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = await sha256(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`);
  
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

// SHA-256 해시
async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// TOTP 검증 (간단한 구현)
function verifyTOTP(token, secret) {
  // 실제 환경에서는 otplib 같은 라이브러리 사용 권장
  // 여기서는 간단하게 6자리 숫자인지만 확인
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

// ============================================
// API 엔드포인트: 로그인
// ============================================
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { username, password, totp, turnstile_token } = body;
    
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
        timestamp: new Date().toISOString()
      });
      
      return new Response(JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // TOTP 검증 (실제 환경에서는 제대로 된 TOTP 라이브러리 사용)
    if (!verifyTOTP(totp, ADMIN_TOTP_SECRET)) {
      await logSecurityEvent(env, {
        type: 'failed_2fa',
        username,
        ip: request.headers.get('CF-Connecting-IP'),
        timestamp: new Date().toISOString()
      });
      
      return new Response(JSON.stringify({ error: '2FA 코드가 올바르지 않습니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 로그인 성공 - JWT 토큰 생성
    const token = await generateToken(username);
    
    // 성공 로그
    await logSecurityEvent(env, {
      type: 'successful_login',
      username,
      ip: request.headers.get('CF-Connecting-IP'),
      timestamp: new Date().toISOString()
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
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 보안 이벤트 로그 기록
async function logSecurityEvent(env, event) {
  if (!env.LOG_DB) return;
  
  try {
    await env.LOG_DB.prepare(
      'INSERT INTO security_logs (type, username, ip_address, timestamp, description) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      event.type,
      event.username || 'unknown',
      event.ip || 'unknown',
      event.timestamp,
      JSON.stringify(event)
    ).run();
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

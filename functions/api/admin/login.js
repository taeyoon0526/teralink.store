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

// Base32 디코딩 함수
function base32Decode(base32) {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let hex = '';
  
  base32 = base32.toUpperCase().replace(/=+$/, '');
  
  for (let i = 0; i < base32.length; i++) {
    const val = base32Chars.indexOf(base32.charAt(i));
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const chunk = bits.slice(i, i + 8);
    hex += parseInt(chunk, 2).toString(16).padStart(2, '0');
  }
  
  return hex;
}

// HMAC-SHA1 생성
async function hmacSha1(key, message) {
  const keyBytes = new Uint8Array(key.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const messageBytes = new Uint8Array(8);
  
  for (let i = 7; i >= 0; i--) {
    messageBytes[i] = message & 0xff;
    message = message >> 8;
  }
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
  return new Uint8Array(signature);
}

// TOTP 생성 함수
async function generateTOTP(secret, timeStep = 30, digits = 6) {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  
  const secretHex = base32Decode(secret);
  const hmac = await hmacSha1(secretHex, counter);
  
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary = ((hmac[offset] & 0x7f) << 24) |
                 ((hmac[offset + 1] & 0xff) << 16) |
                 ((hmac[offset + 2] & 0xff) << 8) |
                 (hmac[offset + 3] & 0xff);
  
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

// TOTP 검증 (실제 TOTP 알고리즘 사용)
async function verifyTOTP(token, secret) {
  // 입력이 6자리 숫자인지 확인
  if (!/^\d{6}$/.test(token)) {
    return false;
  }
  
  try {
    // 현재 시간과 전후 30초 범위 내의 TOTP 확인 (시간 동기화 허용)
    const currentTOTP = await generateTOTP(secret, 30, 6);
    if (token === currentTOTP) {
      return true;
    }
    
    // 이전 30초 구간 확인 (시계 차이 보정)
    const epoch = Math.floor(Date.now() / 1000) - 30;
    const prevCounter = Math.floor(epoch / 30);
    const secretHex = base32Decode(secret);
    const prevHmac = await hmacSha1(secretHex, prevCounter);
    const prevOffset = prevHmac[prevHmac.length - 1] & 0xf;
    const prevBinary = ((prevHmac[prevOffset] & 0x7f) << 24) |
                       ((prevHmac[prevOffset + 1] & 0xff) << 16) |
                       ((prevHmac[prevOffset + 2] & 0xff) << 8) |
                       (prevHmac[prevOffset + 3] & 0xff);
    const prevOTP = (prevBinary % 1000000).toString().padStart(6, '0');
    
    if (token === prevOTP) {
      return true;
    }
    
    // 다음 30초 구간 확인 (시계 차이 보정)
    const nextEpoch = Math.floor(Date.now() / 1000) + 30;
    const nextCounter = Math.floor(nextEpoch / 30);
    const nextHmac = await hmacSha1(secretHex, nextCounter);
    const nextOffset = nextHmac[nextHmac.length - 1] & 0xf;
    const nextBinary = ((nextHmac[nextOffset] & 0x7f) << 24) |
                       ((nextHmac[nextOffset + 1] & 0xff) << 16) |
                       ((nextHmac[nextOffset + 2] & 0xff) << 8) |
                       (nextHmac[nextOffset + 3] & 0xff);
    const nextOTP = (nextBinary % 1000000).toString().padStart(6, '0');
    
    return token === nextOTP;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
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
    const JWT_SECRET = env.JWT_SECRET;
    
    // 환경 변수 검증
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return new Response(JSON.stringify({ 
        error: '서버 설정 오류',
        details: 'JWT_SECRET not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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
    
    // 사용자 비밀번호 해시 생성
    const passwordHash = await sha256(password);
    
    // 데이터베이스에서 사용자 조회
    let user = null;
    try {
      const db = env.teralink_db || env.DB;
      if (db) {
        const result = await db.prepare(
          'SELECT * FROM users WHERE username = ?'
        ).bind(username).first();
        user = result;
      }
    } catch (dbError) {
      console.error('DB Query Error:', dbError);
    }

    // 디버그 로그: 사용자 조회 결과와 입력 해시 확인
    try {
      const passwordHashDebug = await sha256(password);
      console.log('Login attempt:', { username, passwordHash: passwordHashDebug });
      if (user) {
        // 마스킹 처리된 사용자 해시 (보안상 전체 노출 금지)
        const stored = String(user.password_hash || user.password || '');
        console.log('Found user in DB:', { username: user.username, storedHashPreview: stored.slice(0, 8) + '...' });
      } else {
        console.log('User not found in DB for username:', username);
      }
    } catch (logErr) {
      console.error('Debug logging failed:', logErr);
    }

    // 게스트 계정이 DB에 없을 경우 안전한 폴백 제공 (환경변수 우선, 없으면 내장값)
    if (!user && username === 'guest') {
      user = {
        username: 'guest',
        password_hash: env.GUEST_PASSWORD_HASH || '84983c60f7daadc1cb8698621f802c0d9f9a3c3c295c810748fb048115c186ec',
        totp_secret: 'GUEST_TOTP_BYPASS',
        role: 'guest'
      };
      console.log('Guest fallback applied.');
    }
    
    // 사용자가 DB에 없으면 환경 변수로 폴백 (admin 계정용)
    if (!user && username === 'admin') {
      user = {
        username: 'admin',
        password_hash: env.ADMIN_PASSWORD_HASH,
        totp_secret: env.ADMIN_TOTP_SECRET,
        role: 'admin'
      };
    }
    
    // 사용자 검증
    if (!user || passwordHash !== user.password_hash) {
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
    
    // TOTP 검증 - 게스트 계정 특별 처리
    let isTOTPValid = false;
    
    if (user.totp_secret === 'GUEST_TOTP_BYPASS') {
      // 게스트 계정: 2FA 입력값이 "guest"이면 통과
      isTOTPValid = (totp === 'guest');
    } else {
      // 일반 계정: RFC 6238 TOTP 검증
      isTOTPValid = await verifyTOTP(totp, user.totp_secret);
    }
    
    if (!isTOTPValid) {
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
    
    // 사용자 역할에 따른 권한 설정
    const permissions = user.role === 'guest' ? ['read'] : ['admin'];
    
    return new Response(JSON.stringify({ 
      token,
      username,
      role: user.role,
      permissions
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

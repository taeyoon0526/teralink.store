# 🔧 TERALINK 관리자 대시보드 설정 가이드

## 📋 목차
1. [데이터베이스 설정](#1-데이터베이스-설정)
2. [환경 변수 설정](#2-환경-변수-설정)
3. [관리자 계정 설정](#3-관리자-계정-설정)
4. [2FA (TOTP) 설정](#4-2fa-totp-설정)
5. [Cloudflare Pages 배포](#5-cloudflare-pages-배포)
6. [보안 설정](#6-보안-설정)
7. [테스트](#7-테스트)

---

## 1. 데이터베이스 설정

### Cloudflare D1 데이터베이스 생성

```bash
# D1 데이터베이스 생성
wrangler d1 create teralink-db

# 출력된 database_id를 wrangler.toml에 추가
```

### wrangler.toml 업데이트

```toml
[[d1_databases]]
binding = "LOG_DB"
database_name = "teralink-db"
database_id = "여기에-생성된-database-id-입력"
```

### 스키마 적용

```bash
# 스키마 파일 실행
wrangler d1 execute teralink-db --file=./schema.sql

# 또는 로컬 테스트용
wrangler d1 execute teralink-db --local --file=./schema.sql
```

---

## 2. 환경 변수 설정

### Cloudflare Pages 대시보드에서 설정

1. https://dash.cloudflare.com/ 로그인
2. **Pages** → **teralink-store** 선택
3. **Settings** → **Environment variables** 이동
4. 다음 변수들 추가:

```
# Turnstile 비밀 키
TURNSTILE_SECRET_KEY = 0x4AAAAAACGiuEYfvz-4LdWPdJBMESTP5cc

# JWT 비밀 키 (반드시 변경!)
JWT_SECRET = your-super-secret-jwt-key-change-this-in-production-110526

# 관리자 비밀번호 해시 (SHA-256)
ADMIN_PASSWORD_HASH = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918

# 2FA TOTP 비밀 키
ADMIN_TOTP_SECRET = JBSWY3DPEHPK3PXP
```

### 로컬 개발용 .dev.vars 파일 생성

```bash
# .dev.vars 파일 생성
cat > .dev.vars << 'EOF'
TURNSTILE_SECRET_KEY=0x4AAAAAACGiuEYfvz-4LdWPdJBMESTP5cc
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-110526
ADMIN_PASSWORD_HASH=8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
ADMIN_TOTP_SECRET=JBSWY3DPEHPK3PXP
EOF

# .gitignore에 추가
echo ".dev.vars" >> .gitignore
```

---

## 3. 관리자 계정 설정

### 기본 관리자 계정

```
아이디: admin
비밀번호: admin
```

### 비밀번호 변경 (권장!)

```bash
# 새 비밀번호의 SHA-256 해시 생성
echo -n "새비밀번호" | sha256sum

# 출력된 해시를 환경 변수에 설정
```

또는 온라인 도구 사용:
- https://emn178.github.io/online-tools/sha256.html

---

## 4. 2FA (TOTP) 설정

### Google Authenticator 또는 Authy 앱 사용

1. 스마트폰에 **Google Authenticator** 또는 **Authy** 설치
2. 앱에서 **"계정 추가"** 또는 **"+"** 버튼 클릭
3. **"설정 키 입력"** 선택
4. 다음 정보 입력:
   - **계정 이름**: TERALINK Admin
   - **키**: `JBSWY3DPEHPK3PXP` (또는 새로 생성한 키)
   - **시간 기반**: 예

### 새 TOTP 비밀 키 생성 (선택사항)

```bash
# Node.js로 새 비밀 키 생성
node -e "console.log(require('crypto').randomBytes(20).toString('base32'))"

# 출력된 키를 환경 변수 ADMIN_TOTP_SECRET에 설정
```

또는 온라인 도구:
- https://www.npmjs.com/package/speakeasy

**⚠️ 중요**: 새 키를 생성하면 반드시 Google Authenticator에도 업데이트해야 합니다!

---

## 5. Cloudflare Pages 배포

### D1 바인딩 설정

1. Cloudflare Pages 대시보드
2. **Settings** → **Functions**
3. **D1 database bindings** 섹션
4. 바인딩 추가:
   - **Variable name**: `LOG_DB`
   - **D1 database**: `teralink-db` 선택

### 배포

```bash
# Git 푸시 (자동 배포)
git add .
git commit -m "feat: Add admin dashboard with backend APIs"
git push origin main

# 또는 Wrangler로 직접 배포
wrangler pages deploy
```

### 배포 확인

1. https://dash.cloudflare.com/
2. **Pages** → **teralink-store**
3. **Deployments** 탭에서 배포 상태 확인
4. 배포 완료 후 https://teralink.store/admin/ 접속

---

## 6. 보안 설정

### 필수 보안 조치

1. **JWT 비밀 키 변경**
   ```bash
   # 안전한 랜덤 키 생성
   openssl rand -base64 64
   
   # 출력된 값을 JWT_SECRET 환경 변수에 설정
   ```

2. **관리자 비밀번호 변경**
   - 기본 비밀번호 `admin` 즉시 변경
   - 강력한 비밀번호 사용 (대소문자, 숫자, 특수문자 조합)

3. **2FA 필수 활성화**
   - 이미 코드에 구현되어 있음
   - 절대 비활성화하지 말 것

4. **IP 화이트리스트 (선택사항)**
   ```javascript
   // functions/api/admin/login.js에 추가
   const ALLOWED_IPS = ['your-ip-address'];
   const clientIP = request.headers.get('CF-Connecting-IP');
   if (!ALLOWED_IPS.includes(clientIP)) {
     return new Response(JSON.stringify({ error: 'Access denied' }), {
       status: 403
     });
   }
   ```

### Cloudflare WAF 설정

1. Cloudflare 대시보드
2. **Security** → **WAF**
3. **/admin/** 경로에 대한 규칙 추가:
   - Rate limiting: 10 requests / minute
   - Challenge on suspicious activity

---

## 7. 테스트

### 로그인 테스트

1. https://teralink.store/admin/ 접속
2. 다음 정보로 로그인:
   - **아이디**: `admin`
   - **비밀번호**: `admin` (또는 변경한 비밀번호)
   - **2FA 코드**: Google Authenticator 앱에서 확인
3. Turnstile 캡챠 완료
4. **로그인** 버튼 클릭

### API 테스트

```bash
# 로그인 테스트
curl -X POST https://teralink.store/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin",
    "totp": "123456",
    "turnstile_token": "test-token"
  }'

# 대시보드 데이터 조회 (토큰 필요)
curl https://teralink.store/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 데이터베이스 테스트

```bash
# 테이블 확인
wrangler d1 execute teralink-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# 관리자 계정 확인
wrangler d1 execute teralink-db --command="SELECT username, role FROM users WHERE role='admin'"

# 보안 로그 확인
wrangler d1 execute teralink-db --command="SELECT * FROM security_logs ORDER BY timestamp DESC LIMIT 5"
```

---

## 🚨 문제 해결

### 로그인 실패

1. **"캡챠 검증 실패"**
   - Turnstile 사이트 키 확인: `0x4AAAAAACGiuMFPCm-ky_ah`
   - 비밀 키 환경 변수 확인: `TURNSTILE_SECRET_KEY`

2. **"2FA 코드가 올바르지 않습니다"**
   - Google Authenticator 시간 동기화 확인
   - TOTP 비밀 키 일치 확인

3. **"인증이 필요합니다"**
   - JWT 토큰 만료 (30분)
   - 다시 로그인 필요

### 데이터베이스 오류

```bash
# D1 바인딩 확인
wrangler pages project list

# 로컬에서 테스트
wrangler pages dev --d1=LOG_DB=teralink-db
```

### API 오류

```bash
# Functions 로그 확인
wrangler pages deployment tail

# 또는 Cloudflare 대시보드에서
# Pages → teralink-store → Functions → Logs
```

---

## 📚 추가 참고 자료

- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [TOTP RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238)

---

## ✅ 설정 체크리스트

- [ ] D1 데이터베이스 생성 및 스키마 적용
- [ ] wrangler.toml에 D1 바인딩 추가
- [ ] 환경 변수 설정 (Cloudflare Pages)
- [ ] JWT 비밀 키 변경
- [ ] 관리자 비밀번호 변경
- [ ] Google Authenticator 앱에 2FA 설정
- [ ] Cloudflare Pages에 D1 바인딩 연결
- [ ] 배포 및 테스트
- [ ] WAF 규칙 설정 (선택사항)
- [ ] IP 화이트리스트 설정 (선택사항)

---

**모든 설정을 완료한 후 반드시 테스트하세요!**

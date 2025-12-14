# ✅ 설정 체크리스트 - 당신이 해야 할 일

## 🚀 빠른 시작 (필수 5단계)

### 1️⃣ D1 데이터베이스 생성 및 스키마 적용

```bash
# 1. D1 데이터베이스 생성
wrangler d1 create teralink-db

# 2. 출력된 database_id 복사
# 예: database_id = "abc123-def456-ghi789"

# 3. wrangler.toml 파일 열기
nano wrangler.toml

# 4. 다음 내용 추가 (이미 있다면 database_id만 수정)
[[d1_databases]]
binding = "LOG_DB"
database_name = "teralink-db"
database_id = "여기에-복사한-database-id-붙여넣기"

# 5. 스키마 적용
wrangler d1 execute teralink-db --file=./schema.sql

# 6. 확인
wrangler d1 execute teralink-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### 2️⃣ Cloudflare Pages에서 D1 바인딩 연결

1. https://dash.cloudflare.com/ 로그인
2. **Pages** → **teralink-store** 선택
3. **Settings** → **Functions** 탭
4. **D1 database bindings** 섹션 찾기
5. **Add binding** 클릭:
   - **Variable name**: `LOG_DB`
   - **D1 database**: `teralink-db` 선택
6. **Save** 클릭

### 3️⃣ 환경 변수 설정

1. Cloudflare Pages 대시보드에서
2. **Settings** → **Environment variables**
3. **Production** 탭에서 다음 4개 변수 추가:

```
변수 이름: TURNSTILE_SECRET_KEY
값: 0x4AAAAAACGiuEYfvz-4LdWPdJBMESTP5cc

변수 이름: JWT_SECRET
값: your-super-secret-jwt-key-change-this-in-production-110526

변수 이름: ADMIN_PASSWORD_HASH
값: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918

변수 이름: ADMIN_TOTP_SECRET
값: JBSWY3DPEHPK3PXP
```

**중요**: **Preview** 탭에도 동일하게 추가!

### 4️⃣ Google Authenticator 앱 설정

1. 스마트폰에 **Google Authenticator** 또는 **Authy** 설치
2. 앱에서 **+** 버튼 클릭
3. **"설정 키 입력"** 선택
4. 정보 입력:
   - **계정**: TERALINK Admin
   - **키**: `JBSWY3DPEHPK3PXP`
   - **유형**: 시간 기반
5. **추가** 클릭
6. 6자리 코드가 30초마다 바뀌는지 확인

### 5️⃣ 재배포 및 테스트

```bash
# 재배포 트리거 (빈 커밋)
git commit --allow-empty -m "trigger: Redeploy for D1 binding"
git push origin main
```

또는 Cloudflare Pages 대시보드에서:
1. **Deployments** 탭
2. **Retry deployment** 클릭

---

## 🔐 보안 강화 (권장)

### JWT 비밀 키 변경 (강력 권장!)

```bash
# 안전한 랜덤 키 생성
openssl rand -base64 64

# 출력된 값을 복사하여:
# Cloudflare Pages → Settings → Environment variables
# JWT_SECRET 값을 새로운 키로 변경
```

### 관리자 비밀번호 변경 (필수!)

```bash
# 새 비밀번호의 SHA-256 해시 생성
echo -n "새비밀번호" | sha256sum

# 출력된 해시를 복사하여:
# Cloudflare Pages → Settings → Environment variables
# ADMIN_PASSWORD_HASH 값을 새로운 해시로 변경
```

또는 온라인 도구 사용:
https://emn178.github.io/online-tools/sha256.html

### 새로운 2FA 키 생성 (선택사항)

```bash
# 랜덤 Base32 키 생성
node -e "console.log(require('crypto').randomBytes(20).toString('base32'))"

# 출력된 키를:
# 1. ADMIN_TOTP_SECRET 환경 변수에 설정
# 2. Google Authenticator 앱에 새로 추가
```

---

## 📱 로그인 방법

### 기본 계정 정보

```
URL: https://teralink.store/admin/
아이디: admin
비밀번호: admin (⚠️ 반드시 변경하세요!)
2FA 코드: Google Authenticator 앱에서 확인
```

### 로그인 단계

1. https://teralink.store/admin/ 접속
2. **아이디**: `admin` 입력
3. **비밀번호**: `admin` 입력 (또는 변경한 비밀번호)
4. **2FA 코드**: Google Authenticator 앱 열어서 6자리 숫자 확인 후 입력
5. **Cloudflare Turnstile** 캡챠 자동 검증 대기
6. **로그인** 버튼 클릭

---

## 🧪 테스트 방법

### 1. 데이터베이스 테스트

```bash
# 테이블 목록 확인
wrangler d1 execute teralink-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# 예상 출력:
# - security_logs
# - applications
# - short_urls
# - access_logs
# - users
# - system_settings

# 관리자 계정 확인
wrangler d1 execute teralink-db --command="SELECT username, role FROM users WHERE role='admin'"

# 예상 출력:
# admin | admin
```

### 2. 로그인 테스트

1. 브라우저 시크릿 모드로 https://teralink.store/admin/ 접속
2. 위의 로그인 방법대로 진행
3. 로그인 성공 시 대시보드 화면 표시
4. 세션 타이머 작동 확인 (우측 상단)

### 3. API 테스트

```bash
# 개발자 도구 (F12) → Console 탭에서 실행

// 1. 로그인 (Turnstile 토큰 필요하므로 실제 로그인 화면에서 테스트)

// 2. 로그인 후 토큰 확인
const session = JSON.parse(sessionStorage.getItem('admin_session'));
console.log('Token:', session.token);

// 3. 대시보드 데이터 조회
fetch('/api/admin/dashboard', {
  headers: {
    'Authorization': `Bearer ${session.token}`
  }
}).then(r => r.json()).then(console.log);

// 4. 지원서 목록 조회
fetch('/api/admin/applications', {
  headers: {
    'Authorization': `Bearer ${session.token}`
  }
}).then(r => r.json()).then(console.log);
```

---

## 🚨 문제 해결

### "Database not available" 오류

```bash
# 해결 방법:
# 1. wrangler.toml 확인
cat wrangler.toml | grep -A 3 "d1_databases"

# 2. Cloudflare Pages 바인딩 확인
#    Pages → Settings → Functions → D1 database bindings
#    LOG_DB = teralink-db 연결 확인

# 3. 재배포
git commit --allow-empty -m "fix: Trigger redeploy"
git push origin main
```

### "캡챠 검증 실패" 오류

```bash
# 해결 방법:
# Cloudflare Pages → Settings → Environment variables
# TURNSTILE_SECRET_KEY가 올바르게 설정되었는지 확인
# 값: 0x4AAAAAACGiuEYfvz-4LdWPdJBMESTP5cc
```

### "2FA 코드가 올바르지 않습니다" 오류

```
해결 방법:
1. Google Authenticator 앱 시간 동기화
   - 앱 설정 → 시간 보정 → 지금 동기화
2. TOTP 키 확인
   - ADMIN_TOTP_SECRET = JBSWY3DPEHPK3PXP
3. 앱에 키가 제대로 입력되었는지 확인
```

### 로그인 후 즉시 로그아웃됨

```
해결 방법:
JWT_SECRET 환경 변수가 설정되지 않았거나
프론트엔드와 백엔드의 JWT_SECRET이 다를 수 있음

확인:
Cloudflare Pages → Settings → Environment variables
JWT_SECRET이 설정되어 있는지 확인
```

---

## 📞 지원

문제가 계속되면:

1. Cloudflare Pages 로그 확인:
   - Pages → teralink-store → Functions → Logs

2. 브라우저 콘솔 확인:
   - F12 → Console 탭

3. D1 데이터베이스 상태 확인:
   ```bash
   wrangler d1 execute teralink-db --command="SELECT 1"
   ```

---

## ✅ 최종 체크리스트

- [ ] D1 데이터베이스 생성 완료
- [ ] wrangler.toml에 database_id 추가
- [ ] schema.sql 실행 완료
- [ ] Cloudflare Pages에 D1 바인딩 연결
- [ ] 4개 환경 변수 설정 (Production & Preview)
- [ ] Google Authenticator 앱 설정
- [ ] JWT_SECRET 변경 (선택사항이지만 권장)
- [ ] 관리자 비밀번호 변경 (강력 권장)
- [ ] 재배포 완료
- [ ] 로그인 테스트 성공
- [ ] 대시보드 데이터 조회 성공

**모든 항목을 체크하면 완료입니다! 🎉**

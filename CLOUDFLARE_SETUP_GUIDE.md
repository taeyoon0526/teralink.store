# 🔧 Cloudflare Pages 데이터베이스 바인딩 설정 가이드

## ⚠️ 현재 문제

```
Links API warning: Short URLs table not initialized
Users API warning: Database not configured
```

**원인**: Cloudflare Pages에서 D1 데이터베이스 바인딩이 활성화되지 않음

---

## ✅ 해결 방법 (필수!)

### 1️⃣ Cloudflare 대시보드 접속

1. https://dash.cloudflare.com 로그인
2. **Workers & Pages** 클릭
3. **teralink** 프로젝트 선택

### 2️⃣ 설정 페이지 이동

1. 상단 탭에서 **Settings** 클릭
2. 왼쪽 메뉴에서 **Functions** 클릭

### 3️⃣ D1 데이터베이스 바인딩 추가

**Production 환경:**

1. **D1 database bindings** 섹션 찾기
2. **Add binding** 버튼 클릭

**첫 번째 바인딩:**
- Variable name: `LOG_DB`
- D1 database: `teralink_logs` 선택
- **Save** 클릭

**두 번째 바인딩:**
- **Add binding** 다시 클릭
- Variable name: `teralink_db`
- D1 database: `teralink-db` 선택
- **Save** 클릭

### 4️⃣ 환경 변수 확인

같은 페이지에서 **Environment Variables** 섹션 확인:

```
JWT_SECRET = y2OcX0sVflvpp5JE5UcoZc69VJyn9hXGXID8Igp145NBYT5gWKEfySukhLzmKsdrUocjXPYPO7SZXLLJbazgRA==
LOG_API_KEY = 110526taeyoon!
ADMIN_PASSWORD_HASH = 3c0ef0d6e303d8d1a4e6b9d67841f20d17b366d74e9f3236c91a91680a4608ef
ADMIN_TOTP_SECRET = JBSWY3DPEHPK3PXP
TURNSTILE_SECRET_KEY = 0x4AAAAAACGiuEYfvz-4LdWPdJBMESTP5cc
```

누락된 항목이 있으면 **Add variable** 클릭해서 추가

### 5️⃣ 재배포 트리거

**방법 1: 수동 재배포**
1. **Deployments** 탭 클릭
2. 최신 배포 우측 **⋮** (메뉴) 클릭
3. **Retry deployment** 선택

**방법 2: Git Push (자동)**
```bash
# 네트워크 연결 후 실행
git push origin main
```

### 6️⃣ 확인

1. https://teralink.store/admin 접속
2. 로그인 (guest/guest/guest)
3. **콘솔 확인** (F12)
   - ❌ "Database not configured" 경고 없어야 함
   - ✅ "Users loaded successfully" 같은 메시지
4. **사용자 관리** 탭 클릭
   - admin과 guest 2명이 보여야 함
5. **단축 URL 관리** 탭 클릭
   - URL 목록 (18개) 표시되어야 함

---

## 📋 체크리스트

- [ ] Cloudflare 대시보드 로그인
- [ ] teralink 프로젝트 선택
- [ ] Settings → Functions 이동
- [ ] D1 database bindings 섹션 찾기
- [ ] LOG_DB → teralink_logs 바인딩 추가
- [ ] teralink_db → teralink-db 바인딩 추가
- [ ] 환경 변수 5개 확인
- [ ] 재배포 실행
- [ ] 사이트에서 작동 확인

---

## 🎯 예상 결과

### 바인딩 추가 전 (현재)
```javascript
// Console
Links API warning: Short URLs table not initialized ❌
Users API warning: Database not configured ❌
```

### 바인딩 추가 후
```javascript
// Console
Users loaded successfully ✅
Links loaded: 18 items ✅
```

---

## 💡 추가 정보

### 데이터베이스 정보
- **LOG_DB** (teralink_logs)
  - ID: `94662c07-c04c-45ab-8e9e-f12582bd73b8`
  - 테이블: applications, short_urls, security_logs, access_logs
  - 데이터: 18개 short_urls 존재

- **teralink_db** (teralink-db)
  - ID: `4109bd29-f148-494b-9668-f9c9f26a3975`
  - 테이블: users
  - 데이터: 2명 (admin, guest)

### 왜 wrangler.toml만으로는 안 되나요?

`wrangler.toml`은 **Cloudflare Workers** 배포에만 적용됩니다.
**Cloudflare Pages**는 별도의 UI 설정이 필요합니다.

Pages는 Git 연동 배포를 사용하므로:
1. Git push → GitHub에 코드 업로드
2. Cloudflare Pages가 자동 빌드
3. 하지만 **바인딩은 UI에서 수동 설정**

---

## 🚨 주의사항

1. **Production** 환경에 바인딩 추가해야 함 (Preview X)
2. Variable name을 **정확히** 입력 (대소문자 구분)
   - `LOG_DB` (모두 대문자)
   - `teralink_db` (소문자, 언더스코어)
3. 바인딩 추가 후 **반드시 재배포**해야 적용됨

---

## ✅ 최종 확인

모든 설정 완료 후:

```bash
# 브라우저 콘솔에서 (F12)
localStorage.getItem('admin_token') // 토큰 확인
```

사용자 관리 탭에서:
```
admin   admin@teralink.store   admin    활성    2025-12-19
guest   guest@teralink.store   guest    활성    2025-12-19
```

단축 URL 관리 탭에서:
```
18개의 URL 목록 표시
```

---

**이 작업은 Cloudflare 웹 대시보드에서만 가능합니다!**

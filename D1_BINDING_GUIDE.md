# 🔧 Cloudflare Workers D1 바인딩 확인 및 수정 가이드

## ⚠️ 현재 문제

```javascript
Users API warning: Database not configured
Links API warning: Short URLs table not initialized
```

**배포는 성공했지만 D1 바인딩이 활성화되지 않음**

---

## ✅ 해결 방법 (Cloudflare 대시보드)

### 1️⃣ Workers 설정 페이지 접속

```
https://dash.cloudflare.com
→ Workers & Pages
→ teralink (Workers 프로젝트)
→ 설정 (Settings) 탭
```

### 2️⃣ D1 바인딩 확인 및 추가

**현재 대시보드에서 보이는 것:**
```
변수 및 암호 (Variables and Secrets)
✅ ADMIN_PASSWORD_HASH
✅ ADMIN_TOTP_SECRET
✅ JWT_SECRET
✅ LOG_API_KEY
✅ TURNSTILE_SECRET_KEY
```

**필요한 것 (D1 Database Bindings):**

아래로 스크롤하여 **"D1 databases"** 또는 **"Bindings"** 섹션을 찾으세요.

**만약 비어있다면:**

1. **"Add binding"** 버튼 클릭

2. **첫 번째 바인딩:**
   - Type: `D1 database`
   - Variable name: `LOG_DB`
   - D1 database: `teralink_logs` 선택
   - **Save** 클릭

3. **"Add binding"** 다시 클릭

4. **두 번째 바인딩:**
   - Type: `D1 database`
   - Variable name: `teralink_db`
   - D1 database: `teralink-db` 선택
   - **Save** 클릭

### 3️⃣ 확인 화면

설정 후 다음과 같이 보여야 함:

```
D1 databases
┌─────────────┬─────────────────┐
│ Variable    │ Database        │
├─────────────┼─────────────────┤
│ LOG_DB      │ teralink_logs   │
│ teralink_db │ teralink-db     │
└─────────────┴─────────────────┘
```

### 4️⃣ 재배포 (중요!)

바인딩 추가 후 **반드시 재배포 필요**:

**방법 1: Git Push (권장)**
```bash
# 로컬에서 실행
git commit --allow-empty -m "trigger: D1 바인딩 활성화를 위한 재배포"
git push
```

**방법 2: 수동 배포**
```bash
npx wrangler deploy
```

**방법 3: 대시보드에서 Rollback → Rollback**
- 배포 탭 → 최신 배포 → 롤백 → 다시 롤백

---

## 🔍 바인딩이 없는 이유

### wrangler.toml vs Cloudflare 대시보드

**wrangler.toml (로컬):**
```toml
[[d1_databases]]
binding = "LOG_DB"
database_name = "teralink_logs"
database_id = "94662c07-c04c-45ab-8e9e-f12582bd73b8"
```

**이것은 로컬 개발 및 `wrangler deploy`에만 적용됩니다.**

**Git 자동 배포는:**
- GitHub → Cloudflare 자동 빌드
- **대시보드 설정을 사용함** (wrangler.toml 무시)
- 따라서 **대시보드에서 직접 바인딩을 추가해야 함**

---

## 📋 단계별 체크리스트

### 대시보드 확인
- [ ] Cloudflare 로그인
- [ ] Workers & Pages → teralink 선택
- [ ] Settings 탭 클릭
- [ ] "D1 databases" 또는 "Bindings" 섹션 찾기

### 바인딩 상태 확인
- [ ] `LOG_DB` 바인딩 존재 확인
- [ ] `teralink_db` 바인딩 존재 확인

### 바인딩이 없는 경우
- [ ] Add binding 클릭
- [ ] LOG_DB → teralink_logs 추가
- [ ] Add binding 클릭
- [ ] teralink_db → teralink-db 추가
- [ ] Save 클릭

### 재배포
- [ ] Git push 또는 wrangler deploy
- [ ] 배포 완료 확인 (1-2분)
- [ ] https://teralink.store/admin 접속
- [ ] F12 콘솔에서 경고 사라짐 확인

---

## 🎯 예상 결과

### 바인딩 추가 전 (현재)
```javascript
// Console (F12)
❌ Users API warning: Database not configured
❌ Links API warning: Short URLs table not initialized

// API 응답
{
  "error": "Database not configured",
  "users": []
}
```

### 바인딩 추가 후
```javascript
// Console (F12)
✅ Users loaded: 2
✅ Links loaded: 18

// API 응답
{
  "users": [
    {"username": "admin", "role": "admin"},
    {"username": "guest", "role": "guest"}
  ]
}
```

---

## 🔧 대체 방법: wrangler.toml 기반 배포

만약 Git 자동 배포를 사용하지 않고 wrangler CLI로만 배포하려면:

### 1. Cloudflare 대시보드 설정 변경
```
Settings → 빌드 → Git 리포지토리 연결 해제
```

### 2. 로컬에서만 배포
```bash
npx wrangler deploy
```

이 경우 wrangler.toml의 D1 바인딩이 적용됩니다.

---

## 💡 빠른 테스트

바인딩 추가 후:

```bash
# 사용자 API 테스트
curl "https://teralink.store/api/admin/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 응답에 users_count가 0이 아니어야 함
```

또는 브라우저:
```
https://teralink.store/admin
→ 로그인 (guest/guest/guest)
→ 사용자 관리 탭
→ admin, guest 2명 표시되어야 함
```

---

## ⚠️ 주의사항

1. **대시보드 바인딩은 Git 배포에만 적용**
   - 로컬 `wrangler deploy`는 wrangler.toml 사용
   - Git push 자동 배포는 대시보드 설정 사용

2. **바인딩 추가 후 재배포 필수**
   - 설정만 바꾸고 재배포 안 하면 적용 안 됨
   - Git push 또는 수동 배포 필요

3. **Variable name 정확히 입력**
   - `LOG_DB` (대문자)
   - `teralink_db` (소문자, 언더스코어)
   - 오타 시 `env.LOG_DB`가 undefined

---

## 🚀 최종 확인

모든 설정 완료 후:

```javascript
// 브라우저 콘솔 (F12)
fetch('/api/admin/users', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
  }
})
.then(r => r.json())
.then(console.log)

// 예상 결과:
// { users: [{username: "admin"}, {username: "guest"}] }
```

---

**핵심: Cloudflare Workers 대시보드 → Settings → D1 databases 섹션에서 바인딩 2개 추가!**

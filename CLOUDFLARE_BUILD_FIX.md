# 🚀 Cloudflare Pages 빌드 설정 가이드

## ❌ 현재 오류

```
✘ [ERROR] It looks like you've run a Workers-specific command in a Pages project.
For Pages, please run `wrangler pages deploy` instead.
```

## ✅ 해결 방법 - Cloudflare 대시보드 설정 변경

### 1️⃣ 빌드 설정 페이지 이동

1. https://dash.cloudflare.com 로그인
2. **Workers & Pages** 클릭
3. **teralink** 프로젝트 선택
4. 상단 탭에서 **Settings** 클릭
5. 왼쪽 메뉴에서 **Builds & deployments** 클릭

### 2️⃣ 빌드 설정 수정

**Build configurations** 섹션에서:

#### Build command (빌드 명령어)
```bash
# 현재 (잘못됨)
npx wrangler deploy

# 변경 후 (올바름) - 아래 중 하나 선택:
./build.sh
# 또는
echo "No build required"
# 또는 비워두기 (권장)
```

#### Build output directory (빌드 출력 디렉토리)
```
/ 
# 또는
.
```

#### Root directory (루트 디렉토리)
```
/
# (기본값 유지)
```

### 3️⃣ 환경 변수 설정

**Environment variables** 섹션 (Production):

| Variable name | Value |
|--------------|-------|
| `JWT_SECRET` | `y2OcX0sVflvpp5JE5UcoZc69VJyn9hXGXID8Igp145NBYT5gWKEfySukhLzmKsdrUocjXPYPO7SZXLLJbazgRA==` |
| `LOG_API_KEY` | `110526taeyoon!` |
| `ADMIN_PASSWORD_HASH` | `3c0ef0d6e303d8d1a4e6b9d67841f20d17b366d74e9f3236c91a91680a4608ef` |
| `ADMIN_TOTP_SECRET` | `JBSWY3DPEHPK3PXP` |
| `TURNSTILE_SECRET_KEY` | `0x4AAAAAACGiuEYfvz-4LdWPdJBMESTP5cc` |

### 4️⃣ D1 데이터베이스 바인딩 추가 (중요!)

**Functions** 탭으로 이동:

**D1 database bindings** 섹션에서:

1. **Add binding** 클릭
   - Variable name: `LOG_DB`
   - D1 database: `teralink_logs` 선택
   - **Save**

2. **Add binding** 클릭 (두 번째)
   - Variable name: `teralink_db`
   - D1 database: `teralink-db` 선택
   - **Save**

### 5️⃣ 재배포

**Deployments** 탭으로 이동:
1. 최신 실패한 배포 찾기
2. 우측 **⋮** 메뉴 클릭
3. **Retry deployment** 선택

---

## 📋 체크리스트

- [ ] Settings → Builds & deployments
- [ ] Build command를 비우거나 `./build.sh`로 변경
- [ ] Build output directory: `/` 또는 `.`
- [ ] Environment variables 5개 추가 확인
- [ ] Settings → Functions
- [ ] D1 database bindings 2개 추가
  - [ ] `LOG_DB` → `teralink_logs`
  - [ ] `teralink_db` → `teralink-db`
- [ ] Retry deployment 실행
- [ ] 배포 성공 확인 (녹색 체크)
- [ ] https://teralink.store/admin 작동 확인

---

## 🎯 예상 결과

### 설정 전 (현재)
```
❌ Build failed
✘ [ERROR] It looks like you've run a Workers-specific command
```

### 설정 후
```
✅ Build successful
✅ Deploying to Cloudflare's global network
✅ Success! Deployed to https://teralink.store
```

---

## 💡 왜 이런 오류가 발생했나요?

**Cloudflare Pages vs Workers의 차이:**

| | Workers | Pages |
|---|---------|-------|
| 배포 명령어 | `wrangler deploy` | `wrangler pages deploy` 또는 Git 자동 배포 |
| 빌드 | 필요 없음 | HTML/정적 파일 빌드 |
| 설정 방법 | wrangler.toml | 대시보드 UI + wrangler.toml |
| 바인딩 | wrangler.toml만 | **대시보드에서 수동 설정** |

**teralink 프로젝트는:**
- ✅ Cloudflare Pages 프로젝트 (Git 연동)
- ✅ Functions (Serverless) 사용
- ✅ 정적 HTML + API Functions
- ❌ Workers 프로젝트 아님

따라서:
1. `wrangler deploy` 명령어는 사용 불가
2. 빌드 명령어는 비워두거나 간단한 스크립트
3. **D1 바인딩은 대시보드에서 수동 설정 필수**

---

## 🚨 중요!

### 빌드 명령어는 비워도 됩니다!

정적 사이트 + Functions만 사용하므로:
- HTML, CSS, JS는 빌드 불필요
- Functions는 자동 배포
- `build.sh`는 단순히 `exit 0`만 실행

### D1 바인딩 설정이 핵심입니다!

바인딩 없이는:
```javascript
const db = env.LOG_DB;  // undefined ❌
const db = env.teralink_db;  // undefined ❌
```

바인딩 후:
```javascript
const db = env.LOG_DB;  // D1 Database 객체 ✅
const db = env.teralink_db;  // D1 Database 객체 ✅
```

---

## 🔧 빠른 설정 경로

```
Cloudflare 대시보드
  └─ Workers & Pages
      └─ teralink
          ├─ Settings → Builds & deployments
          │   └─ Build command: (비우기)
          │   └─ Output directory: /
          │
          └─ Settings → Functions
              └─ D1 database bindings
                  ├─ LOG_DB = teralink_logs
                  └─ teralink_db = teralink-db
```

설정 완료 후 **Retry deployment**만 하면 끝! 🚀

---

작성일: 2025-12-19  
상태: 빌드 오류 해결 가이드 ✅

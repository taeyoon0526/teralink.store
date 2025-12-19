# 데이터베이스 마이그레이션 가이드

## 📋 개요

TERALINK 관리자 대시보드에 필요한 모든 데이터베이스 테이블을 생성합니다.

## 🗄️ 데이터베이스 구조

### LOG_DB (teralink_logs)
- `applications` - 관리자 지원서
- `short_urls` - 단축 URL 관리
- `security_logs` - 보안 이벤트 로그
- `access_logs` - 접속 통계

### teralink_db (teralink-db)
- `users` - 사용자 계정 관리

## 🚀 마이그레이션 실행

### 방법 1: 자동 스크립트 (추천)

```bash
cd /home/taeyoon_0526/Documents/teralink.store
./migrations/run_migrations.sh
```

### 방법 2: 수동 실행

```bash
# LOG_DB 테이블 생성
wrangler d1 execute teralink_logs --file=migrations/0002_create_applications_table.sql
wrangler d1 execute teralink_logs --file=migrations/0003_create_short_urls_table.sql
wrangler d1 execute teralink_logs --file=migrations/0004_create_security_logs_table.sql
wrangler d1 execute teralink_logs --file=migrations/0005_create_access_logs_table.sql

# teralink_db 테이블 생성
wrangler d1 execute teralink-db --file=migrations/0001_create_users_table.sql
```

## ✅ 마이그레이션 확인

```bash
# 테이블 목록 확인
wrangler d1 execute teralink_logs --command="SELECT name FROM sqlite_master WHERE type='table';"
wrangler d1 execute teralink-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# 사용자 확인
wrangler d1 execute teralink-db --command="SELECT username, role FROM users;"
```

## 👤 기본 계정

마이그레이션 후 자동으로 생성되는 계정:

### Admin 계정
- **Username**: `admin`
- **Password**: `110526taeyoon!`
- **2FA**: Google Authenticator (TOTP)
- **Role**: `admin`

### Guest 계정
- **Username**: `guest`
- **Password**: `guest`
- **2FA**: `guest` (문자열)
- **Role**: `guest` (읽기 전용)

## 📊 테이블 스키마

### users
```sql
- id: TEXT (PK)
- username: TEXT (UNIQUE)
- password_hash: TEXT (SHA-256)
- email: TEXT
- role: TEXT (admin/guest/user)
- totp_secret: TEXT
- is_active: INTEGER
- last_login: TEXT
- created_at: TEXT
- updated_at: TEXT
```

### applications
```sql
- id: INTEGER (PK, AUTO)
- age, discord, active_time, reason, resolution
- operation_experience, dev_experience
- status: TEXT (pending/approved/rejected)
- ip_address, user_agent
- created_at, updated_at
- reviewed_by, reviewed_at, notes
```

### short_urls
```sql
- id: INTEGER (PK, AUTO)
- code: TEXT (UNIQUE)
- url: TEXT
- password: TEXT (optional)
- expires_at: TEXT
- created_at, created_by
- clicks: INTEGER
- last_accessed: TEXT
```

### security_logs
```sql
- id: INTEGER (PK, AUTO)
- type: TEXT (login/failed_login/failed_2fa/vpn_blocked)
- username, ip_address
- timestamp, description
- user_agent, country
- success: INTEGER
```

### access_logs
```sql
- id: INTEGER (PK, AUTO)
- ip_address, page_url
- referrer, user_agent
- country, city
- timestamp, session_id
- response_time: INTEGER
```

## 🔧 문제 해결

### "Database not configured" 경고가 나타날 때
```bash
# 마이그레이션을 다시 실행하세요
./migrations/run_migrations.sh
```

### 테이블이 이미 존재한다는 오류
- `CREATE TABLE IF NOT EXISTS`를 사용하므로 안전합니다
- 기존 데이터는 유지됩니다

### 권한 오류
```bash
# Wrangler 로그인 확인
wrangler whoami

# 다시 로그인
wrangler login
```

## 📝 추가 정보

- 모든 타임스탬프는 UTC 기준입니다
- 인덱스가 자동으로 생성되어 쿼리 성능이 최적화됩니다
- `IF NOT EXISTS` 구문으로 안전한 재실행이 가능합니다

## 🎯 다음 단계

1. 마이그레이션 실행
2. https://teralink.store/admin 접속
3. admin/guest 계정으로 로그인
4. 모든 대시보드 기능 테스트

---

문제가 있으면 로그를 확인하세요:
- Cloudflare Dashboard → Workers & Pages → D1
- Browser Console (F12)

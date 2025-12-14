-- ============================================
-- TERALINK 관리자 대시보드 데이터베이스 스키마
-- Cloudflare D1
-- ============================================

-- 보안 로그 테이블
CREATE TABLE IF NOT EXISTS security_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  username TEXT,
  ip_address TEXT,
  timestamp TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_logs_type ON security_logs(type);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);

-- 지원서 테이블 (이미 존재한다면 수정)
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  discord TEXT NOT NULL,
  age INTEGER NOT NULL,
  active_time TEXT NOT NULL,
  reason TEXT NOT NULL,
  resolution TEXT NOT NULL,
  operation_experience TEXT NOT NULL,
  dev_experience TEXT NOT NULL,
  ip_address TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- 단축 URL 테이블 (이미 존재)
-- CREATE TABLE IF NOT EXISTS short_urls (
--   code TEXT PRIMARY KEY,
--   url TEXT NOT NULL,
--   password TEXT,
--   expires_at DATETIME NOT NULL,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- 접속 로그 테이블 (옵션)
CREATE TABLE IF NOT EXISTS access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_ip ON access_logs(ip_address);

-- 사용자 테이블 (관리자 및 일반 사용자)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  totp_secret TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 기본 설정 삽입
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('vpn_block_enabled', 'true');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('rate_limit_enabled', 'true');
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('maintenance_mode', 'false');

-- 기본 관리자 계정 생성 (비밀번호: admin)
-- SHA-256 해시: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
INSERT OR IGNORE INTO users (id, username, password_hash, totp_secret, role) 
VALUES (
  'admin-001',
  'admin',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  'JBSWY3DPEHPK3PXP',
  'admin'
);

-- 사용자 관리 테이블
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'user',
    totp_secret TEXT,
    is_active INTEGER DEFAULT 1,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 기본 사용자 추가 (admin, guest)
INSERT OR IGNORE INTO users (id, username, password_hash, email, role, totp_secret, is_active, created_at) 
VALUES 
    ('admin-001', 'admin', '3c0ef0d6e303d8d1a4e6b9d67841f20d17b366d74e9f3236c91a91680a4608ef', 'admin@teralink.store', 'admin', 'JBSWY3DPEHPK3PXP', 1, datetime('now')),
    ('guest-001', 'guest', '84983c60f7daadc1cb8698621f802c0d9f9a3c3c295c810748fb048115c186ec', 'guest@teralink.store', 'guest', 'GUEST_TOTP_BYPASS', 1, datetime('now'));

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

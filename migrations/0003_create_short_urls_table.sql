-- 단축 URL 관리 테이블
CREATE TABLE IF NOT EXISTS short_urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    password TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    created_by TEXT,
    clicks INTEGER DEFAULT 0,
    last_accessed TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_short_urls_code ON short_urls(code);
CREATE INDEX IF NOT EXISTS idx_short_urls_expires_at ON short_urls(expires_at);
CREATE INDEX IF NOT EXISTS idx_short_urls_created_at ON short_urls(created_at DESC);

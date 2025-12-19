-- 지원서 관리 테이블
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    age INTEGER NOT NULL,
    discord TEXT NOT NULL,
    active_time TEXT NOT NULL,
    reason TEXT NOT NULL,
    resolution TEXT NOT NULL,
    operation_experience TEXT NOT NULL,
    dev_experience TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    reviewed_by TEXT,
    reviewed_at TEXT,
    notes TEXT
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_discord ON applications(discord);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

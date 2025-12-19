-- 접속 통계 테이블
CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_address TEXT NOT NULL,
    page_url TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    country TEXT,
    city TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    session_id TEXT,
    response_time INTEGER
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_ip ON access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_access_logs_page ON access_logs(page_url);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON access_logs(DATE(timestamp));

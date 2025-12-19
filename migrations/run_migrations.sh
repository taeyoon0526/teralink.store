#!/bin/bash

# Cloudflare D1 데이터베이스 마이그레이션 스크립트
# 필요한 모든 테이블을 생성합니다

echo "🚀 Cloudflare D1 데이터베이스 마이그레이션 시작..."
echo ""

# 데이터베이스 ID
LOG_DB_ID="94662c07-c04c-45ab-8e9e-f12582bd73b8"
TERALINK_DB_ID="4109bd29-f148-494b-9668-f9c9f26a3975"

# LOG_DB (teralink_logs) 마이그레이션
echo "📦 LOG_DB (teralink_logs) 마이그레이션..."
echo "  - 지원서 테이블 생성..."
wrangler d1 execute teralink_logs --file=migrations/0002_create_applications_table.sql

echo "  - 단축 URL 테이블 생성..."
wrangler d1 execute teralink_logs --file=migrations/0003_create_short_urls_table.sql

echo "  - 보안 로그 테이블 생성..."
wrangler d1 execute teralink_logs --file=migrations/0004_create_security_logs_table.sql

echo "  - 접속 통계 테이블 생성..."
wrangler d1 execute teralink_logs --file=migrations/0005_create_access_logs_table.sql

echo ""
echo "📦 teralink_db (teralink-db) 마이그레이션..."
echo "  - 사용자 테이블 생성..."
wrangler d1 execute teralink-db --file=migrations/0001_create_users_table.sql

echo ""
echo "✅ 마이그레이션 완료!"
echo ""
echo "📊 테이블 확인:"
echo "  LOG_DB: applications, short_urls, security_logs, access_logs"
echo "  teralink_db: users"
echo ""
echo "👤 기본 사용자:"
echo "  - admin / 110526taeyoon! / TOTP"
echo "  - guest / guest / guest"

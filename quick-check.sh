#!/bin/bash

# Quick Security Header Check
# Usage: ./quick-check.sh

echo ""
echo "🔍 보안 헤더 빠른 확인 중..."
echo ""

DOMAIN="https://teralink.store"

# 1. CSP 확인
echo -n "1. Content-Security-Policy: "
if curl -sI "$DOMAIN" 2>/dev/null | grep -qi "content-security-policy"; then
    echo "✅ 존재"
else
    echo "❌ 없음"
fi

# 2. HSTS 확인
echo -n "2. Strict-Transport-Security: "
if curl -sI "$DOMAIN" 2>/dev/null | grep -qi "strict-transport-security"; then
    echo "✅ 존재"
else
    echo "❌ 없음"
fi

# 3. X-Frame-Options 확인
echo -n "3. X-Frame-Options: "
if curl -sI "$DOMAIN" 2>/dev/null | grep -qi "x-frame-options"; then
    echo "✅ 존재"
else
    echo "❌ 없음"
fi

# 4. X-Content-Type-Options 확인
echo -n "4. X-Content-Type-Options: "
if curl -sI "$DOMAIN" 2>/dev/null | grep -qi "x-content-type-options"; then
    echo "✅ 존재"
else
    echo "❌ 없음"
fi

# 5. Referrer-Policy 확인
echo -n "5. Referrer-Policy: "
if curl -sI "$DOMAIN" 2>/dev/null | grep -qi "referrer-policy"; then
    echo "✅ 존재"
else
    echo "❌ 없음"
fi

# 6. Permissions-Policy 확인
echo -n "6. Permissions-Policy: "
if curl -sI "$DOMAIN" 2>/dev/null | grep -qi "permissions-policy"; then
    echo "✅ 존재"
else
    echo "⚠️  없음 (선택사항)"
fi

echo ""
echo "📊 전체 헤더 보기:"
echo ""
curl -sI "$DOMAIN" 2>/dev/null | head -20

echo ""
echo "🌐 온라인 도구로 확인:"
echo "   https://securityheaders.com/?q=teralink.store"
echo ""

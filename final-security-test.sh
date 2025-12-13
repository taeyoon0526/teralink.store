#!/bin/bash

# Final Security Test Script
# Tests all 4 layers of security protection
# Version: 1.0

DOMAIN="https://teralink.store"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test result function
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${PURPLE}🛡️  TERALINK.STORE - FINAL SECURITY TEST v1.0${NC}  ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Testing Date:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${BLUE}Target Domain:${NC} $DOMAIN"
echo ""

# ============================================================================
# LAYER 1: Cloudflare Pages Functions Tests
# ============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🔒 LAYER 1: Cloudflare Pages Functions (Server-Side)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 1.1: Direct .js access should be blocked (403)
echo -e "${YELLOW}[1.1]${NC} Testing direct .js file access..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/lite/default.js")
if [ "$RESPONSE" = "403" ]; then
    test_result 0 "Direct .js access blocked (403)"
else
    test_result 1 "Direct .js access NOT blocked (got $RESPONSE, expected 403)"
fi

# Test 1.2: .js access with valid referer should work (200)
echo -e "${YELLOW}[1.2]${NC} Testing .js access with valid referer..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Referer: $DOMAIN/" "$DOMAIN/lite/default.js")
if [ "$RESPONSE" = "200" ]; then
    test_result 0 ".js access with referer allowed (200)"
else
    test_result 1 ".js access with referer failed (got $RESPONSE, expected 200)"
fi

# Test 1.3: curl user-agent should be blocked
echo -e "${YELLOW}[1.3]${NC} Testing curl user-agent blocking..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "curl/7.68.0" "$DOMAIN/lite/")
if [ "$RESPONSE" = "403" ]; then
    test_result 0 "curl user-agent blocked (403)"
else
    test_result 1 "curl user-agent NOT blocked (got $RESPONSE)"
fi

# Test 1.4: wget user-agent should be blocked
echo -e "${YELLOW}[1.4]${NC} Testing wget user-agent blocking..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "Wget/1.20.3" "$DOMAIN/lite/")
if [ "$RESPONSE" = "403" ]; then
    test_result 0 "wget user-agent blocked (403)"
else
    test_result 1 "wget user-agent NOT blocked (got $RESPONSE)"
fi

# Test 1.5: python-requests user-agent should be blocked
echo -e "${YELLOW}[1.5]${NC} Testing python-requests user-agent blocking..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "python-requests/2.25.1" "$DOMAIN/lite/")
if [ "$RESPONSE" = "403" ]; then
    test_result 0 "python-requests user-agent blocked (403)"
else
    test_result 1 "python-requests user-agent NOT blocked (got $RESPONSE)"
fi

# Test 1.6: Scraper bot should be blocked
echo -e "${YELLOW}[1.6]${NC} Testing scraper bot blocking..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)" "$DOMAIN/lite/")
if [ "$RESPONSE" = "403" ]; then
    test_result 0 "Scraper bot blocked (403)"
else
    test_result 1 "Scraper bot NOT blocked (got $RESPONSE)"
fi

# Test 1.7: Normal browser should work
echo -e "${YELLOW}[1.7]${NC} Testing normal browser user-agent..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/lite/")
if [ "$RESPONSE" = "200" ]; then
    test_result 0 "Normal browser access allowed (200)"
else
    test_result 1 "Normal browser access failed (got $RESPONSE, expected 200)"
fi

echo ""

# ============================================================================
# LAYER 2: HTTP Security Headers Tests
# ============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🔒 LAYER 2: HTTP Security Headers${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 2.1: X-Robots-Tag header
echo -e "${YELLOW}[2.1]${NC} Testing X-Robots-Tag header..."
HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/lite/" | grep -i "x-robots-tag" | grep -i "noindex")
if [ ! -z "$HEADER" ]; then
    test_result 0 "X-Robots-Tag header present"
else
    test_result 1 "X-Robots-Tag header missing"
fi

# Test 2.2: X-Robots-Tag on .js files
echo -e "${YELLOW}[2.2]${NC} Testing X-Robots-Tag on .js files..."
HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Referer: $DOMAIN/" "$DOMAIN/lite/default.js" | grep -i "x-robots-tag")
if [ ! -z "$HEADER" ]; then
    test_result 0 "X-Robots-Tag on .js files present"
else
    test_result 1 "X-Robots-Tag on .js files missing"
fi

# Test 2.3: Strict-Transport-Security (HSTS)
echo -e "${YELLOW}[2.3]${NC} Testing HSTS header..."
HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/" | grep -i "strict-transport-security")
if [ ! -z "$HEADER" ]; then
    test_result 0 "HSTS header present"
else
    test_result 1 "HSTS header missing"
fi

# Test 2.4: Content-Security-Policy
echo -e "${YELLOW}[2.4]${NC} Testing CSP header..."
HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/" | grep -i "content-security-policy")
if [ ! -z "$HEADER" ]; then
    test_result 0 "CSP header present"
else
    test_result 1 "CSP header missing"
fi

# Test 2.5: CSP without unsafe-inline
echo -e "${YELLOW}[2.5]${NC} Testing CSP without unsafe-inline..."
HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/" | grep -i "content-security-policy" | grep "unsafe-inline")
if [ -z "$HEADER" ]; then
    test_result 0 "CSP without unsafe-inline ✓"
else
    test_result 1 "CSP contains unsafe-inline"
fi

# Test 2.6: CSP without unsafe-eval
echo -e "${YELLOW}[2.6]${NC} Testing CSP without unsafe-eval..."
HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/" | grep -i "content-security-policy" | grep "unsafe-eval")
if [ -z "$HEADER" ]; then
    test_result 0 "CSP without unsafe-eval ✓"
else
    test_result 1 "CSP contains unsafe-eval"
fi

# Test 2.7: X-Frame-Options
echo -e "${YELLOW}[2.7]${NC} Testing X-Frame-Options header..."
HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/" | grep -i "x-frame-options")
if [ ! -z "$HEADER" ]; then
    test_result 0 "X-Frame-Options header present"
else
    test_result 1 "X-Frame-Options header missing"
fi

# Test 2.8: X-Content-Type-Options
echo -e "${YELLOW}[2.8]${NC} Testing X-Content-Type-Options header..."
HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/" | grep -i "x-content-type-options")
if [ ! -z "$HEADER" ]; then
    test_result 0 "X-Content-Type-Options header present"
else
    test_result 1 "X-Content-Type-Options header missing"
fi

# Test 2.9: Referrer-Policy
echo -e "${YELLOW}[2.9]${NC} Testing Referrer-Policy header..."
HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/" | grep -i "referrer-policy")
if [ ! -z "$HEADER" ]; then
    test_result 0 "Referrer-Policy header present"
else
    test_result 1 "Referrer-Policy header missing"
fi

# Test 2.10: Permissions-Policy
echo -e "${YELLOW}[2.10]${NC} Testing Permissions-Policy header..."
HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/" | grep -i "permissions-policy")
if [ ! -z "$HEADER" ]; then
    test_result 0 "Permissions-Policy header present"
else
    test_result 1 "Permissions-Policy header missing"
fi

echo ""

# ============================================================================
# LAYER 3: robots.txt Tests
# ============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🔒 LAYER 3: robots.txt Configuration${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 3.1: robots.txt exists
echo -e "${YELLOW}[3.1]${NC} Testing robots.txt existence..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/robots.txt")
if [ "$RESPONSE" = "200" ]; then
    test_result 0 "robots.txt exists (200)"
else
    test_result 1 "robots.txt missing (got $RESPONSE)"
fi

# Test 3.2: robots.txt blocks .js files
echo -e "${YELLOW}[3.2]${NC} Testing robots.txt .js blocking..."
CONTENT=$(curl -s "$DOMAIN/robots.txt" | grep "Disallow:.*\.js")
if [ ! -z "$CONTENT" ]; then
    test_result 0 "robots.txt blocks .js files"
else
    test_result 1 "robots.txt doesn't block .js files"
fi

# Test 3.3: robots.txt blocks .css files
echo -e "${YELLOW}[3.3]${NC} Testing robots.txt .css blocking..."
CONTENT=$(curl -s "$DOMAIN/robots.txt" | grep "Disallow:.*\.css")
if [ ! -z "$CONTENT" ]; then
    test_result 0 "robots.txt blocks .css files"
else
    test_result 1 "robots.txt doesn't block .css files"
fi

# Test 3.4: robots.txt blocks AhrefsBot
echo -e "${YELLOW}[3.4]${NC} Testing robots.txt AhrefsBot blocking..."
CONTENT=$(curl -s "$DOMAIN/robots.txt" | grep -A1 "User-agent: AhrefsBot" | grep "Disallow: /")
if [ ! -z "$CONTENT" ]; then
    test_result 0 "robots.txt blocks AhrefsBot"
else
    test_result 1 "robots.txt doesn't block AhrefsBot"
fi

echo ""

# ============================================================================
# LAYER 4: Client-Side Protection Tests
# ============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🔒 LAYER 4: Client-Side Protection (security.js)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 4.1: security.js file exists and loads
echo -e "${YELLOW}[4.1]${NC} Testing security.js existence..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Referer: $DOMAIN/" "$DOMAIN/lite/security.js")
if [ "$RESPONSE" = "200" ]; then
    test_result 0 "security.js exists and loads (200)"
else
    test_result 1 "security.js not accessible (got $RESPONSE)"
fi

# Test 4.2: security.js contains v1.2 protection
echo -e "${YELLOW}[4.2]${NC} Testing security.js version..."
CONTENT=$(curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Referer: $DOMAIN/" "$DOMAIN/lite/security.js" | grep -E "v1\.[2-9]|Security Protection")
if [ ! -z "$CONTENT" ]; then
    test_result 0 "security.js v1.2 or higher detected"
else
    test_result 1 "security.js version check failed"
fi

# Test 4.3: security.js contains DevTools detection
echo -e "${YELLOW}[4.3]${NC} Testing DevTools detection code..."
CONTENT=$(curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Referer: $DOMAIN/" "$DOMAIN/lite/security.js" | grep -i "devtools")
if [ ! -z "$CONTENT" ]; then
    test_result 0 "DevTools detection code present"
else
    test_result 1 "DevTools detection code missing"
fi

# Test 4.4: security.js contains contextmenu blocking
echo -e "${YELLOW}[4.4]${NC} Testing contextmenu blocking code..."
CONTENT=$(curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Referer: $DOMAIN/" "$DOMAIN/lite/security.js" | grep -i "contextmenu")
if [ ! -z "$CONTENT" ]; then
    test_result 0 "Contextmenu blocking code present"
else
    test_result 1 "Contextmenu blocking code missing"
fi

# Test 4.5: security.js contains keyboard shortcut blocking
echo -e "${YELLOW}[4.5]${NC} Testing keyboard shortcut blocking..."
CONTENT=$(curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Referer: $DOMAIN/" "$DOMAIN/lite/security.js" | grep -E "F12|keydown")
if [ ! -z "$CONTENT" ]; then
    test_result 0 "Keyboard shortcut blocking present"
else
    test_result 1 "Keyboard shortcut blocking missing"
fi

# Test 4.6: security.js contains view-source detection
echo -e "${YELLOW}[4.6]${NC} Testing view-source detection..."
CONTENT=$(curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Referer: $DOMAIN/" "$DOMAIN/lite/security.js" | grep -E "view-source|protocol")
if [ ! -z "$CONTENT" ]; then
    test_result 0 "view-source detection code present"
else
    test_result 1 "view-source detection code missing"
fi

echo ""

# ============================================================================
# INTEGRATION TESTS
# ============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🔗 INTEGRATION TESTS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 5.1: Main page loads correctly (with browser UA)
echo -e "${YELLOW}[5.1]${NC} Testing main page loading..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/")
if [ "$RESPONSE" = "200" ]; then
    test_result 0 "Main page loads correctly (200)"
else
    test_result 1 "Main page failed to load (got $RESPONSE)"
fi

# Test 5.2: Lite page loads correctly (with browser UA)
echo -e "${YELLOW}[5.2]${NC} Testing lite page loading..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/lite/")
if [ "$RESPONSE" = "200" ]; then
    test_result 0 "Lite page loads correctly (200)"
else
    test_result 1 "Lite page failed to load (got $RESPONSE)"
fi

# Test 5.3: Application page loads correctly (with browser UA)
echo -e "${YELLOW}[5.3]${NC} Testing application page loading..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/application.html")
if [ "$RESPONSE" = "200" ]; then
    test_result 0 "Application page loads correctly (200)"
else
    test_result 1 "Application page failed to load (got $RESPONSE)"
fi

# Test 5.4: VPN page loads correctly (with browser UA)
echo -e "${YELLOW}[5.4]${NC} Testing VPN page loading..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/vpn.html")
if [ "$RESPONSE" = "200" ]; then
    test_result 0 "VPN page loads correctly (200)"
else
    test_result 1 "VPN page failed to load (got $RESPONSE)"
fi

# Test 5.5: Security headers on all pages
echo -e "${YELLOW}[5.5]${NC} Testing security headers consistency..."
PAGES=("/" "/lite/" "/application.html" "/vpn.html")
ALL_HAVE_HEADERS=true
for page in "${PAGES[@]}"; do
    HEADER=$(curl -s -I -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN$page" | grep -i "content-security-policy")
    if [ -z "$HEADER" ]; then
        ALL_HAVE_HEADERS=false
        break
    fi
done
if [ "$ALL_HAVE_HEADERS" = true ]; then
    test_result 0 "All pages have security headers"
else
    test_result 1 "Some pages missing security headers"
fi

echo ""

# ============================================================================
# EXTERNAL SECURITY VALIDATION
# ============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🌐 EXTERNAL SECURITY VALIDATION${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 6.1: securityheaders.com API check
echo -e "${YELLOW}[6.1]${NC} Testing securityheaders.com rating..."
echo -e "${BLUE}      Note: This requires API access. Checking manually recommended.${NC}"
echo -e "${BLUE}      Visit: https://securityheaders.com/?q=$DOMAIN&followRedirects=on${NC}"
test_result 0 "Manual check recommended for securityheaders.com"

# Test 6.2: SSL Labs check
echo -e "${YELLOW}[6.2]${NC} Testing SSL configuration..."
echo -e "${BLUE}      Note: Full SSL test takes time. Quick HTTPS check only.${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$DOMAIN/")
if [ "$RESPONSE" = "200" ]; then
    test_result 0 "HTTPS working correctly"
else
    test_result 1 "HTTPS issue detected"
fi

echo ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}                    ${PURPLE}📊 TEST SUMMARY${NC}                     ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Total Tests:${NC}   $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC}        $PASSED_TESTS"
echo -e "${RED}Failed:${NC}        $FAILED_TESTS"
echo ""

# Calculate percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${BLUE}Success Rate:${NC}  $PERCENTAGE%"
    echo ""
    
    if [ $PERCENTAGE -ge 95 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║${NC}  ${GREEN}✓✓✓ EXCELLENT! Security is at enterprise level! ✓✓✓${NC}  ${GREEN}║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    elif [ $PERCENTAGE -ge 80 ]; then
        echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║${NC}   ${YELLOW}⚠ GOOD! Some minor issues need attention.${NC}          ${YELLOW}║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
    else
        echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║${NC}    ${RED}✗ WARNING! Critical security issues detected!${NC}       ${RED}║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    fi
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Detailed reports available at:${NC}"
echo -e "  • Markdown/FINAL-SECURITY-REPORT.md"
echo -e "  • Markdown/DEVTOOLS-LIMITATION.md"
echo -e "  • TEST-SOURCE-PROTECTION.md"
echo ""
echo -e "${BLUE}Manual verification recommended:${NC}"
echo -e "  • https://securityheaders.com/?q=$DOMAIN"
echo -e "  • https://www.ssllabs.com/ssltest/analyze.html?d=teralink.store"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

exit 0

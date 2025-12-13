#!/bin/bash

# Security Test Script for teralink.store
# Created: 2025-12-14
# Purpose: 보안 헤더, 파일 무결성, 설정 검증

# set -e 제거: 오류 시에도 계속 진행

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 아이콘
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
ROCKET="🚀"
LOCK="🔒"

# 설정
DOMAIN="https://teralink.store"
LOCAL_PATH="/home/taeyoon_0526/Documents/teralink.store"

# 테스트 결과 카운터
PASSED=0
FAILED=0
WARNINGS=0

# 헤더 출력
print_header() {
    echo ""
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 성공 메시지
print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
    ((PASSED++))
}

# 실패 메시지
print_fail() {
    echo -e "${RED}${CROSS} $1${NC}"
    ((FAILED++))
}

# 경고 메시지
print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
    ((WARNINGS++))
}

# 정보 메시지
print_info() {
    echo -e "${CYAN}${INFO} $1${NC}"
}

# 진행 상황
print_progress() {
    echo -e "${BLUE}⏳ $1...${NC}"
}

# 구분선
print_separator() {
    echo -e "${BLUE}──────────────────────────────────────────────────────────${NC}"
}

#############################################
# 1. 환경 체크
#############################################
check_environment() {
    print_header "1. 환경 체크 ${ROCKET}"
    
    # curl 설치 확인
    if command -v curl &> /dev/null; then
        print_success "curl 설치됨"
    else
        print_fail "curl 미설치 (설치 필요: sudo apt install curl)"
        return 1
    fi
    
    # git 설치 확인
    if command -v git &> /dev/null; then
        print_success "git 설치됨"
    else
        print_warning "git 미설치"
    fi
    
    # 작업 디렉토리 확인
    if [ -d "$LOCAL_PATH" ]; then
        print_success "작업 디렉토리 존재: $LOCAL_PATH"
    else
        print_fail "작업 디렉토리 없음: $LOCAL_PATH"
        return 1
    fi
    
    # 인터넷 연결 확인
    print_progress "인터넷 연결 확인"
    if curl -s --head --request GET https://www.google.com 2>/dev/null | grep "200 OK" > /dev/null; then
        print_success "인터넷 연결 정상"
    else
        print_warning "인터넷 연결 실패 (일부 테스트 제한됨)"
    fi
    
    print_separator
}

#############################################
# 2. 로컬 파일 무결성 체크
#############################################
check_local_files() {
    print_header "2. 로컬 파일 무결성 체크 ${LOCK}"
    
    cd "$LOCAL_PATH"
    
    # 필수 파일 존재 확인
    local required_files=(
        "lite/security.js"
        "lite/default.js"
        "lite/index.html"
        "index.html"
        "_headers"
        "package.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "파일 존재: $file"
        else
            print_fail "파일 없음: $file"
        fi
    done
    
    # security.js 버전 확인
    if grep -q "Security Protection v1.1" lite/security.js; then
        print_success "security.js 버전: v1.1"
    else
        print_warning "security.js 버전 확인 필요"
    fi
    
    # default.js 버전 확인
    if grep -q "Visitor Tracking v1.0" lite/default.js; then
        print_success "default.js 버전: v1.0"
    else
        print_warning "default.js 버전 확인 필요"
    fi
    
    # _headers 파일 내용 확인
    print_progress "보안 헤더 파일 검증"
    if grep -q "Content-Security-Policy" _headers; then
        print_success "_headers에 CSP 포함됨"
    else
        print_fail "_headers에 CSP 없음"
    fi
    
    if grep -q "Strict-Transport-Security" _headers; then
        print_success "_headers에 HSTS 포함됨"
    else
        print_fail "_headers에 HSTS 없음"
    fi
    
    if grep -q "X-Frame-Options" _headers; then
        print_success "_headers에 X-Frame-Options 포함됨"
    else
        print_fail "_headers에 X-Frame-Options 없음"
    fi
    
    print_separator
}

#############################################
# 3. Git 상태 확인
#############################################
check_git_status() {
    print_header "3. Git 저장소 상태 ${INFO}"
    
    cd "$LOCAL_PATH"
    
    if [ -d ".git" ]; then
        print_success "Git 저장소 초기화됨"
        
        # 현재 브랜치
        current_branch=$(git branch --show-current)
        print_info "현재 브랜치: $current_branch"
        
        # 변경사항 확인
        if git diff --quiet && git diff --cached --quiet; then
            print_success "작업 디렉토리 깨끗함 (변경사항 없음)"
        else
            print_warning "커밋되지 않은 변경사항 있음"
            git status --short
        fi
        
        # 원격 저장소와 동기화 상태
        print_progress "원격 저장소 동기화 상태 확인"
        if git fetch origin 2>/dev/null; then
            LOCAL=$(git rev-parse @ 2>/dev/null)
            REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
            
            if [ -z "$REMOTE" ]; then
                print_warning "원격 브랜치 정보 없음 (네트워크 오류?)"
            elif [ "$LOCAL" = "$REMOTE" ]; then
                print_success "로컬과 원격 저장소 동기화됨"
            else
                print_warning "로컬과 원격 저장소 차이 있음 (push 필요)"
            fi
        else
            print_warning "원격 저장소 접근 실패 (네트워크 확인 필요)"
        fi
    else
        print_fail "Git 저장소 아님"
    fi
    
    print_separator
}

#############################################
# 4. 원격 보안 헤더 테스트
#############################################
check_remote_headers() {
    print_header "4. 원격 보안 헤더 테스트 ${LOCK}"
    
    print_progress "도메인 접속 테스트: $DOMAIN"
    
    # HTTP 응답 확인
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN")
    
    if [ "$http_code" = "200" ]; then
        print_success "도메인 접속 성공 (HTTP $http_code)"
    else
        print_fail "도메인 접속 실패 (HTTP $http_code)"
        return
    fi
    
    # 헤더 가져오기
    headers=$(curl -sI "$DOMAIN")
    
    # CSP 확인
    if echo "$headers" | grep -qi "content-security-policy"; then
        print_success "Content-Security-Policy 헤더 존재"
    else
        print_fail "Content-Security-Policy 헤더 없음"
    fi
    
    # HSTS 확인
    if echo "$headers" | grep -qi "strict-transport-security"; then
        print_success "Strict-Transport-Security 헤더 존재"
    else
        print_fail "Strict-Transport-Security 헤더 없음"
    fi
    
    # X-Frame-Options 확인
    if echo "$headers" | grep -qi "x-frame-options"; then
        print_success "X-Frame-Options 헤더 존재"
    else
        print_fail "X-Frame-Options 헤더 없음"
    fi
    
    # X-Content-Type-Options 확인
    if echo "$headers" | grep -qi "x-content-type-options"; then
        print_success "X-Content-Type-Options 헤더 존재"
    else
        print_fail "X-Content-Type-Options 헤더 없음"
    fi
    
    # Referrer-Policy 확인
    if echo "$headers" | grep -qi "referrer-policy"; then
        print_success "Referrer-Policy 헤더 존재"
    else
        print_warning "Referrer-Policy 헤더 없음 (선택사항)"
    fi
    
    # Permissions-Policy 확인
    if echo "$headers" | grep -qi "permissions-policy"; then
        print_success "Permissions-Policy 헤더 존재"
    else
        print_warning "Permissions-Policy 헤더 없음 (선택사항)"
    fi
    
    print_separator
}

#############################################
# 5. JavaScript 파일 접근 테스트
#############################################
check_js_files() {
    print_header "5. JavaScript 파일 접근 테스트 ${INFO}"
    
    # security.js 접근
    print_progress "security.js 접근 확인"
    sec_code=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/lite/security.js")
    if [ "$sec_code" = "200" ]; then
        print_success "lite/security.js 접근 가능 (HTTP $sec_code)"
    else
        print_fail "lite/security.js 접근 불가 (HTTP $sec_code)"
    fi
    
    # default.js 접근
    print_progress "default.js 접근 확인"
    def_code=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/lite/default.js")
    if [ "$def_code" = "200" ]; then
        print_success "lite/default.js 접근 가능 (HTTP $def_code)"
    else
        print_fail "lite/default.js 접근 불가 (HTTP $def_code)"
    fi
    
    # 버전 확인
    print_progress "배포된 security.js 버전 확인"
    remote_sec=$(curl -s "$DOMAIN/lite/security.js")
    if echo "$remote_sec" | grep -q "Security Protection v1.1"; then
        print_success "원격 security.js 버전: v1.1"
    else
        print_warning "원격 security.js 버전 확인 필요 (최신 버전 아닐 수 있음)"
    fi
    
    print_separator
}

#############################################
# 6. HTML 페이지 테스트
#############################################
check_html_pages() {
    print_header "6. HTML 페이지 접근 테스트 ${INFO}"
    
    local pages=(
        "/"
        "/lite/"
        "/hacking/"
        "/application.html"
        "/vpn.html"
    )
    
    for page in "${pages[@]}"; do
        print_progress "테스트: $page"
        page_code=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$page")
        if [ "$page_code" = "200" ]; then
            print_success "$page (HTTP $page_code)"
        else
            print_fail "$page (HTTP $page_code)"
        fi
    done
    
    print_separator
}

#############################################
# 7. 보안 등급 체크 (securityheaders.com API)
#############################################
check_security_grade() {
    print_header "7. 보안 등급 체크 ${LOCK}"
    
    print_info "온라인 도구로 확인하세요:"
    echo -e "  ${CYAN}https://securityheaders.com/?q=$DOMAIN${NC}"
    echo -e "  ${CYAN}https://observatory.mozilla.org/analyze/$DOMAIN${NC}"
    
    print_separator
}

#############################################
# 8. Discord Webhook 테스트 (선택사항)
#############################################
check_discord_webhook() {
    print_header "8. Discord Webhook 설정 확인 ${INFO}"
    
    # default.js에서 webhook URL 개수 확인
    webhook_count=$(grep -o "https://discord.com/api/webhooks/" "$LOCAL_PATH/lite/default.js" | wc -l)
    
    if [ "$webhook_count" -ge 2 ]; then
        print_success "Discord Webhook URL $webhook_count 개 설정됨"
    elif [ "$webhook_count" -eq 1 ]; then
        print_warning "Discord Webhook URL 1개만 설정됨 (중복 권장)"
    else
        print_fail "Discord Webhook URL 설정 안 됨"
    fi
    
    # IPv4 우선 설정 확인
    if grep -q "info.primary = info.ipv4 || info.ipv6" "$LOCAL_PATH/lite/default.js"; then
        print_success "IPv4 우선 설정됨"
    else
        print_warning "IPv6 우선 설정됨 (ipapi.co 지연 가능)"
    fi
    
    print_separator
}

#############################################
# 9. 파일 크기 및 성능 체크
#############################################
check_performance() {
    print_header "9. 파일 크기 및 성능 체크 ${ROCKET}"
    
    cd "$LOCAL_PATH"
    
    # security.js 크기
    if [ -f "lite/security.js" ]; then
        sec_size=$(wc -c < "lite/security.js")
        sec_size_kb=$((sec_size / 1024))
        if [ "$sec_size_kb" -lt 10 ]; then
            print_success "security.js 크기: ${sec_size_kb}KB (최적)"
        else
            print_warning "security.js 크기: ${sec_size_kb}KB (큼)"
        fi
    fi
    
    # default.js 크기
    if [ -f "lite/default.js" ]; then
        def_size=$(wc -c < "lite/default.js")
        def_size_kb=$((def_size / 1024))
        if [ "$def_size_kb" -lt 15 ]; then
            print_success "default.js 크기: ${def_size_kb}KB (최적)"
        else
            print_warning "default.js 크기: ${def_size_kb}KB (큼)"
        fi
    fi
    
    print_separator
}

#############################################
# 10. 최종 요약
#############################################
print_summary() {
    print_header "테스트 결과 요약 ${ROCKET}"
    
    local total=$((PASSED + FAILED + WARNINGS))
    
    echo ""
    echo -e "${GREEN}${BOLD}✅ 통과: $PASSED${NC}"
    echo -e "${RED}${BOLD}❌ 실패: $FAILED${NC}"
    echo -e "${YELLOW}${BOLD}⚠️  경고: $WARNINGS${NC}"
    echo -e "${BLUE}${BOLD}📊 총합: $total${NC}"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}${BOLD}${CHECK} 모든 필수 테스트 통과!${NC}"
        echo -e "${CYAN}${INFO} 권장사항: 경고 항목 검토 후 배포하세요.${NC}"
    else
        echo -e "${RED}${BOLD}${CROSS} 일부 테스트 실패!${NC}"
        echo -e "${YELLOW}${WARNING} 실패한 항목을 수정 후 다시 테스트하세요.${NC}"
    fi
    
    echo ""
    print_separator
    
    # 다음 단계 안내
    echo ""
    echo -e "${CYAN}${BOLD}다음 단계:${NC}"
    echo ""
    
    if [ $FAILED -gt 0 ]; then
        echo -e "1. ${RED}실패한 항목 수정${NC}"
        echo -e "2. ${BLUE}./security-test.sh 재실행${NC}"
    else
        echo -e "1. ${YELLOW}경고 항목 검토 (선택사항)${NC}"
        echo -e "2. ${GREEN}git add . && git commit -m \"feat: Security v1.1\"${NC}"
        echo -e "3. ${GREEN}git push origin main${NC}"
        echo -e "4. ${CYAN}Cloudflare Pages 배포 확인 (3-5분 소요)${NC}"
        echo -e "5. ${BLUE}실제 사이트 테스트 ($DOMAIN)${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

#############################################
# 메인 실행
#############################################
main() {
    clear
    
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║        🔒 Security Test Script for teralink.store       ║"
    echo "║                                                          ║"
    echo "║                    Version 1.0.0                         ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    sleep 1
    
    # 모든 테스트 실행
    check_environment
    check_local_files
    check_git_status
    check_remote_headers
    check_js_files
    check_html_pages
    check_security_grade
    check_discord_webhook
    check_performance
    
    # 최종 요약
    print_summary
}

# 스크립트 실행
main

# Cloudflare Pages _headers 문제 해결 가이드

## 문제: 보안 헤더가 적용되지 않음

테스트 결과:
- ❌ Content-Security-Policy 헤더 없음
- ❌ Strict-Transport-Security 헤더 없음  
- ❌ X-Frame-Options 헤더 없음

## 해결 방법 1: Cloudflare Pages 설정 확인

### 1-1. Build 설정 확인
Cloudflare Dashboard > Workers & Pages > teralink.store > Settings > Builds and deployments

**설정값:**
- **Build output directory**: `/` 또는 비워두기
- **Root directory**: `/` 또는 비워두기
- **Build command**: 없음 (정적 사이트)

### 1-2. 재배포
1. Cloudflare Dashboard > Deployments
2. "Retry deployment" 클릭
3. 5분 대기
4. `./security-test.sh` 재실행

## 해결 방법 2: _headers 파일 이름 확인

```bash
# 파일 이름 정확히 확인
ls -la /home/taeyoon_0526/Documents/teralink.store/_headers

# 올바른 이름:
# _headers (언더스코어로 시작, 확장자 없음)
```

## 해결 방법 3: Cloudflare Transform Rules (대안)

_headers가 작동 안 하면 Cloudflare Dashboard에서 직접 설정:

1. Cloudflare Dashboard 접속
2. 도메인 선택 (teralink.store)
3. **Rules > Transform Rules > Modify Response Header**
4. "Create rule" 클릭
5. 다음 헤더 추가:

```
Rule name: Security Headers

If: Hostname equals teralink.store

Then:
- Set static header: Content-Security-Policy
  Value: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://ipapi.co https://www.cloudflare.com https://1.1.1.1 https://api.ipify.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://ipapi.co https://www.cloudflare.com https://api.ipify.org https://discord.com; frame-ancestors 'none';

- Set static header: Strict-Transport-Security
  Value: max-age=31536000; includeSubDomains; preload

- Set static header: X-Frame-Options
  Value: DENY

- Set static header: X-Content-Type-Options
  Value: nosniff

- Set static header: Referrer-Policy
  Value: strict-origin-when-cross-origin

- Set static header: Permissions-Policy
  Value: geolocation=(), microphone=(), camera=()
```

6. "Deploy" 클릭

## 해결 방법 4: 캐시 퍼지

헤더가 추가되어도 캐시 때문에 안 보일 수 있음:

1. Cloudflare Dashboard > Caching > Configuration
2. "Purge Everything" 클릭
3. 5분 대기
4. `./security-test.sh` 재실행

## 검증 방법

```bash
# 1. 터미널에서 확인
curl -I https://teralink.store | grep -i "content-security-policy"
curl -I https://teralink.store | grep -i "strict-transport-security"
curl -I https://teralink.store | grep -i "x-frame-options"

# 2. 테스트 스크립트 재실행
./security-test.sh

# 3. 온라인 도구 확인
# https://securityheaders.com/?q=teralink.store
```

## 우선순위

1. **가장 먼저**: Cloudflare Pages "Retry deployment" 클릭
2. **그래도 안 되면**: Transform Rules로 헤더 직접 추가
3. **마지막**: 캐시 퍼지

## 참고

- Cloudflare Pages는 `_headers` 파일을 **빌드 출력 디렉토리 루트**에서 찾음
- GitHub Pages와 달리 Cloudflare는 빌드 과정을 거침
- Build output directory가 `/`가 아니면 `_headers`가 무시될 수 있음

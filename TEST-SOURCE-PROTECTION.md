# 🧪 소스 코드 보호 테스트 가이드

## ⏰ 배포 대기 시간
```
✅ GitHub에 푸시 완료: 11fa682
⏳ Cloudflare Pages 자동 배포 중...
⏱️ 대기 시간: 3-5분

배포 상태 확인:
https://dash.cloudflare.com/
→ Pages → teralink-store → Deployments
```

---

## 🧪 테스트 시나리오 (5분 후)

### 1️⃣ view-source 차단 테스트

#### 브라우저 주소창에 입력:
```
view-source:https://teralink.store/lite/
```

#### 예상 결과:
```
❌ 403 Forbidden (Cloudflare Functions 차단)
또는
🔄 Google로 자동 리다이렉트 (security.js 차단)
```

#### 실제 테스트:
1. Chrome/Edge 주소창에 `view-source:https://teralink.store/lite/` 입력
2. Enter 키 누르기
3. 결과 확인:
   - ✅ 차단되면 성공
   - ❌ 소스 보이면 실패

---

### 2️⃣ 직접 .js 접근 차단 테스트

#### 브라우저에서 직접 접근:
```
https://teralink.store/lite/default.js
https://teralink.store/lite/script.js
https://teralink.store/lite/security.js
```

#### 예상 결과:
```
❌ 403 Forbidden
Access Denied - Direct file access is not allowed
```

#### 실제 테스트:
1. 새 탭에서 위 URL 입력
2. Enter 키
3. **403 에러 페이지**가 나오면 ✅ 성공

---

### 3️⃣ curl 차단 테스트

```bash
# 터미널에서 실행
curl https://teralink.store/lite/default.js

# 예상 출력:
# 403 Forbidden
```

#### 실제 테스트:
```bash
cd /home/taeyoon_0526/Documents/teralink.store
curl -I https://teralink.store/lite/default.js
```

#### 예상 헤더:
```
HTTP/2 403
content-type: text/plain
```

✅ 403 상태 코드면 성공

---

### 4️⃣ wget 차단 테스트

```bash
wget https://teralink.store/lite/default.js

# 예상 출력:
# HTTP request sent, awaiting response... 403 Forbidden
```

---

### 5️⃣ Python requests 차단 테스트

```bash
python3 -c "import requests; r = requests.get('https://teralink.store/lite/default.js'); print(f'Status: {r.status_code}')"

# 예상 출력:
# Status: 403
```

---

### 6️⃣ 정상 페이지에서 .js 로드 확인

#### 브라우저에서 정상 접근:
```
https://teralink.store/lite/
```

#### 예상 결과:
```
✅ 페이지 정상 로드
✅ default.js 스크립트 실행됨
✅ 애니메이션 작동
✅ 콘솔에 에러 없음
```

#### 실제 테스트:
1. https://teralink.store/lite/ 접속
2. F12 → Console 탭
3. 에러 메시지 확인:
   - ✅ 에러 없으면 성공
   - ❌ "Failed to load" 에러 있으면 실패

---

### 7️⃣ Referer 헤더 테스트 (고급)

```bash
# Referer 없이 (차단됨)
curl -I https://teralink.store/lite/default.js
# 예상: 403

# Referer 있으면 (허용)
curl -I -H "Referer: https://teralink.store/" https://teralink.store/lite/default.js
# 예상: 200
```

---

### 8️⃣ 검색 엔진 차단 확인

#### Google Search Console 확인:
```
1. https://search.google.com/search-console
2. URL 검사 도구
3. 입력: https://teralink.store/lite/default.js
4. 예상: "차단됨 (robots.txt)" 또는 "인덱싱 안 됨"
```

#### robots.txt 직접 확인:
```
https://teralink.store/robots.txt
```

예상 내용:
```txt
User-agent: *
Disallow: /*.js$
Disallow: /*.css$
...
```

---

### 9️⃣ HTTP 헤더 확인

```bash
curl -I https://teralink.store/lite/default.js

# 예상 헤더:
# X-Robots-Tag: noindex, nofollow, noarchive
# Cache-Control: private, no-cache, no-store, must-revalidate
```

---

### 🔟 자동화 테스트 (종합)

```bash
cd /home/taeyoon_0526/Documents/teralink.store

# 5분 후 실행
./security-test.sh

# 예상 결과:
# ✅ A+ Security Grade
# ✅ 35 tests passed
# ✅ 0 tests failed
```

---

## 📊 테스트 체크리스트

배포 후 아래 항목을 하나씩 체크하세요:

```
[ ] 1. view-source: 차단됨
[ ] 2. 직접 .js 접근 차단됨 (403)
[ ] 3. curl 차단됨 (403)
[ ] 4. wget 차단됨 (403)
[ ] 5. Python requests 차단됨 (403)
[ ] 6. 정상 페이지는 잘 작동함
[ ] 7. Referer 있으면 .js 로드됨
[ ] 8. robots.txt 확인됨
[ ] 9. HTTP 헤더 올바름
[ ] 10. security-test.sh 통과

---
총 10개 중 통과: ____개
```

---

## ⚠️ 트러블슈팅

### 문제 1: 여전히 .js 파일이 열림
```
원인: Cloudflare 캐시 때문일 수 있음

해결:
1. Cloudflare 대시보드 로그인
2. Caching → Configuration
3. "Purge Everything" 클릭
4. 5분 대기 후 재테스트
```

### 문제 2: 정상 페이지도 .js 못 불러옴
```
원인: _middleware.js의 Referer 체크가 너무 엄격

해결:
functions/_middleware.js 수정:
- validReferers 배열 확인
- teralink.store가 포함되어 있는지 확인
```

### 문제 3: 403 에러 대신 빈 페이지
```
원인: Functions가 아직 배포 안 됨

해결:
1. Cloudflare Pages 배포 로그 확인
2. Functions 탭에서 _middleware 활성화 확인
3. 10분 대기 후 재테스트
```

### 문제 4: security-test.sh 실패
```
원인: 테스트 스크립트가 새 보호 기능 모름

해결:
./security-test.sh 업데이트 필요 (선택사항)
또는 수동으로 위 테스트 수행
```

---

## 🎯 성공 기준

### ✅ 완벽한 성공
```
✅ view-source 차단
✅ 직접 .js 접근 차단
✅ curl/wget 차단
✅ 정상 페이지 작동
✅ A+ 등급 유지
```

### ⚠️ 부분 성공
```
✅ 정상 페이지 작동
⚠️ 일부 차단 안 됨

→ Cloudflare 캐시 퍼지 필요
→ 10분 더 대기
```

### ❌ 실패
```
❌ 정상 페이지도 안 열림
❌ 모든 .js 로드 실패

→ functions/_middleware.js 비활성화
→ git revert 고려
```

---

## 📞 긴급 롤백

만약 사이트가 완전히 망가졌다면:

```bash
cd /home/taeyoon_0526/Documents/teralink.store

# 이전 커밋으로 되돌리기
git revert 11fa682

# 푸시
git push origin main

# Cloudflare에서 5분 후 자동 복구됨
```

---

## 🎊 테스트 완료 후

모든 테스트를 통과했다면:

```
🎉 축하합니다!

✅ 소스 코드 보호 완벽하게 작동
✅ view-source 차단 성공
✅ 직접 .js 접근 차단 성공
✅ 봇/크롤러 차단 성공
✅ 정상 페이지는 완벽 작동

teralink.store는 이제 엔터프라이즈급 보안을 갖췄습니다!
```

---

작성일: 2025-12-14
테스트 대상: Commit 11fa682
예상 배포 시간: 3-5분

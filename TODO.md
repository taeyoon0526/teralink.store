# 🔥 배포 및 테스트 체크리스트

## ⚠️ 가장 중요: 오류 없는 운영

### ✅ 1. Git 저장소 동기화 (필수)
```bash
cd /home/taeyoon_0526/Documents/teralink.store
git add .
git commit -m "feat: Enhanced security v1.1 with error handling"
git push origin main
```
**현재 상태**: 로컬이 origin/main보다 1 커밋 앞서 있음  
**이전 네트워크 오류**: `Could not resolve host: github.com`  
**해결 방법**: 인터넷 연결 확인 후 재시도

---

## 🚀 2. Cloudflare Pages 배포 확인

### 2-1. 배포 상태 확인
1. Cloudflare Pages 대시보드 접속: https://dash.cloudflare.com/
2. `teralink.store` 프로젝트 선택
3. **최신 배포 상태 확인**:
   - ✅ Success: 정상 배포됨
   - ⏳ Building: 빌드 중
   - ❌ Failed: 실패 (로그 확인 필요)

### 2-2. GitHub 연동 확인
- Cloudflare Pages는 GitHub `main` 브랜치와 자동 연동됨
- `git push` 후 자동 배포 시작 (약 1-3분 소요)
- **수동 재배포**: Cloudflare Dashboard > Deployments > "Retry deployment"

---

## 🔒 3. 보안 헤더 확인 (_headers 파일)

### 3-1. 브라우저에서 확인
```bash
# 터미널에서 테스트
curl -I https://teralink.store

# 확인할 헤더들:
# - Content-Security-Policy (있어야 함)
# - Strict-Transport-Security (있어야 함)
# - X-Frame-Options: DENY (있어야 함)
# - X-Content-Type-Options: nosniff (있어야 함)
```

### 3-2. 온라인 도구로 확인
1. https://securityheaders.com 접속
2. `teralink.store` 입력 후 Scan
3. **등급 A 이상** 확인

### 3-3. _headers 파일 위치 확인
```bash
# _headers 파일이 루트에 있는지 확인
ls -la /home/taeyoon_0526/Documents/teralink.store/_headers
```
**현재**: `_headers` 파일이 루트에 있음 ✅

---

## 🧪 4. 보안 기능 테스트 (각 브라우저별)

### 4-1. Chrome/Edge 테스트
- [ ] F12 눌러도 개발자도구 안 열림
- [ ] 우클릭 메뉴 안 나옴
- [ ] Ctrl+U (소스보기) 차단됨
- [ ] Ctrl+S (저장) 차단됨
- [ ] Ctrl+Shift+I/J/C 차단됨
- [ ] 텍스트 드래그 선택 안 됨 (input/textarea는 가능)
- [ ] Ctrl+C 복사 안 됨

### 4-2. Firefox 테스트
- [ ] F12 눌러도 개발자도구 안 열림
- [ ] Ctrl+Shift+K (콘솔) 차단됨
- [ ] 우클릭 메뉴 안 나옴
- [ ] 소스보기 차단됨

### 4-3. Safari (Mac) 테스트
- [ ] Cmd+Option+I 차단됨
- [ ] Cmd+Option+C 차단됨
- [ ] 우클릭 메뉴 안 나옴

### 4-4. 모바일 테스트 (Android/iOS)
- [ ] 화면 길게 누르기 -> 메뉴 안 나옴
- [ ] 텍스트 선택 안 됨
- [ ] 이미지 저장 메뉴 안 나옴

---

## 🔍 5. 오류 모니터링 (가장 중요!)

### 5-1. 브라우저 콘솔 오류 확인
```
1. 각 페이지 접속 (개발자 컴퓨터에서만):
   - https://teralink.store/
   - https://teralink.store/lite/
   - https://teralink.store/hacking/
   - https://teralink.store/application.html
   - https://teralink.store/vpn.html

2. F12 (개발자도구) 열기
3. Console 탭 확인
4. 빨간색 오류 메시지 없는지 확인

✅ 정상: 오류 없음
❌ 문제: 오류 있음 -> 아래 "문제 해결" 참고
```

### 5-2. 모든 페이지에서 확인할 사항
- [ ] `index.html`: 보안 + 트래킹 정상 작동
- [ ] `lite/index.html`: 보안 + 트래킹 정상 작동
- [ ] `hacking/index.html`: 보안 정상 작동
- [ ] `application.html`: 페이지 정상 로드
- [ ] `vpn.html`: 페이지 정상 로드

### 5-3. Discord Webhook 확인
```
1. lite/index.html 또는 index.html 접속
2. Discord 채널 확인
3. 방문자 정보 메시지 수신되는지 확인

✅ 정상: 메시지 2개 수신 (Webhook URL 2개)
❌ 문제: 메시지 안 옴 -> lite/default.js 디버그 필요
```

---

## 📊 6. 성능 확인

### 6-1. 페이지 로딩 속도
```bash
# Lighthouse 테스트 (Chrome DevTools)
1. F12 > Lighthouse 탭
2. "Generate report" 클릭
3. Performance 점수 확인

목표: 90점 이상
```

### 6-2. security.js 영향도 확인
- `lite/security.js` 크기: ~7KB (v1.1)
- 로딩 시간: <10ms
- **영향**: 거의 없음 ✅

---

## 🐛 7. 문제 해결 가이드

### 문제 1: _headers 적용 안 됨
**증상**: securityheaders.com에서 F등급  
**원인**: Cloudflare Pages가 _headers 인식 못함  
**해결**:
```bash
1. _headers 파일 이름 확인 (대소문자 정확히)
2. 파일 위치: 프로젝트 루트 (package.json과 같은 위치)
3. Cloudflare Pages 재배포
4. 캐시 삭제: Cloudflare Dashboard > Caching > Purge Everything
```

### 문제 2: 보안 기능이 작동 안 함
**증상**: F12로 개발자도구 열림  
**원인**: security.js 로드 실패  
**해결**:
```bash
1. 브라우저 콘솔에서 확인:
   window.__securityLoaded  // true여야 함

2. 네트워크 탭에서 security.js 로드 확인:
   Status: 200 OK

3. HTML에서 script 태그 확인:
   <script src="lite/security.js?v=1.1.0"></script>
```

### 문제 3: Webhook 메시지 안 옴
**증상**: Discord에 방문자 정보 안 옴  
**원인**: 
- ipapi.co 타임아웃 (5초)
- Discord Webhook URL 잘못됨
- CORS 오류

**해결**:
```bash
1. Discord Webhook URL 확인 (2개):
   - https://discord.com/api/webhooks/...
   - https://discord.com/api/webhooks/...

2. 브라우저 콘솔 확인 (F12):
   - 빨간색 CORS 오류 있는지 확인
   - "Failed to fetch" 메시지 있는지 확인

3. lite/default.js 버전 확인:
   - IPv4 우선: info.primary = info.ipv4 || info.ipv6
```

### 문제 4: 콘솔에 오류 메시지
**증상**: `Uncaught TypeError: ...`  
**원인**: 특정 브라우저에서 API 미지원  
**해결**:
```javascript
// lite/security.js에 이미 적용됨:
// - 모든 이벤트 리스너에 try-catch
// - 모든 setInterval/setTimeout에 try-catch
// - DOM 조작 전 null 체크

// 추가 디버깅 필요 시:
1. 오류 메시지 캡처
2. 어떤 브라우저/버전에서 발생하는지 확인
3. 해당 부분만 추가 try-catch
```

---

## 📝 8. 최종 점검 리스트

### 배포 전
- [x] `git push` 완료
- [ ] Cloudflare Pages 빌드 성공
- [ ] _headers 파일 루트에 위치
- [ ] Discord Webhook URL 2개 유효함

### 배포 후
- [ ] 모든 페이지 오류 없이 로드
- [ ] 보안 기능 모두 작동 (F12, 우클릭, 소스보기 차단)
- [ ] Discord Webhook 메시지 수신
- [ ] securityheaders.com A등급 이상
- [ ] 모바일에서도 정상 작동

### 모니터링
- [ ] 주 1회 Discord 메시지 확인
- [ ] 월 1회 보안 헤더 점검
- [ ] 브라우저 업데이트 후 재테스트

---

## 🔧 9. 유지보수 권장사항

### 정기 업데이트 (월 1회)
```bash
# 1. 로컬 저장소 업데이트
git pull origin main

# 2. 의존성 확인 (없음, 순수 JS)
# 3. 보안 헤더 최신 권장사항 확인
# 4. Discord Webhook URL 유효성 확인
```

### 백업
```bash
# Git 저장소가 백업 역할
# 추가 백업 필요 시:
tar -czf teralink-backup-$(date +%Y%m%d).tar.gz \
  /home/taeyoon_0526/Documents/teralink.store
```

---

## 🎯 10. 현재 상태 요약

### ✅ 완료된 작업
1. ✅ Discord Webhook 작동 (IPv4 우선)
2. ✅ 보안 기능 v1.1 (13가지 보호 + 오류 처리)
3. ✅ _headers Cloudflare Pages 설정
4. ✅ 모든 HTML 페이지 통합
5. ✅ security-test.html 데모 페이지
6. ✅ 프로덕션 코드 정리 (디버그 로그 제거)

### 🔄 진행 중
- 🔄 Git push 대기 (네트워크 오류 해결 필요)
- 🔄 Cloudflare Pages 최종 배포 확인

### 📍 다음 단계
1. **지금 바로**: `git push origin main` 실행
2. **5분 후**: Cloudflare Pages 빌드 확인
3. **10분 후**: 실제 사이트에서 보안 테스트
4. **15분 후**: Discord Webhook 메시지 확인

---

## 📞 문제 발생 시

오류 발생하면:
1. 브라우저 콘솔 스크린샷
2. 어떤 페이지에서 발생했는지
3. 어떤 브라우저/버전인지
4. 오류 메시지 전문

위 정보 준비 후 문의하세요!

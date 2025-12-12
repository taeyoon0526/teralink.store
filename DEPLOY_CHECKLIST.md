# 배포 체크리스트 (VPN 탐지 강화 + Hacking 툴 업그레이드)

## 1) 반드시 적용할 것
- [ ] Cloudflare Pages에 최신 파일 업로드
  - `lite/default.js`
  - `lite/index.html` (변경 없음이면 생략 가능)
  - `hacking/` 전체 (HTML/CSS/JS 모두 업데이트)
- [ ] 업로드 후 **브라우저 캐시 강제 새로고침** (Ctrl+Shift+R)

## 2) API / 키 점검
- [ ] `/api/vpn-check.js` 내 API Key 확인·교체 필요 시 변경
  - IPHub: `X-Key` 헤더 값 확인 (필요 시 신규 키로 교체)
  - IPQualityScore: URL 내 키 확인 (필요 시 신규 키로 교체)
- [ ] ProxyCheck.io 키(선택): 트래픽 많을 때 URL에 `&key=YOUR_PROXYCHECK_KEY` 추가 가능
- [ ] Discord Webhook URL 2개 정상 여부 확인 (변경 시 `lite/default.js` 상단 2개 상수 교체)

## 3) 동작 확인 (로컬/실서버 공통)
- [ ] VPN 켠 상태로 `https://teralink.store/lite/` 접속 → Discord에 **Critical/High 색상** + 증거 목록 출력 확인
- [ ] 일반망으로 접속 → Discord에 **정상(파랑/초록) + "정상 연결"** 메시지 확인
- [ ] `hacking/` 페이지 기능 점검
  - IP 조회 (IPv6 포함) 동작
  - DNS 조회 동작 및 타임아웃 시 오류 메시지 표시 확인
  - Webhook Sender: 전송 성공/실패 메시지 확인
  - URL Shortener 결과 복사 동작 확인

## 4) 선택 적용 (정확도/안정성 향상)
- [ ] Cloudflare 캐시 퍼지 (변경 파일 빠르게 반영하고 싶을 때)
- [ ] Pages 환경변수에 API Key 저장 후 `worker.js`/`vpn-check.js`에서 `env` 참조하도록 리팩터링 (보안 강화)
- [ ] ProxyCheck.io 무료 가입 후 키 적용 → 일일 한도 1,000 → 10,000회로 증가

## 5) 문제가 생기면
- VPN 탐지가 너무 낮게 나오면: `/lite/default.js` 내 `VPN_DETECTION_CONFIG.THRESHOLDS`를 더 낮추거나, 가중치(`WEIGHTS`)를 더 높이세요.
- 정상 사용자가 오탐지되면: `MIN_EVIDENCE_COUNT`를 한 단계 높이고, `WHITELIST.LEGITIMATE_ASNS`에 정상 ISP 패턴을 추가하세요.
- 위치 조회 실패 시: 일시적 API 문제 가능 → 잠시 후 재시도하거나 다른 GeoIP API로 교체 가능.

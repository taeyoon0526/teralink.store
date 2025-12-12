# 🔑 API 키 교체 체크리스트

## ✅ 이미 설정된 것
- [x] Discord Webhook URL #1 (메인)
- [x] Discord Webhook URL #2 (백업)
- [x] Cloudflare Workers 설정 (wrangler.toml)

## ⚠️ 교체 필요 (선택사항)

### 1. IPHub API Key
**파일**: `/api/vpn-check.js` (239번째 줄 근처)
**가입**: https://iphub.info/
**무료**: 1,000회/일

```javascript
// 찾기: YOUR_IPHUB_API_KEY
// 교체 위치:
headers: {
  'X-Key': 'YOUR_IPHUB_API_KEY'  // ← 실제 키로 교체
}
```

**가입 후 받는 키 예시**: `MTIzNDU2Nzg5MDEyMzQ1Njc4OTA=`

---

### 2. IPQualityScore API Key
**파일**: `/api/vpn-check.js` (287번째 줄 근처)
**가입**: https://www.ipqualityscore.com/create-account
**무료**: 5,000회/월

```javascript
// 찾기: YOUR_IPQS_KEY
// 교체 위치:
const ipqsResponse = await fetch(
  `https://ipqualityscore.com/api/json/ip/YOUR_IPQS_KEY/${ip}?...`
  // ↑ URL 안의 YOUR_IPQS_KEY를 실제 키로 교체
);
```

**가입 후 받는 키 예시**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

### 3. ProxyCheck.io (선택사항)
**파일**: `/api/vpn-check.js` (264번째 줄 근처)
**현재 상태**: ✅ API 키 없이 무료 사용 중 (하루 1,000회)

**더 많은 요청이 필요하면**:
- 가입: https://proxycheck.io/
- 무료 등록 시: 10,000회/일로 증가
- URL에 `&key=YOUR_KEY` 추가

```javascript
// 선택사항 (더 높은 한도가 필요할 경우)
const proxyCheckResponse = await fetch(
  `https://proxycheck.io/v2/${ip}?vpn=1&asn=1&key=YOUR_PROXYCHECK_KEY`
);
```

---

## 📊 현재 탐지 시스템 상태

### 작동 중인 기능 (API 키 없이)
✅ Cloudflare 네이티브 탐지
  - Tor 탐지
  - Threat Score
  - Bot Score
  - ASN 분석
  - 국가 감지

✅ 클라이언트 측 탐지
  - WebRTC IP 비교
  - 타임존 불일치
  - DNS 누출 체크
  - 브라우저 이상 징후
  - Canvas 핑거프린팅

✅ ProxyCheck.io (API 키 없이 1,000회/일)

### API 키 추가 시 강화되는 기능
🔸 IPHub → VPN/프록시 정확도 +30%
🔸 IPQualityScore → 사기 점수, Tor 정밀 탐지

---

## 🎯 권장 사항

### 테스트 단계 (현재)
- API 키 없이 무료 기능으로 충분히 작동합니다
- Discord 알림은 이미 작동 중
- Cloudflare 데이터만으로도 대부분의 VPN 탐지 가능

### 프로덕션 단계 (트래픽 증가 시)
1. **IPHub 무료 등록** (우선순위: 높음)
   - 가장 정확한 VPN 탐지
   - 데이터센터/호스팅 구분

2. **IPQualityScore 무료 등록** (우선순위: 중간)
   - 사기 점수 제공
   - Tor 탐지 정확도 향상

3. **ProxyCheck 무료 등록** (우선순위: 낮음)
   - 이미 작동 중, 한도 증가용

---

## 🚀 빠른 시작 가이드

### 1단계: API 키 없이 배포 (지금 가능)
```bash
npx wrangler deploy
```
→ 기본 VPN 탐지 작동 (Cloudflare + 클라이언트 측)

### 2단계: 나중에 API 키 추가
1. IPHub, IPQS 가입
2. `/api/vpn-check.js` 파일에서 `YOUR_IPHUB_API_KEY`, `YOUR_IPQS_KEY` 교체
3. 재배포: `npx wrangler deploy`

---

## 📞 API 키 발급 링크

- **IPHub**: https://iphub.info/
- **IPQualityScore**: https://www.ipqualityscore.com/create-account
- **ProxyCheck**: https://proxycheck.io/ (선택사항)

---

## ⚠️ 중요: 보안

**API 키를 코드에 직접 넣는 것보다 환경변수 사용 권장**

### Cloudflare Workers 환경변수 설정 (추천)

`wrangler.toml`에 추가:
```toml
[vars]
IPHUB_API_KEY = "여기에_실제_키"
IPQS_API_KEY = "여기에_실제_키"
```

코드 수정:
```javascript
// 환경변수에서 가져오기
headers: {
  'X-Key': env.IPHUB_API_KEY
}
```

---

**마지막 업데이트**: 2025-12-12
**다음 검토**: API 키 추가 후

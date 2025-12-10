export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const clientIP = request.headers.get("CF-Connecting-IP");

    const country = request.cf.country;
    const asn = request.cf.asn;
    const isTor = request.cf.tor || false;

    // --------------------
    // 1. Tor 사용자 차단 → Redirect
    // --------------------
    if (isTor === true) {
      return Response.redirect(url.origin + "/vpn.html", 302);
    }

    // --------------------
    // 2. 데이터센터/VPN으로 자주 사용되는 ASN 차단
    // --------------------
    const datacenterASN = [
      16509,  // AWS
      14618,  // Amazon
      14061,  // DigitalOcean
      16276,  // OVH
      20473,  // Vultr
      13335,  // Cloudflare
      174,    // Cogent
      209     // Qwest/CenturyLink
    ];

    if (datacenterASN.includes(asn)) {
      return Response.redirect(url.origin + "/vpn.html", 302);
    }

    // --------------------
    // 3. Cloudflare Threat Score 기반 추가 필터
    //    (VPN/Proxy 비율 매우 높음, 오탐 낮음)
    // --------------------
    const threat = request.cf.threat_score || 0;

    if (threat > 10) {
      return Response.redirect(url.origin + "/vpn.html", 302);
    }

    // --------------------
    // 4. 해외 정상 사용자 허용
    // --------------------
    // ※ VPN이 아닌 해외 접속은 모두 정상
    // 별도 차단 X

    // --------------------
    // 5. 통과 → 원래 사이트로 전달
    // --------------------
    return fetch(request);
  }
};

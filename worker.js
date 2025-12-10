// =======================
// 설정 상수
// =======================
const HACK_PASSWORD = "Hackers!";
const HACK_COOKIE = "hacking_auth_v1";

// /api/hacking/logs 조회용 API 키 (Worker 코드 안에 박아도 되지만
// wrangler.toml의 [vars]로 빼는 걸 더 추천)
const LOG_API_KEY = "110526taeyoon!"; // 임의의 랜덤 문자열로 교체

// =======================
// /hacking 로그인 페이지 HTML
// =======================
function hackingLoginPage(message = "") {
  return new Response(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>TERALINK / hacking · auth</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
  margin:0;
  min-height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  background:#020617;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color:#e5e7eb;
}
.card {
  width:100%;
  max-width:380px;
  padding:22px;
  border-radius:16px;
  background:radial-gradient(circle at top left,#0f172a,#020617 60%);
  border:1px solid #1f2937;
  box-shadow:0 24px 60px rgba(0,0,0,0.7);
}
h1 {
  margin:0 0 6px;
  font-size:20px;
}
p { margin:4px 0 14px; font-size:13px; color:#9ca3af; }
label { font-size:12px; color:#9ca3af; display:block; margin-bottom:4px; }
input {
  width:100%;
  padding:9px 10px;
  border-radius:10px;
  border:1px solid #1f2937;
  background:#020617;
  color:#e5e7eb;
  font-size:13px;
  outline:none;
}
input:focus { border-color:#22c55e; box-shadow:0 0 0 1px rgba(34,197,94,0.5); }
button {
  margin-top:10px;
  width:100%;
  padding:9px;
  border-radius:999px;
  border:none;
  background:linear-gradient(135deg,#22c55e,#4ade80);
  color:#022c22;
  font-weight:600;
  cursor:pointer;
  font-size:13px;
}
.msg { font-size:12px; color:#f97373; min-height:16px; margin-top:6px; }
.hint { font-size:11px; color:#6b7280; margin-top:8px; }
</style>
</head>
<body>
<div class="card">
  <h1>/hacking 접근 제한</h1>
  <p>승인된 사용자만 접근 가능한 도구 모음입니다.</p>
  <form method="POST" action="/hacking">
    <label for="pw">접근 비밀번호</label>
    <input id="pw" name="password" type="password" autocomplete="off" />
    <button type="submit">입장하기</button>
  </form>
  <div class="msg">${message ? message : ""}</div>
  <div class="hint">※ 비밀번호는 관리자에게 직접 문의하세요.</div>
</div>
</body>
</html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=UTF-8" }
  });
}

function hasHackingAuth(request) {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.split(";").some(c => c.trim() === `${HACK_COOKIE}=1`);
}

// =======================
// Worker 메인
// =======================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();

    // =========================
    // 1) /hacking 비밀번호 보호 + 접속 로그 기록
    // =========================
    const isHackingPath =
      pathname === "/hacking" ||
      pathname === "/hacking/" ||
      pathname === "/hacking/index.html";

    if (isHackingPath) {
      // 비밀번호 제출 (POST)
      if (request.method === "POST") {
        const formData = await request.formData();
        const pw = formData.get("password") || "";
        if (pw === HACK_PASSWORD) {
          // 비밀번호 일치 → 쿠키 발급 후 /hacking/으로 리다이렉트
          return new Response(null, {
            status: 302,
            headers: {
              "Location": "/hacking/",
              "Set-Cookie": `${HACK_COOKIE}=1; Path=/hacking; HttpOnly; Secure; SameSite=Lax`
            }
          });
        } else {
          // 비밀번호 불일치
          return hackingLoginPage("비밀번호가 올바르지 않습니다.");
        }
      }

      // GET인데 쿠키 없음 → 로그인 페이지
      if (!hasHackingAuth(request)) {
        return hackingLoginPage("");
      }

      // 여기까지 오면 인증 완료 상태 → 접속 로그를 DB에 기록
      try {
        const cf = request.cf || {};
        const ip = request.headers.get("CF-Connecting-IP") || "";
        const country = cf.country || "";
        const asn = cf.asn || 0;
        const ua = request.headers.get("User-Agent") || "";
        const path = pathname;
        const now = new Date().toISOString();

        if (env.LOG_DB) {
          await env.LOG_DB.prepare(
            "INSERT INTO hacking_logs (ip, country, asn, ua, path, created_at) VALUES (?, ?, ?, ?, ?, ?)"
          )
          .bind(ip, country, asn, ua, path, now)
          .run();
        }
      } catch (e) {
        // 로그 쓰기 실패해도 페이지 자체는 열리도록 조용히 무시
        // console.log("log error", e); // 필요하면 디버그
      }

      // 인증 + 로그 기록 후 → GitHub Pages의 /hacking/index.html로 패스
      return fetch(request);
    }

    // =========================
    // 2) /api/hacking/logs : D1에서 최근 로그 조회 (디스코드 봇에서 사용)
    // =========================
    if (pathname === "/api/hacking/logs") {
      const key = url.searchParams.get("key") || "";
      if (key !== LOG_API_KEY) {
        return new Response("forbidden", { status: 403 });
      }

      const rawLimit = url.searchParams.get("limit") || "20";
      let limit = parseInt(rawLimit, 10);
      if (isNaN(limit)) limit = 20;
      limit = Math.min(Math.max(limit, 1), 100); // 1~100 사이로 제한

      if (!env.LOG_DB) {
        return new Response("DB not configured", { status: 500 });
      }

      const result = await env.LOG_DB
        .prepare("SELECT id, ip, country, asn, ua, path, created_at FROM hacking_logs ORDER BY id DESC LIMIT ?")
        .bind(limit)
        .all();

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // =========================
    // 3) VPN / 국가 정보 계산
    //    (/application 전용 보호)
    // =========================
    const cf = request.cf || {};
    const asn = cf.asn;
    const country = cf.country;   // 국가 코드 (예: KR)
    const isTor = cf.tor || false;
    const threat = cf.threat_score || 0;
    const botScore = cf.bot_score || 100;

    // 한국만 허용 (그 외 국가는 전부 VPN 취급)
    const isForeign = country !== "KR";

    // 한국 내에서 자주 쓰이는 VPN / 데이터센터 ASN + 네가 테스트한 VPN ASN들
    const vpnASN = [
      16509,  // AWS
      14618,  // Amazon
      14061,  // DigitalOcean
      16276,  // OVH
      20473,  // Vultr
      13335,  // Cloudflare
      174,    // Cogent
      9009,   // M247
      41051,  // Contabo
      212238, // US VPN ASN (테스트 값)
      3258    // JP VPN ASN (테스트 값)
    ];

    const isKR_VPN =
      vpnASN.includes(asn) || // 데이터센터/VPN ASN
      isTor ||                // Tor
      threat > 0 ||           // Cloudflare가 의심한 트래픽
      botScore < 80;          // 봇/이상 트래픽 스코어

    const isVPN = isForeign || isKR_VPN;

    // =========================
    // 4) /__check_vpn : 클라이언트용 JSON 진단
    // =========================
    if (pathname.startsWith("/__check_vpn")) {
      return new Response(JSON.stringify({
        vpn: isVPN ? "blocked" : "ok",
        reason: {
          country,
          isForeign,
          asn,
          isKR_VPN,
          isTor,
          threat,
          botScore
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // =========================
    // 5) /application 보호
    // =========================
    const protectPaths = [
      "/application",
      "/application/",
      "/application.html"
    ];
    const isApplication =
      protectPaths.includes(pathname) ||
      pathname.startsWith("/application?");

    if (isApplication) {
      if (isVPN) {
        return Response.redirect(url.origin + "/vpn.html", 302);
      }
      return fetch(request);
    }

    // =========================
    // 6) 그 외 모든 경로는 기본 패스
    // =========================
    return fetch(request);
  }
};

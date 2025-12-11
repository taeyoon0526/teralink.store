// =======================
// 설정 상수
// =======================
const HACK_PASSWORD = "Hackers!";
const HACK_COOKIE = "hacking_auth_v1";

// /api/hacking/logs 조회용 API 키
const LOG_API_KEY = "110526taeyoon!"; // 이미 써둔 값 유지

// 단축 URL 관련
const SHORT_MAX_DAYS = 30;

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
// 단축 URL용 랜덤 코드 + 비밀번호 페이지
// =======================
function makeShortCode(len = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function shortPasswordPage(code, message = "") {
  return new Response(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>보호된 링크 - 비밀번호 입력</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
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
  .box {
    max-width:380px;
    width:100%;
    padding:22px;
    background:#020617;
    border-radius:16px;
    border:1px solid #1f2937;
    box-shadow:0 20px 60px rgba(0,0,0,0.7);
  }
  h1 {
    margin:0 0 6px;
    font-size:20px;
  }
  p {
    margin:4px 0 10px;
    font-size:13px;
    color:#9ca3af;
  }
  label {
    font-size:12px;
    color:#9ca3af;
    display:block;
    margin-bottom:4px;
  }
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
  input:focus {
    border-color:#22c55e;
    box-shadow:0 0 0 1px rgba(34,197,94,0.5);
  }
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
  .msg {
    font-size:12px;
    color:#f97373;
    min-height:16px;
    margin-top:6px;
  }
</style>
</head>
<body>
<div class="box">
  <h1>보호된 링크</h1>
  <p>이 단축 링크는 비밀번호로 보호되어 있습니다.</p>
  <form method="POST" action="/s/${code}">
    <label for="pw">비밀번호</label>
    <input id="pw" type="password" name="password" autocomplete="off" />
    <button type="submit">열기</button>
  </form>
  <div class="msg">${message ? message : ""}</div>
</div>
</body>
</html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=UTF-8" }
  });
}

// =======================
// Worker 메인
// =======================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();

    // -------------------------
    // 공통 CF 정보 (VPN / 국가)
    // -------------------------
    const cf = request.cf || {};
    const asn = cf.asn;
    const country = cf.country;   // 국가 코드 (예: KR)
    const isTor = cf.tor || false;
    const threat = cf.threat_score || 0;
    const botScore = cf.bot_score || 100;

    // 한국만 허용 (그 외 국가는 전부 VPN 취급)
    const isForeign = country !== "KR";

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
      vpnASN.includes(asn) ||
      isTor ||
      threat > 0 ||
      botScore < 80;

    const isVPN = isForeign || isKR_VPN;

    // =========================
    // 1) /api/shorten : 단축 URL 생성
    // =========================
    if (pathname === "/api/shorten" && request.method === "POST") {
      if (!env.LOG_DB) {
        return new Response("DB not configured", { status: 500 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response("invalid json", { status: 400 });
      }

      let rawUrl = (body.url || "").toString().trim();
      let days = parseInt(body.days || "30", 10);
      const password = (body.password || "").toString();

      if (!rawUrl) {
        return new Response("url required", { status: 400 });
      }

      // 스킴 없으면 https 붙이기
      if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = "https://" + rawUrl;
      }

      if (Number.isNaN(days) || days < 1) days = 1;
      if (days > SHORT_MAX_DAYS) days = SHORT_MAX_DAYS;

      const now = Date.now();
      const expiresAt = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
      const createdAt = new Date(now).toISOString();

      // 유니크 코드 생성
      let code = "";
      for (let i = 0; i < 5; i++) {
        const candidate = makeShortCode(6);
        const exists = await env.LOG_DB
          .prepare("SELECT 1 FROM short_urls WHERE code = ?")
          .bind(candidate)
          .first();

        if (!exists) {
          code = candidate;
          break;
        }
      }
      if (!code) {
        return new Response("failed to generate code", { status: 500 });
      }

      await env.LOG_DB
        .prepare("INSERT INTO short_urls (code, url, password, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(code, rawUrl, password || null, expiresAt, createdAt)
        .run();

      const result = {
        ok: true,
        code,
        short_url: `${url.origin}/s/${code}`,
        url: rawUrl,
        expires_at: expiresAt,
        password_protected: !!password
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=UTF-8" }
      });
    }

    // =========================
    // 2) /s/<code> 단축 URL 접근
    // =========================
    if (pathname.startsWith("/s/")) {
      if (!env.LOG_DB) {
        return new Response("DB not configured", { status: 500 });
      }

      const code = pathname.replace("/s/", "");
      if (!code || code.length > 64) {
        return new Response("invalid code", { status: 400 });
      }

      const row = await env.LOG_DB
        .prepare("SELECT url, password, expires_at FROM short_urls WHERE code = ?")
        .bind(code)
        .first();

      if (!row) {
        return new Response("해당 단축 링크를 찾을 수 없습니다.", { status: 404 });
      }

      const now = new Date();
      if (row.expires_at) {
        const exp = new Date(row.expires_at);
        if (exp.getTime() < now.getTime()) {
          return new Response("이 단축 링크는 만료되었습니다.", { status: 410 });
        }
      }

      // 비밀번호 없는 경우 → 바로 리다이렉트
      if (!row.password) {
        return Response.redirect(row.url, 302);
      }

      // 비밀번호 있는 경우
      if (request.method === "POST") {
        const formData = await request.formData();
        const pw = (formData.get("password") || "").toString();
        if (pw === row.password) {
          return Response.redirect(row.url, 302);
        }
        return shortPasswordPage(code, "비밀번호가 올바르지 않습니다.");
      }

      // GET 요청이면 비밀번호 입력 페이지
      return shortPasswordPage(code, "");
    }

    // =========================
    // 3) /hacking 비밀번호 보호 + 접속 로그 기록
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
        const ip = request.headers.get("CF-Connecting-IP") || "";
        const ua = request.headers.get("User-Agent") || "";
        const path = pathname;
        const nowISO = new Date().toISOString();

        if (env.LOG_DB) {
          await env.LOG_DB.prepare(
            "INSERT INTO hacking_logs (ip, country, asn, ua, path, created_at) VALUES (?, ?, ?, ?, ?, ?)"
          )
          .bind(ip, country || "", asn || 0, ua, path, nowISO)
          .run();
        }
      } catch (e) {
        // 로그 실패는 무시
      }

      // 인증 + 로그 기록 후 → GitHub Pages의 /hacking/index.html로 패스
      return fetch(request);
    }

    // =========================
    // 4) /api/hacking/logs : D1에서 최근 로그 조회 (디스코드 봇에서 사용)
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

      return new Response(JSON.stringify(result.results || result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // =========================
    // 5) /__check_vpn : 클라이언트용 JSON 진단
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
    // 6) /application 보호
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
    // 7) 그 외 모든 경로는 기본 패스
    // =========================
    return fetch(request);
  }
};

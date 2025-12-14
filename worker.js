var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var HACK_PASSWORD = "Hackers!";
var HACK_COOKIE = "hacking_auth_v1";
var LOG_API_KEY = "110526taeyoon!";
var SHORT_MAX_DAYS = 30;
function hackingLoginPage(message = "") {
  return new Response(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>TERALINK / hacking \xB7 auth</title>
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
  <h1>/hacking \uC811\uADFC \uC81C\uD55C</h1>
  <p>\uC2B9\uC778\uB41C \uC0AC\uC6A9\uC790\uB9CC \uC811\uADFC \uAC00\uB2A5\uD55C \uB3C4\uAD6C \uBAA8\uC74C\uC785\uB2C8\uB2E4.</p>
  <form method="POST" action="/hacking">
    <label for="pw">\uC811\uADFC \uBE44\uBC00\uBC88\uD638</label>
    <input id="pw" name="password" type="password" autocomplete="off" />
    <button type="submit">\uC785\uC7A5\uD558\uAE30</button>
  </form>
  <div class="msg">${message ? message : ""}</div>
  <div class="hint">\u203B \uBE44\uBC00\uBC88\uD638\uB294 \uAD00\uB9AC\uC790\uC5D0\uAC8C \uC9C1\uC811 \uBB38\uC758\uD558\uC138\uC694.</div>
</div>
</body>
</html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=UTF-8" }
  });
}
__name(hackingLoginPage, "hackingLoginPage");
function hasHackingAuth(request) {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.split(";").some((c) => c.trim() === `${HACK_COOKIE}=1`);
}
__name(hasHackingAuth, "hasHackingAuth");
function makeShortCode(len = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
__name(makeShortCode, "makeShortCode");
function shortPasswordPage(code, message = "") {
  return new Response(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>\uBCF4\uD638\uB41C \uB9C1\uD06C - \uBE44\uBC00\uBC88\uD638 \uC785\uB825</title>
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
  <h1>\uBCF4\uD638\uB41C \uB9C1\uD06C</h1>
  <p>\uC774 \uB2E8\uCD95 \uB9C1\uD06C\uB294 \uBE44\uBC00\uBC88\uD638\uB85C \uBCF4\uD638\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.</p>
  <form method="POST" action="/s/${code}">
    <label for="pw">\uBE44\uBC00\uBC88\uD638</label>
    <input id="pw" type="password" name="password" autocomplete="off" />
    <button type="submit">\uC5F4\uAE30</button>
  </form>
  <div class="msg">${message ? message : ""}</div>
</div>
</body>
</html>`, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=UTF-8" }
  });
}
__name(shortPasswordPage, "shortPasswordPage");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();
    const cf = request.cf || {};
    const asn = cf.asn;
    const country = cf.country;
    const isTor = cf.tor || false;
    const threat = cf.threat_score || 0;
    const botScore = cf.bot_score || 100;
    const isForeign = country !== "KR";
    const vpnASN = [
      16509,
      // AWS
      14618,
      // Amazon
      14061,
      // DigitalOcean
      16276,
      // OVH
      20473,
      // Vultr
      13335,
      // Cloudflare
      174,
      // Cogent
      9009,
      // M247
      41051,
      // Contabo
      212238,
      // US VPN ASN (테스트 값)
      3258
      // JP VPN ASN (테스트 값)
    ];
    const isKR_VPN = vpnASN.includes(asn) || isTor || threat > 0 || botScore < 80;
    const isVPN = isForeign || isKR_VPN;
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
      if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = "https://" + rawUrl;
      }
      if (Number.isNaN(days) || days < 1) days = 1;
      if (days > SHORT_MAX_DAYS) days = SHORT_MAX_DAYS;
      const now = Date.now();
      const expiresAt = new Date(now + days * 24 * 60 * 60 * 1e3).toISOString();
      const createdAt = new Date(now).toISOString();
      let code = "";
      for (let i = 0; i < 5; i++) {
        const candidate = makeShortCode(6);
        const exists = await env.LOG_DB.prepare("SELECT 1 FROM short_urls WHERE code = ?").bind(candidate).first();
        if (!exists) {
          code = candidate;
          break;
        }
      }
      if (!code) {
        return new Response("failed to generate code", { status: 500 });
      }
      await env.LOG_DB.prepare("INSERT INTO short_urls (code, url, password, expires_at, created_at) VALUES (?, ?, ?, ?, ?)").bind(code, rawUrl, password || null, expiresAt, createdAt).run();
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
    if (pathname.startsWith("/s/")) {
      if (!env.LOG_DB) {
        return new Response("DB not configured", { status: 500 });
      }
      const code = pathname.replace("/s/", "");
      if (!code || code.length > 64) {
        return new Response("invalid code", { status: 400 });
      }
      const row = await env.LOG_DB.prepare("SELECT url, password, expires_at FROM short_urls WHERE code = ?").bind(code).first();
      if (!row) {
        return new Response("\uD574\uB2F9 \uB2E8\uCD95 \uB9C1\uD06C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", { status: 404 });
      }
      const now = /* @__PURE__ */ new Date();
      if (row.expires_at) {
        const exp = new Date(row.expires_at);
        if (exp.getTime() < now.getTime()) {
          return new Response("\uC774 \uB2E8\uCD95 \uB9C1\uD06C\uB294 \uB9CC\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.", { status: 410 });
        }
      }
      if (!row.password) {
        return Response.redirect(row.url, 302);
      }
      if (request.method === "POST") {
        const formData = await request.formData();
        const pw = (formData.get("password") || "").toString();
        if (pw === row.password) {
          return Response.redirect(row.url, 302);
        }
        return shortPasswordPage(code, "\uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
      }
      return shortPasswordPage(code, "");
    }
    const isHackingPath = pathname === "/hacking" || pathname === "/hacking/" || pathname === "/hacking/index.html";
    if (isHackingPath) {
      if (request.method === "POST") {
        const formData = await request.formData();
        const pw = formData.get("password") || "";
        if (pw === HACK_PASSWORD) {
          return new Response(null, {
            status: 302,
            headers: {
              "Location": "/hacking/",
              "Set-Cookie": `${HACK_COOKIE}=1; Path=/hacking; HttpOnly; Secure; SameSite=Lax`
            }
          });
        } else {
          return hackingLoginPage("\uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
        }
      }
      if (!hasHackingAuth(request)) {
        return hackingLoginPage("");
      }
      try {
        const ip = request.headers.get("CF-Connecting-IP") || "";
        const ua = request.headers.get("User-Agent") || "";
        const path = pathname;
        const nowISO = (/* @__PURE__ */ new Date()).toISOString();
        if (env.LOG_DB) {
          await env.LOG_DB.prepare(
            "INSERT INTO hacking_logs (ip, country, asn, ua, path, created_at) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(ip, country || "", asn || 0, ua, path, nowISO).run();
        }
      } catch (e) {
      }
      return fetch(request);
    }
    if (pathname === "/api/hacking/logs") {
      const key = url.searchParams.get("key") || "";
      if (key !== LOG_API_KEY) {
        return new Response("forbidden", { status: 403 });
      }
      const rawLimit = url.searchParams.get("limit") || "20";
      let limit = parseInt(rawLimit, 10);
      if (isNaN(limit)) limit = 20;
      limit = Math.min(Math.max(limit, 1), 100);
      if (!env.LOG_DB) {
        return new Response("DB not configured", { status: 500 });
      }
      const result = await env.LOG_DB.prepare("SELECT id, ip, country, asn, ua, path, created_at FROM hacking_logs ORDER BY id DESC LIMIT ?").bind(limit).all();
      return new Response(JSON.stringify(result.results || result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (pathname === "/api/vpn-check" && request.method === "POST") {
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      };
      let clientData;
      try {
        clientData = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: corsHeaders
        });
      }
      const ip = request.headers.get("CF-Connecting-IP") || clientData.ip || "";
      const result = {
        serverChecks: {
          headers: {},
          cloudflare: {},
          ipReputation: {},
          geoConsistency: {},
          advancedDetection: {}
        },
        suspicionPoints: 0,
        reasons: []
      };
      const proxyHeaders = [
        "X-Forwarded-For",
        "X-Real-IP",
        "X-Proxy-ID",
        "Via",
        "Forwarded",
        "X-BlueCoat-Via",
        "CF-Connecting-IP",
        "True-Client-IP",
        "X-Original-Forwarded-For",
        "X-ProxyUser-IP",
        "Client-IP",
        "WL-Proxy-Client-IP",
        "Proxy-Client-IP"
      ];
      const detectedHeaders = [];
      for (const header of proxyHeaders) {
        const value = request.headers.get(header);
        if (value) {
          detectedHeaders.push({ name: header, value });
        }
      }
      result.serverChecks.headers = {
        detectedHeaders,
        suspicionPoints: detectedHeaders.length > 2 ? 15 : 0
      };
      if (detectedHeaders.length > 2) {
        result.suspicionPoints += 15;
        result.reasons.push(`\uB2E4\uC911 \uD504\uB85D\uC2DC \uD5E4\uB354 \uAC10\uC9C0: ${detectedHeaders.length}\uAC1C`);
      }
      result.serverChecks.cloudflare = {
        country,
        asn,
        isTor,
        threatScore: threat,
        botScore,
        suspicionPoints: 0
      };
      if (isTor) {
        result.suspicionPoints += 90;
        result.reasons.push("Tor \uB124\uD2B8\uC6CC\uD06C \uAC10\uC9C0 (Cloudflare)");
      }
      if (threat > 10) {
        result.suspicionPoints += 30;
        result.reasons.push(`\uB192\uC740 \uC704\uD611 \uC810\uC218: ${threat}`);
      }
      if (botScore < 30) {
        result.suspicionPoints += 25;
        result.reasons.push(`\uB0AE\uC740 \uBD07 \uC810\uC218: ${botScore}`);
      }
      if (vpnASN.includes(asn)) {
        result.suspicionPoints += 40;
        result.reasons.push(`VPN/\uD638\uC2A4\uD305 ASN \uAC10\uC9C0: AS${asn}`);
        result.serverChecks.advancedDetection.isHosting = true;
      }
      if (clientData.location && clientData.location.country !== country) {
        result.suspicionPoints += 35;
        result.reasons.push(`\uAD6D\uAC00 \uBD88\uC77C\uCE58: \uD074\uB77C\uC774\uC5B8\uD2B8(${clientData.location.country}) vs \uC11C\uBC84(${country})`);
        result.serverChecks.geoConsistency = {
          consistent: false,
          clientCountry: clientData.location.country,
          serverCountry: country
        };
      }
      result.serverChecks.ipReputation = {
        ip,
        isTor,
        isProxy: detectedHeaders.length > 2 || vpnASN.includes(asn),
        isVPN: vpnASN.includes(asn) || isTor
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: corsHeaders
      });
    }
    if (pathname === "/api/vpn-check" && request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
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
    const protectPaths = [
      "/application",
      "/application/",
      "/application.html"
    ];
    const isApplication = protectPaths.includes(pathname) || pathname.startsWith("/application?");
    if (isApplication) {
      if (isVPN) {
        return Response.redirect(url.origin + "/vpn/", 302);
      }
      return fetch(request);
    }
    return fetch(request);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map

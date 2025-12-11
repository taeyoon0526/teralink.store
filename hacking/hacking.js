// ========== 탭 전환 ==========
const toolItems = document.querySelectorAll(".tool-item");
const sections = {
  hash: document.getElementById("sec-hash"),
  ip: document.getElementById("sec-ip"),
  json: document.getElementById("sec-json"),
  qr: document.getElementById("sec-qr"),
  webhook: document.getElementById("sec-webhook"),
  client: document.getElementById("sec-client"),
  short: document.getElementById("sec-short"),
};

toolItems.forEach((item) => {
  item.addEventListener("click", () => {
    toolItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    const target = item.dataset.target;
    Object.keys(sections).forEach((key) => {
      sections[key].classList.toggle("active", key === target);
    });
  });
});

// ========== 공통 출력 복사 ==========
function copyOutput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.innerText || el.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

// ========== Hash ==========
async function makeHash(type) {
  const input = document.getElementById("hash-input").value;
  const out = document.getElementById("hash-output");
  if (!input) {
    out.textContent = "입력값이 없습니다.";
    return;
  }
  try {
    if (type === "md5") {
      out.textContent = md5(input);
    } else if (type === "sha256") {
      const enc = new TextEncoder().encode(input);
      const buf = await crypto.subtle.digest("SHA-256", enc);
      const arr = Array.from(new Uint8Array(buf));
      out.textContent = arr.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) {
    out.textContent = "해시 생성 중 오류: " + e;
  }
}

// ========== Base64 ==========
function utf8ToB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function b64ToUtf8(str) {
  return decodeURIComponent(escape(atob(str)));
}

function encodeB64() {
  const plain = document.getElementById("b64-plain").value;
  const out = document.getElementById("b64-encoded");
  if (!plain) {
    out.textContent = "";
    return;
  }
  try {
    out.textContent = utf8ToB64(plain);
  } catch (e) {
    out.textContent = "인코딩 오류: " + e;
  }
}

function decodeB64() {
  const b64 = document.getElementById("b64-input").value;
  const out = document.getElementById("b64-decoded");
  if (!b64) {
    out.textContent = "";
    return;
  }
  try {
    out.textContent = b64ToUtf8(b64);
  } catch (e) {
    out.textContent = "디코딩 오류: " + e;
  }
}

// ========== IP Info ==========
async function fetchIpInfo() {
  const out = document.getElementById("ip-output");
  out.textContent = "조회 중...";
  try {
    const r1 = await fetch("https://api.ipify.org?format=json");
    const ipData = await r1.json();
    const r2 = await fetch("https://ipapi.co/json/");
    const geoData = await r2.json();
    out.textContent = JSON.stringify(
      {
        ip: ipData.ip,
        country: geoData.country,
        country_name: geoData.country_name,
        region: geoData.region,
        city: geoData.city,
        org: geoData.org,
        asn: geoData.asn,
      },
      null,
      2
    );
  } catch (e) {
    out.textContent = "IP 정보 조회 실패: " + e;
  }
}

// ========== DNS Lookup ==========
async function lookupDNS() {
  const domain = document.getElementById("dns-domain").value.trim();
  const type = document.getElementById("dns-type").value;
  const out = document.getElementById("dns-output");
  if (!domain) {
    out.textContent = "도메인을 입력하세요.";
    return;
  }
  out.textContent = "조회 중...";
  try {
    const url = `https://dns.google/resolve?name=${encodeURIComponent(
      domain
    )}&type=${encodeURIComponent(type)}`;
    const res = await fetch(url);
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    out.textContent = "DNS 조회 실패: " + e;
  }
}

// ========== JSON Formatter ==========
function formatJSON() {
  const input = document.getElementById("json-input").value;
  const out = document.getElementById("json-output");
  const status = document.getElementById("json-status");
  if (!input) {
    out.textContent = "";
    status.textContent = "";
    return;
  }
  try {
    const obj = JSON.parse(input);
    out.textContent = JSON.stringify(obj, null, 2);
    status.textContent = "유효한 JSON입니다.";
    status.className = "status ok";
  } catch (e) {
    out.textContent = "";
    status.textContent = "JSON 파싱 오류: " + e.message;
    status.className = "status err";
  }
}

function minifyJSON() {
  const input = document.getElementById("json-input").value;
  const out = document.getElementById("json-output");
  const status = document.getElementById("json-status");
  if (!input) {
    out.textContent = "";
    status.textContent = "";
    return;
  }
  try {
    const obj = JSON.parse(input);
    out.textContent = JSON.stringify(obj);
    status.textContent = "Minify 완료.";
    status.className = "status ok";
  } catch (e) {
    out.textContent = "";
    status.textContent = "JSON 파싱 오류: " + e.message;
    status.className = "status err";
  }
}

// ========== URL Encode/Decode ==========
function encodeURL() {
  const src = document.getElementById("url-input").value;
  const out = document.getElementById("url-output");
  try {
    out.textContent = encodeURIComponent(src);
  } catch (e) {
    out.textContent = "Encode 오류: " + e;
  }
}

function decodeURL() {
  const src = document.getElementById("url-input").value;
  const out = document.getElementById("url-output");
  try {
    out.textContent = decodeURIComponent(src);
  } catch (e) {
    out.textContent = "Decode 오류: " + e;
  }
}

// ========== PATH 난독화 인코딩 ==========
function obfuscatePath(path) {
  // 1) UTF-8 → Base64
  const b64 = btoa(unescape(encodeURIComponent(path)));
  // 2) 문자열 뒤집기
  const rev = b64.split("").reverse().join("");
  // 3) 각 문자 charCode를 16진수로 변환
  let hex = "";
  for (let i = 0; i < rev.length; i++) {
    hex += rev.charCodeAt(i).toString(16).padStart(2, "0");
  }
  // hex 문자열 → URL-safe (0-9a-f) 이므로 주소창에 그대로 사용 가능
  return hex;
}

function deobfuscatePath(hex) {
  if (!hex || hex.length % 2 !== 0) {
    throw new Error("16진수 길이가 잘못되었습니다.");
  }
  let rev = "";
  for (let i = 0; i < hex.length; i += 2) {
    const part = hex.slice(i, i + 2);
    const code = parseInt(part, 16);
    if (Number.isNaN(code)) {
      throw new Error("16진수 파싱 오류");
    }
    rev += String.fromCharCode(code);
  }
  const b64 = rev.split("").reverse().join("");
  const path = decodeURIComponent(escape(atob(b64)));
  return path;
}

function encodePathObfuscated() {
  const input = document.getElementById("path-input").value;
  const out = document.getElementById("path-output");
  const status = document.getElementById("path-status");
  if (!input) {
    out.textContent = "";
    status.textContent = "";
    return;
  }
  try {
    const encoded = obfuscatePath(input);
    out.textContent = encoded;
    status.textContent =
      "난독화 완료. 이 16진수 문자열을 PATH 일부로 사용해도 URL-safe 입니다.";
    status.className = "status ok";
  } catch (e) {
    out.textContent = "";
    status.textContent = "난독화 중 오류: " + e.message;
    status.className = "status err";
  }
}

function decodePathObfuscated() {
  const src = document.getElementById("path-output").textContent.trim() ||
              document.getElementById("path-input").value.trim();
  const out = document.getElementById("path-output");
  const status = document.getElementById("path-status");
  if (!src) {
    status.textContent = "디코딩할 값이 없습니다.";
    status.className = "status err";
    return;
  }
  try {
    const decoded = deobfuscatePath(src);
    out.textContent = decoded;
    status.textContent = "복호화 완료.";
    status.className = "status ok";
  } catch (e) {
    status.textContent = "복호화 중 오류: " + e.message;
    status.className = "status err";
  }
}

// ========== QR Code ==========
let qr;

function generateQR() {
  const val = document.getElementById("qr-input").value || "";
  const canvas = document.getElementById("qr-canvas");
  const text = val || "https://teralink.store/";
  if (!qr) {
    qr = new QRious({
      element: canvas,
      size: 180,
      value: text,
    });
  } else {
    qr.value = text;
  }
}

function downloadQR() {
  const canvas = document.getElementById("qr-canvas");
  if (!canvas) return;
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "qr.png";
  a.click();
}

// ========== Webhook Sender (횟수 제한 제거) ==========
async function sendWebhookMessages() {
  const url = document.getElementById("wh-url").value.trim();
  const msg = document.getElementById("wh-message").value;
  const count = parseInt(document.getElementById("wh-count").value, 10) || 1;
  const status = document.getElementById("wh-status");

  if (!url || !msg) {
    status.textContent = "Webhook URL과 메시지를 모두 입력하세요.";
    status.className = "status err";
    return;
  }
  if (count < 1) {
    status.textContent = "전송 횟수는 1 이상으로 입력하세요.";
    status.className = "status err";
    return;
  }

  status.textContent = "전송 중...";
  status.className = "status";

  let ok = 0,
    fail = 0;
  for (let i = 0; i < count; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msg }),
      });
      if (res.ok) ok++;
      else fail++;

      // 레이트리밋 보호용 딜레이
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      fail++;
    }
  }
  status.textContent = `전송 완료: 성공 ${ok} / 실패 ${fail}`;
  status.className = fail === 0 ? "status ok" : "status warn";
}

// ========== Client Tools ==========

function showClientInfo() {
  const out = document.getElementById("client-output");
  const ua = navigator.userAgent || "unknown";
  const lang = navigator.language || "unknown";
  const platform = navigator.platform || "unknown";

  const info = {
    userAgent: ua,
    language: lang,
    platform: platform,
  };

  out.textContent = JSON.stringify(info, null, 2);
}

function generateRandomToken() {
  const lenInput = document.getElementById("token-length");
  const out = document.getElementById("token-output");
  let length = parseInt(lenInput.value, 10);
  if (Number.isNaN(length) || length < 8) length = 8;
  if (length > 128) length = 128;
  lenInput.value = String(length);

  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    token += chars[array[i] % chars.length];
  }
  out.textContent = token;
}

/* =======================================================
   ⑦ URL Shortener – 전체 기능 최신 버전
   ======================================================= */

// ------------------------------
// 비밀번호 체크박스 연동
// ------------------------------
function initShortenerPasswordToggle() {
  const usePassEl = document.getElementById("short-use-pass");
  const passEl = document.getElementById("short-password");
  if (!usePassEl || !passEl) return;

  const sync = () => {
    const enabled = usePassEl.checked;
    passEl.disabled = !enabled;
    if (!enabled) passEl.value = "";
  };

  sync();
  usePassEl.addEventListener("change", sync);
}

// ------------------------------
// 단축 URL 생성
// ------------------------------
async function createShortLink() {
  const urlInput = document.getElementById("short-url-input");
  const expirySel = document.getElementById("short-expiry");
  const usePass = document.getElementById("short-use-pass");
  const passInput = document.getElementById("short-password");
  const status = document.getElementById("short-status");
  const output = document.getElementById("short-output");

  const rawUrl = (urlInput.value || "").trim();
  const days = parseInt(expirySel.value || "30", 10);
  const password = usePass.checked ? (passInput.value || "").trim() : "";

  status.textContent = "";
  output.textContent = "";

  if (!rawUrl) {
    status.textContent = "URL을 입력하세요.";
    status.className = "status err";
    return;
  }

  try {
    const res = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: rawUrl,
        days,
        password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      status.textContent = "생성 실패: " + (data?.error || res.status);
      status.className = "status err";
      return;
    }

    output.textContent =
      `단축 URL: ${data.short_url}\n` +
      `원본 URL: ${data.url}\n` +
      `만료: ${data.expires_at}\n` +
      `비밀번호 보호: ${data.password_protected ? "O" : "X"}`;

    status.textContent = "생성 완료!";
    status.className = "status ok";

    // 결과 링크 저장 (복사 버튼용)
    window.__last_short_url__ = data.short_url;

  } catch (e) {
    status.textContent = "오류 발생: " + e;
    status.className = "status err";
  }
}

// ------------------------------
// 복사 기능
// ------------------------------
function copyShortLink() {
  const out = window.__last_short_url__;
  if (!out) return;

  navigator.clipboard.writeText(out).catch(() => {});
}

// ------------------------------
// 초기화 함수
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initShortenerPasswordToggle();
});

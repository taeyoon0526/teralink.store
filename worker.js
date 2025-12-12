/**
 * Cloudflare Workers - VPN/프록시 서버 사이드 체크 API
 * 엔드포인트: /api/vpn-check
 */

export default {
  async fetch(request, env, ctx) {
    // CORS 헤더 설정
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const clientData = await request.json();
      const result = await performServerSideChecks(request, clientData);

      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};

/**
 * 서버 사이드 VPN/프록시 체크
 */
async function performServerSideChecks(request, clientData) {
  const result = {
    serverChecks: {
      headers: {},
      ipReputation: {},
      geoConsistency: {},
      advancedDetection: {}
    },
    suspicionPoints: 0,
    reasons: []
  };

  // 1. HTTP 헤더 분석
  const headerCheck = analyzeHeaders(request);
  result.serverChecks.headers = headerCheck;
  result.suspicionPoints += headerCheck.suspicionPoints;
  if (headerCheck.reasons.length > 0) {
    result.reasons.push(...headerCheck.reasons);
  }

  // 2. Cloudflare 제공 정보 활용
  const cfData = extractCloudflareData(request);
  result.serverChecks.cloudflare = cfData;
  result.suspicionPoints += cfData.suspicionPoints;
  if (cfData.reasons.length > 0) {
    result.reasons.push(...cfData.reasons);
  }

  // 3. IP 평판 체크 (외부 API)
  try {
    const ip = request.headers.get('CF-Connecting-IP') || clientData.ip;
    const reputationCheck = await checkIPReputation(ip);
    result.serverChecks.ipReputation = reputationCheck;
    result.suspicionPoints += reputationCheck.suspicionPoints;
    if (reputationCheck.reasons.length > 0) {
      result.reasons.push(...reputationCheck.reasons);
    }
  } catch (error) {
    result.serverChecks.ipReputation.error = error.message;
  }

  // 4. 지리적 일관성 체크
  const geoCheck = checkGeoConsistency(request, clientData);
  result.serverChecks.geoConsistency = geoCheck;
  result.suspicionPoints += geoCheck.suspicionPoints;
  if (geoCheck.reasons.length > 0) {
    result.reasons.push(...geoCheck.reasons);
  }

  // 5. 고급 탐지 (ASN, 호스팅 감지 등)
  const advancedCheck = await performAdvancedDetection(request, clientData);
  result.serverChecks.advancedDetection = advancedCheck;
  result.suspicionPoints += advancedCheck.suspicionPoints;
  if (advancedCheck.reasons.length > 0) {
    result.reasons.push(...advancedCheck.reasons);
  }

  return result;
}

/**
 * 1. HTTP 헤더 분석
 * 프록시가 남기는 흔적 탐지
 */
function analyzeHeaders(request) {
  const result = {
    suspiciousHeaders: [],
    suspicionPoints: 0,
    reasons: []
  };

  // 프록시 관련 헤더 목록
  const proxyHeaders = [
    'X-Forwarded-For',
    'X-Forwarded-Host',
    'X-Forwarded-Proto',
    'X-Real-IP',
    'X-Client-IP',
    'X-ProxyUser-Ip',
    'Via',
    'Forwarded',
    'X-Proxy-ID',
    'X-Proxy-Connection',
    'Proxy-Connection',
    'X-Forwarded-Server',
    'X-Bluecoat-Via',
    'X-Coming-From',
    'X-Forwarded-By'
  ];

  for (const header of proxyHeaders) {
    const value = request.headers.get(header);
    if (value) {
      result.suspiciousHeaders.push({ header, value });
      result.suspicionPoints += 15;
      result.reasons.push(`프록시 헤더 감지: ${header}`);
    }
  }

  // VPN 특정 헤더
  const vpnHeaders = ['X-VPN', 'X-Nord-VPN', 'X-Proxy-Type'];
  for (const header of vpnHeaders) {
    if (request.headers.get(header)) {
      result.suspicionPoints += 40;
      result.reasons.push(`VPN 헤더 감지: ${header}`);
    }
  }

  // User-Agent 분석
  const userAgent = request.headers.get('User-Agent') || '';
  if (!userAgent || userAgent.length < 20) {
    result.suspicionPoints += 10;
    result.reasons.push('비정상적인 User-Agent');
  }

  // Accept-Language 누락 (봇/자동화 도구 의심)
  if (!request.headers.get('Accept-Language')) {
    result.suspicionPoints += 5;
    result.reasons.push('Accept-Language 헤더 누락');
  }

  return result;
}

/**
 * 2. Cloudflare 데이터 활용
 * CF가 제공하는 메타데이터 분석
 */
function extractCloudflareData(request) {
  const result = {
    country: null,
    threatScore: null,
    botManagement: null,
    suspicionPoints: 0,
    reasons: []
  };

  // Cloudflare가 감지한 국가
  result.country = request.headers.get('CF-IPCountry');

  // Cloudflare Threat Score (0-100, 높을수록 위험)
  const threatScore = request.headers.get('CF-Threat-Score');
  if (threatScore) {
    result.threatScore = parseInt(threatScore, 10);
    if (result.threatScore > 10) {
      result.suspicionPoints += result.threatScore;
      result.reasons.push(`Cloudflare Threat Score: ${result.threatScore}`);
    }
  }

  // CF Bot Management
  const botScore = request.headers.get('CF-Bot-Score');
  if (botScore) {
    result.botManagement = { score: parseInt(botScore, 10) };
    if (result.botManagement.score < 30) {
      result.suspicionPoints += 20;
      result.reasons.push('봇 가능성 높음 (CF Bot Score)');
    }
  }

  // Tor 감지
  if (request.headers.get('CF-Tor-Exit-Node') === '1') {
    result.suspicionPoints += 80;
    result.reasons.push('Tor Exit Node 감지 (Cloudflare)');
    result.isTor = true;
  }

  return result;
}

/**
 * 3. IP 평판 체크
 * 외부 API를 통한 IP 평판 조회
 */
async function checkIPReputation(ip) {
  const result = {
    isVPN: false,
    isProxy: false,
    isTor: false,
    isHosting: false,
    isSpam: false,
    suspicionPoints: 0,
    reasons: [],
    sources: []
  };

  try {
    // IPHub API (무료 1000회/일)
    const iphubResponse = await fetch(`https://v2.api.iphub.info/ip/${ip}`, {
      headers: {
        'X-Key': 'MzA1MjE6OUlSVENpZkdBMERXMzJpWGx6SEJvaWZpaElnaTk1UFU=' // 실제 키로 교체 필요
      }
    });

    if (iphubResponse.ok) {
      const iphubData = await iphubResponse.json();
      // block: 0 = 정상, 1 = VPN/프록시, 2 = 데이터센터
      if (iphubData.block === 1) {
        result.isVPN = true;
        result.suspicionPoints += 50;
        result.reasons.push('IPHub: VPN/프록시 감지');
        result.sources.push('iphub');
      } else if (iphubData.block === 2) {
        result.isHosting = true;
        result.suspicionPoints += 30;
        result.reasons.push('IPHub: 데이터센터/호스팅 감지');
        result.sources.push('iphub');
      }
    }
  } catch (error) {
    // IPHub 실패시 무시
  }

  try {
    // ProxyCheck.io API (무료 1000회/일)
    const proxyCheckResponse = await fetch(`https://proxycheck.io/v2/${ip}?vpn=1&asn=1`);
    
    if (proxyCheckResponse.ok) {
      const proxyData = await proxyCheckResponse.json();
      const ipInfo = proxyData[ip];
      
      if (ipInfo && ipInfo.proxy === 'yes') {
        result.isProxy = true;
        result.suspicionPoints += 50;
        result.reasons.push('ProxyCheck: 프록시 감지');
        result.sources.push('proxycheck');

        if (ipInfo.type === 'VPN') {
          result.isVPN = true;
          result.reasons.push('ProxyCheck: VPN 확인');
        }
      }
    }
  } catch (error) {
    // ProxyCheck 실패시 무시
  }

  try {
    // IPQualityScore API (무료 5000회/월)
    const ipqsResponse = await fetch(`https://ipqualityscore.com/api/json/ip/n0hXiA0tP5MMGuctT84vLRAdCfTdUvrE/${ip}?strictness=1&allow_public_access_points=true`);
    
    if (ipqsResponse.ok) {
      const ipqsData = await ipqsResponse.json();
      
      if (ipqsData.vpn) {
        result.isVPN = true;
        result.suspicionPoints += 50;
        result.reasons.push('IPQS: VPN 감지');
        result.sources.push('ipqs');
      }

      if (ipqsData.tor) {
        result.isTor = true;
        result.suspicionPoints += 80;
        result.reasons.push('IPQS: Tor 감지');
      }

      if (ipqsData.proxy) {
        result.isProxy = true;
        result.suspicionPoints += 40;
        result.reasons.push('IPQS: 프록시 감지');
      }

      // 사기 점수 (0-100)
      if (ipqsData.fraud_score > 75) {
        result.suspicionPoints += 30;
        result.reasons.push(`IPQS: 높은 사기 점수 (${ipqsData.fraud_score})`);
      }
    }
  } catch (error) {
    // IPQS 실패시 무시
  }

  return result;
}

/**
 * 4. 지리적 일관성 체크
 */
function checkGeoConsistency(request, clientData) {
  const result = {
    consistent: true,
    suspicionPoints: 0,
    reasons: []
  };

  const serverCountry = request.headers.get('CF-IPCountry');
  const clientCountry = clientData.location?.countryCode;

  if (serverCountry && clientCountry && serverCountry !== clientCountry) {
    result.consistent = false;
    result.suspicionPoints += 35;
    result.reasons.push(`국가 불일치: 서버(${serverCountry}) vs 클라이언트(${clientCountry})`);
  }

  // Accept-Language와 국가 일치 체크
  const acceptLang = request.headers.get('Accept-Language');
  if (acceptLang && serverCountry) {
    const langCountry = acceptLang.split(',')[0].split('-')[1]?.toUpperCase();
    if (langCountry && langCountry !== serverCountry && serverCountry !== 'US') {
      result.suspicionPoints += 10;
      result.reasons.push(`언어(${acceptLang})와 국가(${serverCountry}) 불일치`);
    }
  }

  return result;
}

/**
 * 5. 고급 탐지
 * ASN, 호스팅 공급자, IP 범위 등
 */
async function performAdvancedDetection(request, clientData) {
  const result = {
    asn: null,
    isHosting: false,
    isResidential: false,
    suspicionPoints: 0,
    reasons: []
  };

  const ip = request.headers.get('CF-Connecting-IP') || clientData.ip;
  
  try {
    // IP-API.com (무료, 제한 있음)
    const ipApiResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,isp,org,as,asname,mobile,proxy,hosting`);
    
    if (ipApiResponse.ok) {
      const data = await ipApiResponse.json();
      
      if (data.status === 'success') {
        result.asn = data.as;
        result.hosting = data.hosting;
        result.proxy = data.proxy;
        result.mobile = data.mobile;

        // 호스팅/데이터센터 감지
        if (data.hosting) {
          result.isHosting = true;
          result.suspicionPoints += 35;
          result.reasons.push('호스팅/데이터센터 IP 감지');
        }

        // 프록시 감지
        if (data.proxy) {
          result.suspicionPoints += 50;
          result.reasons.push('IP-API: 프록시 감지');
        }

        // ASN 기반 VPN 탐지
        const vpnAsns = [
          'AS396982', // Google Fiber (VPN 의심)
          'AS32934', // Facebook
          'AS16509', // Amazon
          'AS14061', // DigitalOcean
          // 더 많은 VPN ASN 추가 가능
        ];

        if (data.as && vpnAsns.includes(data.as.split(' ')[0])) {
          result.suspicionPoints += 25;
          result.reasons.push(`의심스러운 ASN: ${data.as}`);
        }
      }
    }
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

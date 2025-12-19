// Application Page Scripts v2.0
// VPN Check and Form Validation

// =============================
// VPN 실시간 검사
// =============================
async function checkVPN() {
    try {
        const res = await fetch("/__check_vpn");
        const data = await res.json();
        if (data.vpn === "blocked") {
            window.location.href = "/vpn/";
        }
    } catch (e) {
        // Silent fail
    }
}

// 5초마다 VPN 체크
setInterval(checkVPN, 5000);

// =============================
// 랜덤 문자열 생성 함수
// =============================
function generateRandomString(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// =============================
// 폼 검증 함수
// =============================
function validateForm() {
    const age = document.getElementById("age");
    const discord = document.getElementById("discord");
    const activeTime = document.getElementById("active_time");
    const reason = document.getElementById("reason");
    const resolution = document.getElementById("resolution");
    const operationExp = document.getElementById("operation_experience");
    const devExp = document.getElementById("dev_experience");

    // 나이 검증 (10-100세)
    if (!age.value || age.value < 10 || age.value > 100) {
        setStatus("나이를 올바르게 입력해주세요 (10-100세)", "error");
        age.focus();
        return false;
    }

    // 디스코드 닉네임 검증 (최소 3자)
    if (!discord.value || discord.value.trim().length < 3) {
        const randomSuggestion = generateRandomString(8);
        setStatus(`디스코드 닉네임이 너무 짧습니다. 랜덤 문자열을 추천합니다: ${randomSuggestion}`, "error");
        discord.focus();
        // 랜덤 문자열을 입력란에 자동으로 넣기
        discord.value = randomSuggestion;
        return false;
    }

    // 활동 가능 시간 검증 (최소 5자)
    if (!activeTime.value || activeTime.value.trim().length < 5) {
        setStatus("활동 가능 시간을 자세히 입력해주세요 (최소 5자)", "error");
        activeTime.focus();
        return false;
    }

    // 지원 동기 검증 (최소 20자)
    if (!reason.value || reason.value.trim().length < 20) {
        setStatus("지원 동기를 자세히 작성해주세요 (최소 20자)", "error");
        reason.focus();
        return false;
    }

    // 각오 검증 (최소 20자)
    if (!resolution.value || resolution.value.trim().length < 20) {
        setStatus("각오를 자세히 작성해주세요 (최소 20자)", "error");
        resolution.focus();
        return false;
    }

    // 운영 경험 검증 (최소 10자)
    if (!operationExp.value || operationExp.value.trim().length < 10) {
        setStatus("운영 경험을 자세히 작성해주세요 (최소 10자)", "error");
        operationExp.focus();
        return false;
    }

    // 해킹/개발 경험 검증 (최소 10자)
    if (!devExp.value || devExp.value.trim().length < 10) {
        setStatus("해킹/개발 경험을 자세히 작성해주세요 (최소 10자)", "error");
        devExp.focus();
        return false;
    }

    return true;
}

// =============================
// Webhook 제출 처리
// =============================
const WEBHOOK_URL = "https://discord.com/api/webhooks/1447521453145587733/HKUQbSR44_2R5CXrTEyuDoWpL8vtz9G4bdKT9BfoOOh5cPj22_ygwnG8Hz-heUC2Vrx4";

let userIp = "조회 중…";

async function fetchUserIp() {
    try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        userIp = data.ip;
    } catch (e) {
        userIp = "알 수 없음";
    }
}

function setStatus(msg, type) {
    try {
        const el = document.getElementById("status-message");
        if (el) {
            el.textContent = msg;
            el.className = type ? "status--" + type : "";
        }
    } catch (e) {
        // Silent fail
    }
}

async function sendWebhook(payload) {
    const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Webhook error");
}

// =============================
// 폼 제출 처리
// =============================
async function handleFormSubmit(event) {
    event.preventDefault();

    // 1. VPN 체크
    try {
        const res = await fetch("/__check_vpn");
        const data = await res.json();
        if (data.vpn === "blocked") {
            window.location.href = "/vpn/";
            return;
        }
    } catch (e) {
        // VPN 체크 실패 시 계속 진행
    }

    // 2. 폼 검증
    if (!validateForm()) {
        return;
    }

    // 3. 제출 시작
    const btn = document.getElementById("submit-button");
    const loader = document.getElementById("submitting-indicator");
    const form = document.getElementById("application-form");

    if (btn) btn.disabled = true;
    if (loader) loader.style.display = "block";
    setStatus("제출 중입니다…");

    // 5. 폼 데이터 수집
    const age = document.getElementById("age").value.trim();
    const discord = document.getElementById("discord").value.trim();
    const activeTime = document.getElementById("active_time").value.trim();
    const reason = document.getElementById("reason").value.trim();
    const resolution = document.getElementById("resolution").value.trim();
    const operationExp = document.getElementById("operation_experience").value.trim();
    const devExp = document.getElementById("dev_experience").value.trim();

    // 6. Discord Webhook 페이로드 생성
    const payload = {
        embeds: [
            {
                title: "📥 새 관리자 지원서가 도착했습니다",
                color: 0x00ff00,
                fields: [
                    { name: "나이", value: age || "N/A", inline: true },
                    { name: "디스코드 닉네임", value: discord || "N/A", inline: true },
                    { name: "활동 가능 시간", value: activeTime || "N/A" },
                    { name: "지원 동기", value: reason.length > 1024 ? reason.substring(0, 1021) + "..." : reason },
                    { name: "각오", value: resolution.length > 1024 ? resolution.substring(0, 1021) + "..." : resolution },
                    { name: "운영 경험", value: operationExp.length > 1024 ? operationExp.substring(0, 1021) + "..." : operationExp },
                    { name: "해킹/개발 경험", value: devExp.length > 1024 ? devExp.substring(0, 1021) + "..." : devExp }
                ],
                footer: { text: "사용자 IP: " + userIp + " | Turnstile 인증 완료" },
                timestamp: new Date().toISOString()
            }
        ]
    };

    // 7. Webhook 전송
    try {
        await sendWebhook(payload);
        setStatus("✅ 제출 완료! 검토 후 연락드리겠습니다.", "success");
        form.reset();
        
        // Turnstile 리셋
        if (window.turnstile) {
            turnstile.reset();
        }
    } catch (e) {
        setStatus("❌ 오류 발생 – 다시 시도해 주세요.", "error");
    }

    // 8. 버튼 활성화
    if (loader) loader.style.display = "none";
    if (btn) btn.disabled = false;
}

// =============================
// 초기화
// =============================
function initApplicationForm() {
    try {
        // IP 가져오기
        fetchUserIp();

        // 폼 제출 이벤트
        const form = document.getElementById("application-form");
        if (!form) return;

        form.addEventListener("submit", handleFormSubmit);

        // 실시간 검증 메시지 제거
        const inputs = form.querySelectorAll("input, textarea");
        inputs.forEach(input => {
            input.addEventListener("input", () => {
                if (input.value.trim().length > 0) {
                    setStatus("", "");
                }
            });
        });

    } catch (e) {
        console.error("Form initialization error:", e);
    }
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApplicationForm);
} else {
    initApplicationForm();
}

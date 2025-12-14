// Application Page Scripts v1.0
// VPN Check and Form Validation

// =============================
// VPN 실시간 검사
// =============================
async function checkVPN() {
    try {
        const res = await fetch("/__check_vpn");
        const data = await res.json();
        if (data.vpn === "blocked") {
            window.location.href = "/vpn.html";
        }
    } catch (e) {
        // Silent fail
    }
}

// 5초마다 VPN 체크
setInterval(checkVPN, 5000);

// =============================
// 제출하기 눌렀을 때 최종 검사
// =============================
async function finalSubmitCheck(event) {
    try {
        event.preventDefault();

        const res = await fetch("/__check_vpn");
        const data = await res.json();

        if (data.vpn === "blocked") {
            window.location.href = "/vpn.html";
            return;
        }

        // VPN이 아니면 폼 제출 실행
        const form = document.getElementById("application-form");
        if (form) {
            form.dispatchEvent(new Event("submit-real"));
        }
    } catch (e) {
        // 오류 시에도 제출 허용
        const form = document.getElementById("application-form");
        if (form) {
            form.dispatchEvent(new Event("submit-real"));
        }
    }
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

// 초기화
function initApplicationForm() {
    try {
        // IP 가져오기
        fetchUserIp();

        // 폼 제출 이벤트
        const form = document.getElementById("application-form");
        if (!form) return;

        form.addEventListener("submit-real", async function() {
            const btn = document.getElementById("submit-button");
            const loader = document.getElementById("submitting-indicator");
            const age = document.getElementById("age");
            const discord = document.getElementById("discord");
            const active_time = document.getElementById("active_time");
            const operation_experience = document.getElementById("operation_experience");
            const reason = document.getElementById("reason");
            const resolution = document.getElementById("resolution");
            const dev_experience = document.getElementById("dev_experience");

            if (btn) btn.disabled = true;
            if (loader) loader.style.display = "block";
            setStatus("제출 중입니다…");

            const payload = {
                embeds: [
                    {
                        title: "📥 새 관리자 지원서가 도착했습니다",
                        color: 0xff0000,
                        fields: [
                            { name: "나이", value: age ? age.value.trim() : "N/A", inline: true },
                            { name: "디스코드 닉네임", value: discord ? discord.value.trim() : "N/A", inline: true },
                            { name: "활동 가능 시간", value: active_time ? active_time.value.trim() : "N/A" },
                            { name: "운영 경험", value: operation_experience ? operation_experience.value.trim() : "N/A" },
                            { name: "지원 동기", value: reason ? reason.value.trim() : "N/A" },
                            { name: "각오", value: resolution ? resolution.value.trim() : "N/A" },
                            { name: "해킹/개발 경험", value: dev_experience ? dev_experience.value.trim() : "N/A" }
                        ],
                        footer: { text: "사용자 IP: " + userIp },
                        timestamp: new Date().toISOString()
                    }
                ]
            };

            try {
                await sendWebhook(payload);
                setStatus("제출 완료!", "success");
                form.reset();
            } catch (e) {
                setStatus("오류 발생 – 다시 시도해 주세요.", "error");
            }

            if (loader) loader.style.display = "none";
            if (btn) btn.disabled = false;
        });
    } catch (e) {
        // Silent fail
    }
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApplicationForm);
} else {
    initApplicationForm();
}

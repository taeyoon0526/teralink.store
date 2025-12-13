// Lite Index Page Scripts
// Interactive animations and effects

// 마우스 위치에 따라 그라데이션 변경
document.addEventListener('mousemove', function(e) {
    try {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.body.style.setProperty('--x', x + '%');
        document.body.style.setProperty('--y', y + '%');
    } catch (err) {
        // Silent fail
    }
});

// 파티클 생성
function createParticles() {
    try {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        const particleCount = 30;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 3 + 's';
            particle.style.animationDuration = (Math.random() * 2 + 3) + 's';
            particlesContainer.appendChild(particle);
        }
    } catch (err) {
        // Silent fail
    }
}

// 페이지 로드 시 파티클 생성
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createParticles);
} else {
    createParticles();
}

// 버튼 클릭 이벤트
function showMessage(e) {
    try {
        e.preventDefault();
        const button = e.target;
        const originalText = button.textContent;

        button.textContent = '🎉 Success!';
        button.style.transform = 'scale(1.1)';

        setTimeout(function() {
            button.textContent = originalText;
            button.style.transform = '';
        }, 1500);
    } catch (err) {
        // Silent fail
    }
}

// Learn More 버튼 클릭 이벤트
function showInfo(e) {
    try {
        e.preventDefault();
        const button = e.target;
        const originalText = button.textContent;

        button.textContent = '📚 Coming Soon!';
        button.style.transform = 'scale(1.1)';

        setTimeout(function() {
            button.textContent = originalText;
            button.style.transform = '';
        }, 1500);
    } catch (err) {
        // Silent fail
    }
}

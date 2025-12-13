// Security Protection v1.0 - Cloudflare Pages
(function() {
    'use strict';

    const CONFIG = {
        redirectUrl: 'https://www.google.com',
        checkInterval: 1000
    };

    function showWarning() {
        if (CONFIG.redirectUrl) {
            window.location.href = CONFIG.redirectUrl;
        }
    }

    // 우클릭 차단
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    }, true);

    // 키보드 단축키 차단 (F12, Ctrl+Shift+I/J/C, Ctrl+U 등)
    document.addEventListener('keydown', function(e) {
        if (e.keyCode === 123 ||
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) ||
            (e.ctrlKey && e.shiftKey && e.keyCode === 74) ||
            (e.ctrlKey && e.shiftKey && e.keyCode === 67) ||
            (e.ctrlKey && e.keyCode === 85) ||
            (e.metaKey && e.altKey && (e.keyCode === 73 || e.keyCode === 74)) ||
            (e.metaKey && e.keyCode === 85)) {
            e.preventDefault();
            showWarning();
            return false;
        }
    }, true);

    // 디버거 트랩
    setInterval(function() {
        (function() {
            try {
                debugger;
            } catch (e) {}
        })();
    }, 100);

    // 소스 보기 차단
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    }, true);

    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    }, true);

    // CSS 선택 차단
    const style = document.createElement('style');
    style.textContent = '* { -webkit-user-select: none !important; -moz-user-select: none !important; user-select: none !important; } input, textarea { -webkit-user-select: text !important; user-select: text !important; }';
    document.head.appendChild(style);

    // iframe 차단
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // 자동화 도구 감지
    if (navigator.webdriver) {
        showWarning();
    }

})();

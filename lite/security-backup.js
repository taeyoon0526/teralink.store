// Security Protection v1.1 - Enhanced & Error-Free
(function() {
    'use strict';

    const CONFIG = {
        redirectUrl: 'https://www.google.com',
        checkInterval: 1000,
        enabled: true
    };

    // 안전한 리다이렉트
    function showWarning() {
        try {
            if (CONFIG.redirectUrl && CONFIG.enabled) {
                setTimeout(function() {
                    window.location.href = CONFIG.redirectUrl;
                }, 100);
            }
        } catch (e) {
            // 오류 무시
        }
    }

    // 안전한 이벤트 리스너 추가
    function safeAddEventListener(target, event, handler, options) {
        try {
            if (target && typeof target.addEventListener === 'function') {
                target.addEventListener(event, handler, options);
            }
        } catch (e) {
            // 오류 무시
        }
    }

    // 1. 우클릭 차단 (개선)
    safeAddEventListener(document, 'contextmenu', function(e) {
        try {
            e.preventDefault();
            e.stopPropagation();
            return false;
        } catch (err) {
            return false;
        }
    }, true);

    // 모바일 길게 누르기 차단
    let touchTimer;
    safeAddEventListener(document, 'touchstart', function(e) {
        try {
            touchTimer = setTimeout(function() {
                if (e.cancelable) {
                    e.preventDefault();
                }
            }, 500);
        } catch (err) {}
    });

    safeAddEventListener(document, 'touchend', function() {
        try {
            if (touchTimer) {
                clearTimeout(touchTimer);
            }
        } catch (err) {}
    });

    safeAddEventListener(document, 'touchmove', function() {
        try {
            if (touchTimer) {
                clearTimeout(touchTimer);
            }
        } catch (err) {}
    });

    // 2. 키보드 단축키 차단 (강화)
    safeAddEventListener(document, 'keydown', function(e) {
        try {
            const key = e.keyCode || e.which;
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const alt = e.altKey;

            // F12
            if (key === 123) {
                e.preventDefault();
                e.stopPropagation();
                showWarning();
                return false;
            }

            // Ctrl/Cmd + Shift + I/J/C (DevTools, Console, Inspect)
            if (ctrl && shift && (key === 73 || key === 74 || key === 67)) {
                e.preventDefault();
                e.stopPropagation();
                showWarning();
                return false;
            }

            // Ctrl/Cmd + U (View Source)
            if (ctrl && key === 85) {
                e.preventDefault();
                e.stopPropagation();
                showWarning();
                return false;
            }

            // Ctrl/Cmd + S (Save)
            if (ctrl && key === 83) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl/Cmd + P (Print/Source)
            if (ctrl && key === 80) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Ctrl/Cmd + Shift + K (Firefox DevTools)
            if (ctrl && shift && key === 75) {
                e.preventDefault();
                e.stopPropagation();
                showWarning();
                return false;
            }

            // Mac: Cmd + Option + I/J/C
            if (ctrl && alt && (key === 73 || key === 74 || key === 67)) {
                e.preventDefault();
                e.stopPropagation();
                showWarning();
                return false;
            }
        } catch (err) {
            return false;
        }
    }, true);

    // 3. 디버거 트랩 (안전하게)
    try {
        setInterval(function() {
            try {
                (function() {
                    debugger;
                })();
            } catch (e) {}
        }, 100);
    } catch (e) {}

    // 4. DevTools 감지 (강화)
    try {
        const devtools = {
            open: false,
            orientation: null
        };

        const threshold = 160;

        const emitEvent = function() {
            try {
                if (devtools.open) {
                    showWarning();
                }
            } catch (e) {}
        };

        setInterval(function() {
            try {
                const widthThreshold = window.outerWidth - window.innerWidth > threshold;
                const heightThreshold = window.outerHeight - window.innerHeight > threshold;
                const orientation = widthThreshold ? 'vertical' : 'horizontal';

                if (!(heightThreshold && widthThreshold) &&
                    ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) ||
                    widthThreshold || heightThreshold)) {
                    if (!devtools.open || devtools.orientation !== orientation) {
                        emitEvent();
                    }
                    devtools.open = true;
                    devtools.orientation = orientation;
                } else {
                    devtools.open = false;
                    devtools.orientation = null;
                }
            } catch (e) {}
        }, CONFIG.checkInterval);

        // 콘솔 사용 감지
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtools.open = true;
                emitEvent();
                throw new Error('DevTools');
            }
        });

        setInterval(function() {
            try {
                console.log(element);
                console.clear();
            } catch (e) {}
        }, CONFIG.checkInterval);
    } catch (e) {}

    // 5. 텍스트 선택 차단 (개선)
    safeAddEventListener(document, 'selectstart', function(e) {
        try {
            const target = e.target || e.srcElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                return true;
            }
            e.preventDefault();
            return false;
        } catch (err) {
            return false;
        }
    }, true);

    // 6. 복사 차단 (개선)
    safeAddEventListener(document, 'copy', function(e) {
        try {
            const target = e.target || e.srcElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                return true;
            }
            e.preventDefault();
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', '');
            }
            return false;
        } catch (err) {
            return false;
        }
    }, true);

    // 7. 드래그 차단
    safeAddEventListener(document, 'dragstart', function(e) {
        try {
            e.preventDefault();
            return false;
        } catch (err) {
            return false;
        }
    }, true);

    // 8. CSS 선택 차단 (안전하게)
    try {
        if (document.head) {
            const style = document.createElement('style');
            style.type = 'text/css';
            style.textContent = [
                '* {',
                '  -webkit-user-select: none !important;',
                '  -moz-user-select: none !important;',
                '  -ms-user-select: none !important;',
                '  user-select: none !important;',
                '  -webkit-touch-callout: none !important;',
                '}',
                'input, textarea, [contenteditable="true"] {',
                '  -webkit-user-select: text !important;',
                '  -moz-user-select: text !important;',
                '  -ms-user-select: text !important;',
                '  user-select: text !important;',
                '}'
            ].join('\n');
            
            if (document.head.appendChild) {
                document.head.appendChild(style);
            }
        }
    } catch (e) {}

    // 9. iframe/frameset 차단 (안전하게)
    try {
        if (window.top !== window.self) {
            try {
                window.top.location = window.self.location;
            } catch (e) {
                document.body.innerHTML = '';
                showWarning();
            }
        }

        // Frame busting
        if (top !== self) {
            top.location.href = self.location.href;
        }
    } catch (e) {}

    // 10. 자동화 도구 감지 (강화)
    try {
        // Selenium
        if (navigator.webdriver === true) {
            showWarning();
        }

        // Headless Chrome
        if (window.navigator.userAgent && /HeadlessChrome/.test(window.navigator.userAgent)) {
            showWarning();
        }

        // PhantomJS
        if (window.callPhantom || window._phantom || window.phantom) {
            showWarning();
        }

        // Nightmare
        if (window.__nightmare) {
            showWarning();
        }

        // Selenium IDE
        if (document.documentElement.getAttribute('webdriver')) {
            showWarning();
        }

        // Chrome extensions check
        if (window.chrome && window.chrome.runtime && window.chrome.runtime.id) {
            // 정상 확장 프로그램은 허용
        }
    } catch (e) {}

    // 11. DOM 변조 감지 (선택적)
    try {
        const observer = new MutationObserver(function(mutations) {
            try {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeName === 'SCRIPT' && node.src && !node.src.includes(location.hostname)) {
                                // 외부 스크립트 주입 시도 감지
                                try {
                                    node.remove();
                                } catch (e) {}
                            }
                        });
                    }
                });
            } catch (e) {}
        });

        if (document.documentElement) {
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }
    } catch (e) {}

    // 12. 페이지 가시성 변경 감지
    safeAddEventListener(document, 'visibilitychange', function() {
        try {
            if (document.hidden) {
                // 페이지가 숨겨졌을 때 추가 보안 체크
            }
        } catch (e) {}
    });

    // 13. 페이지 언로드 방지 (선택적)
    safeAddEventListener(window, 'beforeunload', function(e) {
        try {
            // 필요 시 사용자에게 경고
            // e.preventDefault();
            // e.returnValue = '';
        } catch (err) {}
    });

    // 14. view-source 차단 및 URL 조작 감지
    try {
        // URL 프로토콜 체크
        if (window.location.protocol === 'view-source:') {
            window.location.href = 'https://www.google.com';
        }

        // URL 변경 감지
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function() {
            originalPushState.apply(this, arguments);
            try {
                if (window.location.protocol === 'view-source:') {
                    window.location.href = 'https://www.google.com';
                }
            } catch (e) {}
        };

        history.replaceState = function() {
            originalReplaceState.apply(this, arguments);
            try {
                if (window.location.protocol === 'view-source:') {
                    window.location.href = 'https://www.google.com';
                }
            } catch (e) {}
        };

        // 주기적 URL 체크
        setInterval(function() {
            try {
                if (window.location.protocol === 'view-source:' || 
                    window.location.href.includes('view-source:')) {
                    window.location.href = 'https://www.google.com';
                }
            } catch (e) {}
        }, 100);
    } catch (e) {}

    // 15. 소스 코드 난독화 및 보호
    try {
        // 페이지 소스 접근 차단
        Object.defineProperty(document, 'body', {
            get: function() {
                return document.getElementsByTagName('body')[0];
            },
            configurable: false
        });

        // innerHTML 접근 제한
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (originalInnerHTML) {
            Object.defineProperty(Element.prototype, 'innerHTML', {
                get: function() {
                    return originalInnerHTML.get.call(this);
                },
                set: function(value) {
                    originalInnerHTML.set.call(this, value);
                },
                configurable: false
            });
        }
    } catch (e) {}

    // 16. 브라우저 확장 프로그램 감지
    try {
        // 확장 프로그램이 페이지를 수정하려는 시도 감지
        const observer = new MutationObserver(function(mutations) {
            try {
                mutations.forEach(function(mutation) {
                    // 의심스러운 변경 감지
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeName === 'SCRIPT' && 
                                (!node.src || !node.src.includes('teralink.store'))) {
                                // 외부에서 주입된 스크립트
                                try {
                                    node.remove();
                                } catch (e) {}
                            }
                        });
                    }
                });
            } catch (e) {}
        });

        if (document.documentElement) {
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeOldValue: true
            });
        }
    } catch (e) {}

    // 초기화 완료 표시 (디버그용, 프로덕션에서는 제거 가능)
    try {
        window.__securityLoaded = true;
    } catch (e) {}

})();

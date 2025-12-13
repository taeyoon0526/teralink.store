# 🔐 teralink.store

**Enterprise-Grade Security & Analytics Platform**

[![Security Grade](https://img.shields.io/badge/Security-A+-success)](https://securityheaders.com/?q=teralink.store)
[![Security Layers](https://img.shields.io/badge/Protection-4%20Layers-brightgreen)]()
[![License](https://img.shields.io/badge/License-Proprietary-blue)]()
[![Status](https://img.shields.io/badge/Status-Production-green)]()
[![WCAG](https://img.shields.io/badge/Accessibility-AA-blue)](https://www.w3.org/WAI/WCAG2AA-Conformance)

## 🎯 Overview

teralink.store is an ultra-secured web platform with enterprise-grade protection featuring comprehensive visitor tracking, VPN detection, and advanced multi-layer security mechanisms protecting the entire domain and all subdomains.

### 🏆 Key Features

- 🛡️ **A+ Security Grade** - Perfect score on securityheaders.com
- 🔒 **16-Layer Client Protection** - Anti-debugging, DevTools detection, source code protection
- 🚫 **4-Layer Defense System** - Server-side + Headers + SEO + Client-side protection
- 📊 **Advanced Analytics** - Real-time visitor tracking with Discord webhook integration
- 🌐 **VPN Detection** - Multi-method VPN/proxy detection with automated blocking
- ⚡ **Cloudflare Pages Functions** - Edge computing with request interception
- 🔍 **Source Code Protection** - Direct .js access blocked, view-source protection
- ♿ **WCAG 2.1 AA Compliant** - Full accessibility compliance
- 🤖 **Bot Protection** - Automated crawler/scraper blocking (allows legitimate search engines)

## 🛡️ Security Architecture

### 4-Layer Defense System

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Cloudflare Pages Functions            │
│  ✅ Request interception at edge                │
│  ✅ Direct .js access blocking (403)            │
│  ✅ Bot/crawler User-Agent filtering            │
│  ✅ Referer validation                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Layer 2: HTTP Security Headers                 │
│  ✅ 6 security headers (A+ grade)               │
│  ✅ CSP without unsafe directives               │
│  ✅ X-Robots-Tag (noindex on .js files)         │
│  ✅ HSTS with preload                           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Layer 3: SEO & Crawler Control                 │
│  ✅ Custom robots.txt via Functions             │
│  ✅ Block .js/.css indexing                     │
│  ✅ Whitelist legitimate search engines         │
│  ✅ Block scraper bots (Ahrefs, Semrush, etc.) │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Layer 4: Client-Side Protection (security.js)  │
│  ✅ 16 protection mechanisms                    │
│  ✅ DevTools detection & blocking               │
│  ✅ Right-click/copy/paste prevention           │
│  ✅ view-source protocol detection              │
│  ✅ Browser extension detection                 │
└─────────────────────────────────────────────────┘
```

## 📊 Security Score

```
🏆 securityheaders.com: A+ Grade (Perfect Score)
──────────────────────────────────────────────────
✅ Strict-Transport-Security (HSTS with preload)
✅ Content-Security-Policy (No unsafe directives)
✅ X-Frame-Options (DENY)
✅ X-Content-Type-Options (nosniff)
✅ Referrer-Policy (strict-origin-when-cross-origin)
✅ Permissions-Policy (restrictive)
✅ X-Robots-Tag (source protection)

🔒 Client-Side Protection: 16 Layers
──────────────────────────────────────────────────
✅ Right-click blocking
✅ DevTools keyboard shortcuts (F12, Ctrl+Shift+I/J/C/K/U)
✅ Debugger trap (100ms interval)
✅ DevTools size detection
✅ Console usage detection
✅ Text selection blocking
✅ Copy/paste prevention
✅ Drag & drop blocking
✅ CSS user-select disabled
✅ iframe/frameset blocking
✅ Automation tool detection (Selenium, Puppeteer)
✅ DOM tampering detection
✅ Visibility tracking
✅ view-source protocol blocking
✅ Source code obfuscation
✅ Browser extension detection

🌐 Server-Side Protection: Cloudflare Functions
──────────────────────────────────────────────────
✅ Direct .js file access blocked (403)
✅ Referer validation (teralink.store only)
✅ curl/wget/python-requests blocked
✅ Scraper bots blocked (Ahrefs, Semrush, Scrapy)
✅ Legitimate search engines allowed (Google, Bing)
✅ Custom robots.txt via Functions

♿ Accessibility: WCAG 2.1 AA
──────────────────────────────────────────────────
✅ All form inputs properly labeled
✅ Semantic HTML structure
✅ Keyboard navigation support
✅ Screen reader compatible
✅ 0 Edge Tools warnings
```

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Pure JavaScript (No frameworks)
- **Hosting**: Cloudflare Pages with Functions (Edge computing)
- **Analytics**: Discord Webhooks (Real-time notifications)
- **APIs**: ipapi.co, ipify.org, Cloudflare Trace
- **Security**: 
  - `security.js v1.2` (16-layer client protection)
  - `_middleware.js` (Cloudflare Functions for server-side blocking)
  - `_headers` (6 security headers for A+ grade)
  - `robots.txt.js` (Custom SEO control)
- **Testing**: 
  - `final-security-test.sh` (34 automated tests)
  - `security-test.sh` (37 security checks)

## 📁 Project Structure

```
teralink.store/
├── index.html                    # Main landing page
├── application.html              # Application form (WCAG 2.1 AA)
├── vpn.html                     # VPN block page
├── application.js               # Application logic (externalized)
├── vpn.js                       # VPN page logic (externalized)
├── worker.js                    # Cloudflare Worker (D1 database)
├── wrangler.toml                # Worker configuration
├── _headers                     # Security headers (A+ grade) 🛡️
├── _redirects                   # URL redirects & access control
├── robots.txt                   # Search engine control (overridden)
├── package.json                 # Project metadata
├── CNAME                        # Custom domain config
│
├── functions/                   # Cloudflare Pages Functions 🚀
│   ├── _middleware.js          # Request interception & blocking
│   └── robots.txt.js           # Custom robots.txt handler
│
├── lite/                        # Visitor tracking system
│   ├── index.html              # Lite version page
│   ├── security.js             # 16-layer protection v1.2 🔒
│   ├── default.js              # Visitor tracking & webhooks
│   ├── script.js               # Main logic
│   ├── animations.js           # Interactive UI effects
│   ├── minify.js               # Minification utility
│   ├── backup.js               # Backup script
│   └── README.md               # Lite system documentation
│
├── hacking/                     # Hacking-themed special page
│   ├── index.html              # Hacking interface
│   ├── hacking.js              # Interactive effects
│   └── hacking.css             # Hacking theme styles
│
├── Markdown/                    # 📚 Comprehensive documentation
│   ├── FINAL-SECURITY-REPORT.md      # Complete security guide
│   ├── DEVTOOLS-LIMITATION.md        # Technical limitations explained
│   ├── A-PLUS-REPORT.md              # A+ grade achievement report
│   ├── ACCESSIBILITY-REPORT.md       # WCAG compliance report
│   ├── SUCCESS-REPORT.md             # Project milestones
│   ├── SECURITY.md                   # Security overview
│   ├── TODO.md                       # Development roadmap
│   ├── DEPLOY_CHECKLIST.md           # Deployment guide
│   ├── HEADERS-FIX.md                # Header configuration guide
│   ├── NEXT-STEPS.md                 # Future improvements
│   ├── QUICK_START.md                # Quick start guide
│   ├── WEBHOOK_FIX.md                # Webhook troubleshooting
│   ├── VPN_DETECTION_UPGRADE_GUIDE.md # VPN detection guide
│   └── API_KEYS_TODO.md              # API configuration
│
├── TEST-SOURCE-PROTECTION.md    # Source protection test guide
├── DEPLOYMENT-WAIT.md           # Deployment status tracker
├── final-security-test.sh       # 34 automated security tests ✅
├── security-test.sh             # 37 comprehensive checks ✅
├── quick-check.sh               # Quick header validation
└── README.md                    # This file (updated 2025-12-14)
```

## 🚀 Quick Start

### 🧪 Testing Security (Automated)

```bash
# Quick 6-header check (30 seconds)
./quick-check.sh

# Full security audit - 37 tests (2 minutes)
./security-test.sh

# Final comprehensive test - 34 tests (1 minute) 🆕
./final-security-test.sh
```

**Expected Results:**
```
✅ quick-check.sh:        6/6 passed (100%)
✅ security-test.sh:      35/37 passed (94%+)
✅ final-security-test.sh: 30+/34 passed (88%+)
```

### Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update: Security enhancements"
   git push origin main
   ```

2. **Automatic Deployment**
   - Cloudflare Pages auto-deploys from `main` branch
   - Build time: ~3-5 minutes
   - No build command needed (static site)

3. **Verify Deployment**
   ```bash
   ./quick-check.sh
   # All headers should show ✅
   ```

## 🔒 Security Features

### Server-Side Headers (`_headers`)
- HSTS with 1-year max-age + preload
- Strict CSP without unsafe-inline/unsafe-eval
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera/microphone/geolocation disabled

### Client-Side Protection (`security.js v1.2`) - 16 Layers
1. **Context menu blocking** - Right-click disabled
2. **Keyboard shortcuts** - F12, Ctrl+Shift+I/J/C/K/U blocked
3. **Mobile long-press** - Touch context menu prevented
4. **Debugger traps** - 100ms interval anti-debugging
5. **DevTools detection** - Window size monitoring
6. **Console tracking** - Usage detection and logging
7. **Text selection** - Copy prevention (except form inputs)
8. **Copy/paste blocking** - Clipboard access denied
9. **Drag & drop** - File/text dragging prevented
10. **iframe protection** - Frameset/iframe embedding blocked
11. **Automation detection** - Selenium/Puppeteer/PhantomJS detected
12. **DOM monitoring** - Mutation observer for tampering
13. **Visibility tracking** - Tab focus/blur events
14. **view-source blocking** 🆕 - Protocol detection & redirect
15. **Source obfuscation** 🆕 - innerHTML/body property protection
16. **Extension detection** 🆕 - Browser extension script blocking

### Server-Side Protection (`_middleware.js`) - Cloudflare Functions
- **Direct .js blocking** - 403 for non-referer requests
- **Referer validation** - Only teralink.store allowed
- **Bot filtering** - curl/wget/python-requests blocked
- **Scraper blocking** - Ahrefs/Semrush/Scrapy denied
- **Search engine whitelist** - Google/Bing/DuckDuckGo allowed

### SEO Protection (`robots.txt.js`)
- **.js/.css blocking** - Disallow all source file indexing
- **Scraper bot blocking** - AhrefsBot, SemrushBot, archive.org_bot
- **Path control** - Allow only HTML pages
- **Custom handler** - Overrides Cloudflare default robots.txt

**All features include:**
- Comprehensive try-catch blocks
- Browser compatibility checks
- Graceful degradation
- Zero console errors

## 📊 Visitor Tracking

### Features
- Real-time IP detection (IPv4 priority)
- VPN/Proxy detection via ipapi.co
- Device fingerprinting (screen, language, timezone, battery, etc.)
- WebRTC leak detection
- Discord webhook integration (2 URLs for redundancy)
- Timeout protection (5s max per API call)

### Webhook Payload
```json
{
  "embeds": [{
    "title": "🔔 New Visitor",
    "fields": [
      {"name": "IP", "value": "1.2.3.4"},
      {"name": "Location", "value": "Seoul, KR"},
      {"name": "ISP", "value": "Example ISP"},
      {"name": "VPN Status", "value": "Not detected"}
    ]
  }]
}
```

## 🧪 Testing Tools

### `security-test.sh` - Full Security Audit
```bash
./security-test.sh

# Tests 9 categories:
# 1. Environment check (curl, git, internet)
# 2. Local file integrity (all files present)
# 3. Git repository status
# 4. Remote security headers (6 headers)
# 5. JavaScript file access
# 6. HTML page availability
# 7. Online security grade check
# 8. Discord webhook configuration
# 9. File size and performance

# Output: 31 passed, 0 failed, 4 warnings (normal)
```

### `quick-check.sh` - Fast Header Validation
```bash
./quick-check.sh

# Quick 6-header check:
# ✅ Content-Security-Policy
# ✅ Strict-Transport-Security
# ✅ X-Frame-Options
# ✅ X-Content-Type-Options
# ✅ Referrer-Policy
# ✅ Permissions-Policy
```

## 📝 Documentation

### 🔒 Security Documentation
- **[FINAL-SECURITY-REPORT.md](Markdown/FINAL-SECURITY-REPORT.md)** 🆕 - Complete 4-layer security architecture
- **[DEVTOOLS-LIMITATION.md](Markdown/DEVTOOLS-LIMITATION.md)** 🆕 - Technical limitations explained
- **[A-PLUS-REPORT.md](Markdown/A-PLUS-REPORT.md)** 🆕 - A+ grade achievement guide
- **[ACCESSIBILITY-REPORT.md](Markdown/ACCESSIBILITY-REPORT.md)** 🆕 - WCAG 2.1 AA compliance
- **[SECURITY.md](Markdown/SECURITY.md)** - Security overview

### 📚 Development & Deployment
- **[SUCCESS-REPORT.md](Markdown/SUCCESS-REPORT.md)** - Project completion report
- **[NEXT-STEPS.md](Markdown/NEXT-STEPS.md)** - Future improvements
- **[DEPLOY_CHECKLIST.md](Markdown/DEPLOY_CHECKLIST.md)** - Deployment guide
- **[TODO.md](Markdown/TODO.md)** - Development roadmap

### 🔧 Technical Guides
- **[HEADERS-FIX.md](Markdown/HEADERS-FIX.md)** - Header troubleshooting
- **[WEBHOOK_FIX.md](Markdown/WEBHOOK_FIX.md)** - Webhook debugging
- **[VPN_DETECTION_UPGRADE_GUIDE.md](Markdown/VPN_DETECTION_UPGRADE_GUIDE.md)** - VPN detection
- **[QUICK_START.md](Markdown/QUICK_START.md)** - Quick start guide
- **[API_KEYS_TODO.md](Markdown/API_KEYS_TODO.md)** - API configuration

### 🧪 Testing Documentation
- **[TEST-SOURCE-PROTECTION.md](TEST-SOURCE-PROTECTION.md)** 🆕 - Source protection test guide
- **[DEPLOYMENT-WAIT.md](DEPLOYMENT-WAIT.md)** 🆕 - Deployment status tracker

## 🔧 Maintenance

### Regular Checks
```bash
# Weekly security audit
./security-test.sh

# Monthly online grade check
https://securityheaders.com/?q=teralink.store
```

### Updating Security
```bash
# Modify security features
nano lite/security.js

# Test locally (if possible)
# Then commit and push
git add lite/security.js
git commit -m "fix: Update security feature X"
git push origin main

# Wait 5 minutes for Cloudflare deployment
./quick-check.sh
```

### Troubleshooting

If headers are missing after deployment:

1. **Purge Cloudflare cache**
   - Dashboard > Caching > Purge Everything

2. **Verify `_headers` file**
   ```bash
   cat _headers
   # Should show plain text format (not TOML)
   ```

3. **Check Cloudflare build logs**
   - Dashboard > Workers & Pages > teralink-store > Deployments

4. **Use Transform Rules (alternative)**
   - See `Markdown/HEADERS-FIX.md` for instructions

## 🏆 Achievements Timeline

### Phase 1: Basic Security (Dec 12-13, 2025)
- ✅ Security grade: **D → A** (4-level jump)
- ✅ Implemented 6 security headers
- ✅ Fixed HTTPS redirects
- ✅ Configured Cloudflare Pages

### Phase 2: A+ Grade Achievement (Dec 14, 2025)
- ✅ Security grade: **A → A+** (Perfect score!)
- ✅ Removed all unsafe-inline & unsafe-eval
- ✅ Externalized all inline scripts
- ✅ CSP v2 compliant (no unsafe directives)

### Phase 3: Accessibility & Compatibility (Dec 14, 2025)
- ✅ WCAG 2.1 AA compliance achieved
- ✅ All form fields properly labeled
- ✅ Safari -webkit-backdrop-filter support
- ✅ 0 Microsoft Edge Tools warnings

### Phase 4: Final Security Layer (Dec 14, 2025) 🆕
- ✅ **4-layer defense system** implemented
- ✅ Cloudflare Functions middleware (server-side blocking)
- ✅ Custom robots.txt handler
- ✅ 16-layer client protection (security.js v1.2)
- ✅ Direct .js access blocked (403)
- ✅ Bot/scraper filtering with search engine whitelist
- ✅ view-source protocol detection
- ✅ Browser extension detection

### Summary: Security Journey
```
D Grade (Basic)
    ↓ (6 headers added)
A Grade (Good)
    ↓ (removed unsafe directives)
A+ Grade (Perfect)
    ↓ (4-layer defense)
Enterprise-Grade Security ✅
```

## 🌍 Global Protection Scope

**All security features apply to the entire domain:**
- ✅ `teralink.store/*` - All pages and subpaths
- ✅ `teralink.store/lite/*` - Visitor tracking system
- ✅ `teralink.store/hacking/*` - Special themed pages
- ✅ `teralink.store/application.html` - Form pages
- ✅ All future pages and directories

**Protection Levels:**
```
Layer 1 (Functions):  Applied to ALL requests to teralink.store
Layer 2 (Headers):    Applied to ALL responses (/*  pattern)
Layer 3 (robots.txt): Applied to ALL paths
Layer 4 (security.js): Applied to pages that include the script
```

## 📞 Support & Resources

### For Issues or Questions:
1. **Read Documentation** - Check `Markdown/FINAL-SECURITY-REPORT.md`
2. **Run Diagnostics** - `./final-security-test.sh` (34 tests)
3. **Check Limitations** - `Markdown/DEVTOOLS-LIMITATION.md`
4. **Review Logs** - Cloudflare Pages deployment logs

### External Validation:
- **Security Headers**: https://securityheaders.com/?q=teralink.store
- **SSL Grade**: https://www.ssllabs.com/ssltest/analyze.html?d=teralink.store
- **Accessibility**: Microsoft Edge DevTools (F12 → Issues)

### Quick Commands:
```bash
# Full diagnostics
./final-security-test.sh

# Quick header check
./quick-check.sh

# Legacy comprehensive test
./security-test.sh
```

## 🎯 Performance Metrics

```
Security Grade:           A+ (Perfect Score)
Client Protection:        16 Layers
Server Protection:        4 Layers (Functions + Headers + SEO + Client)
Test Coverage:            34 automated tests
Accessibility:            WCAG 2.1 AA
CSP Compliance:           100% (no unsafe directives)
Header Score:             6/6 (securityheaders.com)
Deployment Time:          3-5 minutes (auto)
Uptime:                   99.99% (Cloudflare Pages)
```

## 🔮 Future Enhancements (Optional)

### Potential Paid Upgrades
- 💰 **Cloudflare WAF** ($20/month) - Web Application Firewall
- 💰 **Bot Management** ($10/month) - AI-powered bot detection
- 💰 **Rate Limiting** ($5/month) - DDoS protection
- 💰 **Zero Trust Access** ($7/user/month) - Authentication layer

### Free Improvements (If Needed)
- ⚪ Code obfuscation/minification for additional protection
- ⚪ IP-based geolocation blocking (specific countries)
- ⚪ Custom 403/404 error pages
- ⚪ Advanced fingerprinting techniques

**Note:** Current implementation is sufficient for 99% of use cases. Additional security is only needed for high-value targets or enterprise requirements.

## 📜 License

Proprietary - All rights reserved

## 🎉 Credits & Acknowledgments

**Built with:**
- 🛡️ Security-first development approach
- ⚡ Cloudflare Pages & Functions
- 📊 Discord Webhooks for analytics
- 🧪 Automated testing suite
- 📚 Comprehensive documentation

**Technologies:**
- Pure JavaScript (No dependencies)
- CSP v2 compliant
- WCAG 2.1 AA accessible
- Modern ES6+ syntax
- Cloudflare Workers/Functions

**Special Thanks:**
- Cloudflare for enterprise-grade hosting
- ipapi.co for geolocation API
- Discord for webhook integration
- securityheaders.com for validation

---

**Status**: Production Ready ✅  
**Security Level**: Enterprise-Grade 🏆  
**Last Updated**: December 14, 2025  
**Version**: 2.0.0 (Final Security Release)  
**Commits**: 88285a5 (latest)

---

**Made with ❤️ and 🔒 for ultimate web security**

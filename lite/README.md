# Visitor Tracking System

**Version:** 2.0.0 (Final Security Release)  
**Last Updated:** 2025-12-14  
**Hosting:** Cloudflare Pages with Functions  
**Security Grade:** A+ (Enterprise-Level)

## 🎯 Overview

Ultra-secured visitor tracking and analytics system with **4-layer defense architecture** protecting the entire teralink.store domain (not just /lite).

## 📋 Features

### 📊 Tracking & Analytics
- **IP Detection**: Automatic IPv4/IPv6 detection with fallback APIs
- **Geolocation**: City, region, country with timezone
- **VPN/Proxy Detection**: Advanced multi-method detection system
- **Device Fingerprinting**: Browser, OS, screen, WebRTC, canvas
- **Security Info**: Incognito mode, DNT, cookies, automation tools
- **Discord Integration**: Real-time webhook notifications (dual redundancy)
- **Performance**: All tracking runs post-load (non-blocking)

### 🔒 Security Protection (4-Layer Architecture)

#### Layer 1: Cloudflare Functions (Server-Side) 🆕
- **Direct .js Blocking**: Returns 403 for non-referer requests
- **Referer Validation**: Only teralink.store domain allowed
- **Bot Filtering**: curl/wget/python-requests blocked
- **Scraper Blocking**: Ahrefs/Semrush/Scrapy/MJ12bot denied
- **Search Engine Whitelist**: Google/Bing/DuckDuckGo allowed
- **Applies to**: Entire teralink.store domain

#### Layer 2: HTTP Headers (Global) 🆕
- **CSP v2**: No unsafe-inline, no unsafe-eval
- **HSTS**: 1-year max-age with preload
- **X-Frame-Options**: DENY (no embedding)
- **X-Robots-Tag**: noindex on .js files
- **Applies to**: All pages (/* pattern)

#### Layer 3: SEO Control (robots.txt.js) 🆕
- **.js/.css Blocking**: Disallow all source file indexing
- **Scraper Bots**: Block archive.org, Ahrefs, Semrush
- **Custom Handler**: Overrides Cloudflare default
- **Applies to**: All paths

#### Layer 4: Client-Side (security.js v1.2) - 16 Protections
1. **Right-click Protection**: Context menu blocked
2. **DevTools Shortcuts**: F12, Ctrl+Shift+I/J/C/K/U blocked
3. **Mobile Long-press**: Touch context menu prevented
4. **Debugger Trap**: 100ms interval anti-debugging
5. **DevTools Detection**: Window size monitoring
6. **Console Tracking**: Usage detection and logging
7. **Text Selection**: Copy prevention (except inputs)
8. **Copy/Paste Blocking**: Clipboard access denied
9. **Drag & Drop**: File/text dragging prevented
10. **iframe Protection**: Frameset/iframe embedding blocked
11. **Automation Detection**: Selenium/Puppeteer/PhantomJS detected
12. **DOM Monitoring**: Mutation observer for tampering
13. **Visibility Tracking**: Tab focus/blur events
14. **view-source Blocking** 🆕: Protocol detection & redirect
15. **Source Obfuscation** 🆕: innerHTML/body property protection
16. **Extension Detection** 🆕: Browser extension script blocking

## 🚀 Usage

### Integration

Add to your HTML page (in order):

```html
<!-- Security protection (load first) -->
<script src="lite/security.js?v=1.0.0"></script>

<!-- Visitor tracking -->
<script src="lite/default.js?v=1.0.0"></script>
```

### Webhook Configuration

Edit `lite/default.js` and update:

```javascript
const WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_1';
const WEBHOOK_URL_2 = 'YOUR_DISCORD_WEBHOOK_URL_2';
```

## 📊 Data Collected

### Basic Information
- IP Address (IPv4/IPv6)
- Country, Region, City
- ISP, ASN, Organization
- Timezone

### Device Information
- Browser name & version
- Operating System
- Screen resolution
- Device type (Desktop/Mobile/Tablet)

### Network Information
- Connection type
- Network speed estimate
- WebRTC candidates

### Security Analysis
- VPN/Proxy detection
- Tor network detection
- Incognito mode detection
- Do Not Track status

### Advanced Fingerprinting
- Canvas fingerprint
- WebGL renderer info
- Audio context fingerprint
- Font list
- Installed plugins
- Media devices (cameras/mics count)

## 🔒 Privacy & Performance

- **Silent Operation**: No console logs in production
- **Non-blocking**: Runs after page load
- **Timeout Protection**: 5s for APIs, 3s for WebRTC, 5s for VPN detection
- **Fallback System**: Multiple API providers for reliability

## 🛠️ Technical Details

### API Providers
1. **Primary**: ipapi.co (30,000 requests/month free)
2. **Fallback**: Cloudflare CDN trace
3. **IP Detection**: ipify.org

### Timeouts
- ipapi.co: 5 seconds
- Cloudflare trace: 5 seconds
- Battery API: 2 seconds
- Media devices: 2 seconds
- Security info: 2 seconds
- WebRTC: 3 seconds
- VPN detection: 5 seconds

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support (some WebGL warnings)
- Safari: ✅ Full support (limited battery API)
- Opera: ✅ Full support

## 📁 File Structure

```
lite/
├── default.js          # Main tracking script
├── security.js         # Security protection (NEW)
├── index.html          # Demo page
├── README.md           # Documentation
└── minify.js           # Minification utility

Root/
├── _headers            # Cloudflare Pages headers config (NEW)
├── index.html          # Main page
└── hacking/            # Special pages
```

## 🔄 Version History

### v2.0.0 (2025-12-14) - Final Security Release 🔒
**🎉 Enterprise-Grade Security Achieved!**

- **4-Layer Defense System** implemented
  - Layer 1: Cloudflare Functions middleware (server-side blocking)
  - Layer 2: HTTP security headers (A+ grade, 6 headers)
  - Layer 3: Custom robots.txt handler (SEO protection)
  - Layer 4: Enhanced client protection (16 mechanisms)

- **security.js v1.1 → v1.2** (13 → 16 protections)
  - Added view-source protocol detection (#14)
  - Added source code obfuscation (#15)
  - Added browser extension detection (#16)

- **Server-Side Protection** (NEW)
  - Direct .js access blocked with 403
  - Referer validation (teralink.store only)
  - Bot filtering (curl, wget, python-requests)
  - Scraper blocking (Ahrefs, Semrush, Scrapy)
  - Search engine whitelist (Google, Bing allowed)

- **Global Protection Scope** 🌍
  - All protections apply to entire teralink.store domain
  - Not limited to /lite subfolder
  - Covers all current and future pages

- **Testing & Validation**
  - 34 automated tests (final-security-test.sh)
  - 37 comprehensive checks (security-test.sh)
  - A+ grade verified on securityheaders.com

### v1.0.0 (2025-12-13) - Production Release
- Removed all debug logging
- Added production error handling
- Optimized for silent operation
- IPv4 prioritization for better API compatibility
- Enhanced timeout protection
- Initial security protection script
- Cloudflare Pages optimization

### v0.9.x (2025-12-13) - Beta
- Added comprehensive debug logging
- Implemented timeout system
- Fixed IPv6 issues with ipapi.co
- Added Cloudflare trace fallback

## ⚙️ Configuration

### Disable Specific Features

Edit `lite/default.js` and comment out unwanted collectors:

```javascript
// Disable battery info
// visitorInfo.battery = await getBatteryInfo();

// Disable WebRTC
// visitorInfo.webRTC = await getWebRTCIPs();

// Disable VPN detection
// visitorInfo.vpnDetection = await detectVPNProxy(visitorInfo);
```

### Custom Discord Embed

Modify the `embed` object in `collectAndSendInfo()` function to customize the Discord message format.

### Disable Security Features

**⚠️ Warning**: Disabling security features reduces protection level!

Edit `lite/security.js` and comment out unwanted protections:

```javascript
// Comment out to disable right-click blocking (#1)
// document.addEventListener('contextmenu', ...);

// Comment out to disable DevTools keyboard shortcuts (#2)
// document.addEventListener('keydown', ...);

// Comment out to disable text selection blocking (#7)
// document.addEventListener('selectstart', ...);

// Comment out to disable view-source detection (#14)
// if (window.location.protocol === 'view-source:') { ... }

// Comment out to disable extension detection (#16)
// const observer = new MutationObserver(...);
```

### Adjust Server-Side Protection

Edit `functions/_middleware.js` to customize:

```javascript
// Modify referer whitelist
const validReferers = ['teralink.store', 'www.teralink.store'];

// Modify blocked user agents
const suspiciousPatterns = ['curl', 'wget', 'python-requests'];

// Modify allowed bots
const legitBots = ['googlebot', 'bingbot', 'duckduckbot'];
```

## 🐛 Troubleshooting

### Security Features Not Working?

1. **Clear Cloudflare Cache**
   - Dashboard → Caching → Purge Everything
   - Wait 5 minutes for redeployment

2. **Check Functions Deployment**
   - Cloudflare Pages → Functions tab
   - Verify `_middleware.js` is active

3. **Verify Headers**
   ```bash
   curl -I https://teralink.store/
   # Should show all 6 security headers
   ```

4. **Run Automated Tests**
   ```bash
   ./final-security-test.sh
   # Should pass 30+ out of 34 tests
   ```

### Webhook Not Sending?
1. Check browser console for errors (F12 if accessible)
2. Verify webhook URLs are correct in `default.js`
3. Ensure page is loaded over HTTPS
4. Check Discord webhook rate limits (30 requests/minute)

### Page Loading Issues?
- All tracking runs after `window.load` event
- Timeouts ensure max 15s total execution
- Does not block page rendering
- Check Network tab for failed API calls

### VPN Detection False Positives?
- Adjust thresholds in `VPN_DETECTION_CONFIG`
- Modify whitelist in `WHITELIST` section
- Check ipapi.co API quota (30,000/month free)

### Direct .js Access Still Works?
- Check if Cloudflare Functions is enabled
- Verify `_middleware.js` is deployed
- Test with: `curl https://teralink.store/lite/default.js`
- Should return 403 Forbidden

## 📞 Support & Resources

### Documentation
- **Main README**: [../README.md](../README.md)
- **Security Report**: [../Markdown/FINAL-SECURITY-REPORT.md](../Markdown/FINAL-SECURITY-REPORT.md)
- **Limitations**: [../Markdown/DEVTOOLS-LIMITATION.md](../Markdown/DEVTOOLS-LIMITATION.md)
- **Test Guide**: [../TEST-SOURCE-PROTECTION.md](../TEST-SOURCE-PROTECTION.md)

### Automated Testing
```bash
# Quick header check (6 tests)
../quick-check.sh

# Comprehensive security audit (37 tests)
../security-test.sh

# Final security test (34 tests)
../final-security-test.sh
```

### Manual Validation
- **Security Headers**: https://securityheaders.com/?q=teralink.store
- **SSL Grade**: https://www.ssllabs.com/ssltest/analyze.html?d=teralink.store
- **Browser Console**: F12 → Console (check for errors)
- **Network Tab**: F12 → Network (check API calls)

### Debug Checklist
```
[ ] All files present in repository
[ ] GitHub push successful
[ ] Cloudflare deployment completed (3-5 min)
[ ] Cache purged if needed
[ ] Functions are active
[ ] Headers visible in curl response
[ ] Tests passing (final-security-test.sh)
[ ] Webhooks receiving data
```

## ⚖️ Legal & Privacy

**Important**: Ensure compliance with privacy laws in your jurisdiction:
- 🇪🇺 **GDPR** (EU) - General Data Protection Regulation
- 🇺🇸 **CCPA** (California) - California Consumer Privacy Act
- 🇧🇷 **LGPD** (Brazil) - Lei Geral de Proteção de Dados
- 🇰🇷 **PIPA** (Korea) - Personal Information Protection Act

**Best Practices:**
- Display privacy policy on your site
- Obtain user consent for tracking (if required)
- Provide opt-out mechanism
- Disclose data collection practices
- Implement data retention policies

## 🏆 Status

```
Security Level:    Enterprise-Grade ✅
Protection Layers: 4 (Functions + Headers + SEO + Client)
Security Grade:    A+ (Perfect Score)
Test Coverage:     34 automated tests
WCAG Compliance:   AA (Accessibility)
Domain Scope:      Entire teralink.store
Last Updated:      2025-12-14
Version:           2.0.0
```

## 📜 License

Proprietary - All rights reserved

---

**Made with ❤️ and 🔒 for enterprise-grade visitor analytics**  
**Secured by 4-layer defense architecture**

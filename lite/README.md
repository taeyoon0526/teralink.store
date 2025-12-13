# Visitor Tracking System

**Version:** 1.0.0 (Production)  
**Last Updated:** 2025-12-14

## 📋 Features

- **IP Detection**: Automatic IPv4/IPv6 detection with fallback
- **Geolocation**: City, region, country with timezone
- **VPN/Proxy Detection**: Advanced multi-layer detection system
- **Device Fingerprinting**: Browser, OS, screen, WebRTC
- **Security Info**: Incognito mode detection, DNT, cookies
- **Discord Integration**: Real-time webhook notifications

## 🚀 Usage

### Integration

Add to your HTML page:

```html
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
├── index.html          # Demo page
└── minify.js           # Minification utility
```

## 🔄 Version History

### v1.0.0 (2025-12-14) - Production Release
- Removed all debug logging
- Added production error handling
- Optimized for silent operation
- IPv4 prioritization for better API compatibility
- Enhanced timeout protection

### v0.9.x (2025-12-13)
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

## 🐛 Troubleshooting

### Webhook not sending?
1. Check browser console for errors (F12)
2. Verify webhook URLs are correct
3. Ensure page is loaded over HTTPS
4. Check Discord webhook rate limits

### Slow page load?
- All tracking runs after `window.load` event
- Timeouts ensure max 15s total execution
- Does not block page rendering

### VPN detection false positives?
- Adjust thresholds in `VPN_DETECTION_CONFIG`
- Modify whitelist in `WHITELIST` section

## 📞 Support

For issues or questions, check:
- Browser console (F12) for errors
- Network tab for failed requests
- Discord webhook logs

## ⚖️ License

Use responsibly and ensure compliance with privacy laws (GDPR, CCPA, etc.) in your jurisdiction.

---

**Made with ❤️ for visitor analytics**

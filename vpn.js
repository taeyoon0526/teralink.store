// VPN Page Scripts
// Back Navigation

function goBack() {
    try {
        if (document.referrer) {
            window.location.href = document.referrer;
        } else {
            window.location.href = "/";
        }
    } catch (e) {
        window.location.href = "/";
    }
}

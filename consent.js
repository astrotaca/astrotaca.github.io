(function () {
    var consentKey = 'astrotaca_cookie_consent';
    var bannerId = 'cookie-consent-banner';

    function getCookie(name) {
        var matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
        return matches ? decodeURIComponent(matches[1]) : null;
    }

    function setCookie(name, value, days) {
        var expires = '';
        if (typeof days === 'number') {
            var date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
    }

    function getConsent() {
        var cookieValue = getCookie(consentKey);
        if (cookieValue === 'accepted' || cookieValue === 'declined') {
            return cookieValue;
        }
        try {
            var storageValue = localStorage.getItem(consentKey);
            if (storageValue === 'accepted' || storageValue === 'declined') {
                return storageValue;
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    function saveConsent(value) {
        setCookie(consentKey, value, 365);
        try {
            localStorage.setItem(consentKey, value);
        } catch (error) {
            // ignore storage errors
        }
    }

    function loadAnalytics() {
        if (window.__astrotacaAnalyticsLoaded) {
            return;
        }
        window.__astrotacaAnalyticsLoaded = true;
        window.dataLayer = window.dataLayer || [];
        function gtag() {
            window.dataLayer.push(arguments);
        }
        window.gtag = window.gtag || gtag;

        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-GPNQERSHF6';
        document.head.appendChild(script);

        window.gtag('js', new Date());
        window.gtag('config', 'G-GPNQERSHF6', {
            anonymize_ip: true,
            page_path: window.location.pathname
        });
    }

    function hideBanner() {
        var banner = document.getElementById(bannerId);
        if (banner) {
            banner.classList.add('hidden');
        }
    }

    function initBanner() {
        var banner = document.getElementById(bannerId);
        if (!banner) {
            return;
        }
        var acceptButton = banner.querySelector('.cookie-accept');
        var declineButton = banner.querySelector('.cookie-decline');
        if (acceptButton) {
            acceptButton.addEventListener('click', function () {
                saveConsent('accepted');
                hideBanner();
                loadAnalytics();
            });
        }
        if (declineButton) {
            declineButton.addEventListener('click', function () {
                saveConsent('declined');
                hideBanner();
            });
        }
    }

    function initConsent() {
        var consent = getConsent();
        if (consent === 'accepted') {
            loadAnalytics();
        }
        var banner = document.getElementById(bannerId);
        if (!banner) {
            return;
        }
        if (!consent) {
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        initBanner();
        initConsent();
    });
})();

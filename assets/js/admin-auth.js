(function () {
    /* Длинный ключ — не публикуйте URL. Смените значение при утечке. */
    var ADMIN_KEY = 'smurf_k8R2mQ9xLvN4pW7zT1hJ6cY3bA0eF5';
    var STORAGE_FLAG = 'isAdmin';
    var adminBtn = null;
    var placementMode = 'overlay';

    function getQueryKey() {
        var params = new URLSearchParams(window.location.search);
        return params.get('key');
    }

    function grantAdmin() {
        localStorage.setItem(STORAGE_FLAG, 'true');
    }

    function isAdmin() {
        return localStorage.getItem(STORAGE_FLAG) === 'true';
    }

    /** Контейнер с логотипом и SMURF SHOP */
    function findLogoHost() {
        var logoContainer = document.querySelector('.logo-container');
        if (logoContainer) return logoContainer;

        var siteTitle = document.querySelector('.site-title');
        if (siteTitle && siteTitle.parentElement) {
            return siteTitle.parentElement;
        }

        return document.querySelector('header');
    }

    function ensureAdminButtonStyles() {
        if (document.getElementById('smurf-admin-gear-styles')) {
            return;
        }

        var style = document.createElement('style');
        style.id = 'smurf-admin-gear-styles';
        style.textContent =
            '#smurf-admin-gear {' +
                'display:flex;' +
                'align-items:center;' +
                'justify-content:center;' +
                'border-radius:50%;' +
                'background:#1a1a2e;' +
                'color:#fff;' +
                'border:2px solid #00d9a3;' +
                'box-shadow:0 4px 12px rgba(0,0,0,0.5);' +
                'cursor:pointer;' +
                'pointer-events:auto;' +
                'padding:0;' +
                'line-height:1;' +
                'transition:transform 0.2s, background 0.2s, color 0.2s;' +
            '}' +
            '#smurf-admin-gear.smurf-admin-gear--overlay {' +
                'position:absolute;' +
                'top:50%;' +
                'transform:translateY(-50%);' +
                'z-index:9999;' +
            '}' +
            '#smurf-admin-gear.smurf-admin-gear--overlay:hover {' +
                'background:#00d9a3;' +
                'color:#0a0e17;' +
                'transform:translateY(-50%) scale(1.08);' +
            '}' +
            '#smurf-admin-gear.smurf-admin-gear--fixed {' +
                'position:fixed;' +
                'z-index:9999;' +
            '}';

        document.head.appendChild(style);
    }

    function isMobileViewport() {
        return window.matchMedia('(max-width: 767px)').matches;
    }

    function applyAdminButtonLayout() {
        if (!adminBtn) return;

        var mobile = isMobileViewport();
        var size = mobile ? 30 : 40;
        var right = mobile ? 10 : 15;
        var fontSize = mobile ? 14 : 18;

        adminBtn.style.width = size + 'px';
        adminBtn.style.height = size + 'px';
        adminBtn.style.fontSize = fontSize + 'px';

        adminBtn.classList.remove('smurf-admin-gear--overlay', 'smurf-admin-gear--fixed');

        if (placementMode === 'overlay') {
            adminBtn.classList.add('smurf-admin-gear--overlay');
            adminBtn.style.position = 'absolute';
            adminBtn.style.top = '50%';
            adminBtn.style.right = right + 'px';
            adminBtn.style.left = '';
            adminBtn.style.bottom = '';
            adminBtn.style.transform = 'translateY(-50%)';
            adminBtn.style.zIndex = '9999';
            return;
        }

        adminBtn.classList.add('smurf-admin-gear--fixed');
        adminBtn.style.position = 'fixed';
        adminBtn.style.top = (mobile ? 10 : 16) + 'px';
        adminBtn.style.right = right + 'px';
        adminBtn.style.transform = '';
        adminBtn.style.zIndex = '9999';
    }

    function mountAdminButton() {
        var host = findLogoHost();

        if (host) {
            var computed = window.getComputedStyle(host).position;
            if (computed === 'static' || !computed) {
                host.style.position = 'relative';
            }

            if (adminBtn.parentNode !== host) {
                host.appendChild(adminBtn);
            }

            placementMode = 'overlay';
        } else if (adminBtn.parentNode !== document.body) {
            document.body.appendChild(adminBtn);
            placementMode = 'fixed';
        }

        applyAdminButtonLayout();
    }

    function createAdminButton() {
        if (document.getElementById('smurf-admin-gear')) {
            adminBtn = document.getElementById('smurf-admin-gear');
            mountAdminButton();
            return;
        }

        ensureAdminButtonStyles();

        adminBtn = document.createElement('button');
        adminBtn.id = 'smurf-admin-gear';
        adminBtn.type = 'button';
        adminBtn.setAttribute('aria-label', 'Админ-панель');
        adminBtn.title = 'Админ-панель';
        adminBtn.textContent = '⚙️';

        adminBtn.addEventListener('click', function () {
            window.location.href = 'admin.html';
        });

        mountAdminButton();

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                mountAdminButton();
            }, 100);
        });

        var mq = window.matchMedia('(max-width: 767px)');
        if (mq.addEventListener) {
            mq.addEventListener('change', applyAdminButtonLayout);
        } else if (mq.addListener) {
            mq.addListener(applyAdminButtonLayout);
        }
    }

    var queryKey = getQueryKey();
    if (queryKey === ADMIN_KEY) {
        grantAdmin();
        if (window.history && window.history.replaceState) {
            var cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    if (isAdmin()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createAdminButton);
        } else {
            createAdminButton();
        }
    }
})();

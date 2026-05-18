(function () {
    var ADMIN_KEY = 'SMURF_SECRET_KEY';
    var STORAGE_FLAG = 'isAdmin';
    var HEADER_SELECTORS = ['header', '.main-header', 'nav'];
    var adminBtn = null;
    var placementMode = 'fixed';

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

    function findHeaderHost() {
        for (var i = 0; i < HEADER_SELECTORS.length; i++) {
            var el = document.querySelector(HEADER_SELECTORS[i]);
            if (el) return el;
        }
        return null;
    }

    function findPlacementTarget() {
        var contacts = document.querySelector('.contacts');
        if (contacts) {
            return { host: contacts, mode: 'contacts' };
        }

        var header = findHeaderHost();
        if (header) {
            return { host: header, mode: 'header' };
        }

        return null;
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
                'border:2px solid #00d9a3;' +
                'color:#00d9a3;' +
                'box-shadow:0 4px 12px rgba(0,0,0,0.4);' +
                'z-index:9998;' +
                'transition:transform 0.2s, background 0.2s, color 0.2s;' +
                'cursor:pointer;' +
                'pointer-events:auto;' +
                'flex-shrink:0;' +
                'padding:0;' +
                'line-height:1;' +
            '}' +
            '#smurf-admin-gear:hover {' +
                'transform:scale(1.08);' +
                'background:#00d9a3;' +
                'color:#0a0e17;' +
            '}' +
            '#smurf-admin-gear.smurf-admin-gear--in-contacts,' +
            '#smurf-admin-gear.smurf-admin-gear--in-header {' +
                'position:relative;' +
                'margin:0;' +
            '}' +
            '#smurf-admin-gear.smurf-admin-gear--fixed {' +
                'position:fixed;' +
            '}';

        document.head.appendChild(style);
    }

    function isMobileViewport() {
        return window.matchMedia('(max-width: 767px)').matches;
    }

    function applyAdminButtonLayout() {
        if (!adminBtn) return;

        var mobile = isMobileViewport();
        var size = mobile ? 40 : 44;
        var fontSize = mobile ? 18 : 20;

        adminBtn.style.width = size + 'px';
        adminBtn.style.height = size + 'px';
        adminBtn.style.fontSize = fontSize + 'px';

        adminBtn.classList.remove(
            'smurf-admin-gear--in-contacts',
            'smurf-admin-gear--in-header',
            'smurf-admin-gear--fixed'
        );

        if (placementMode === 'contacts' || placementMode === 'header') {
            adminBtn.classList.add(
                placementMode === 'contacts'
                    ? 'smurf-admin-gear--in-contacts'
                    : 'smurf-admin-gear--in-header'
            );
            adminBtn.style.top = '';
            adminBtn.style.right = '';
            adminBtn.style.left = '';
            adminBtn.style.bottom = '';
            adminBtn.style.position = '';
            return;
        }

        adminBtn.classList.add('smurf-admin-gear--fixed');
        adminBtn.style.top = (mobile ? 10 : 16) + 'px';
        adminBtn.style.right = (mobile ? 10 : 16) + 'px';
        adminBtn.style.left = '';
        adminBtn.style.bottom = '';
    }

    function mountAdminButton(target) {
        if (target && target.host) {
            if (target.mode === 'contacts') {
                if (adminBtn.parentNode !== target.host) {
                    target.host.insertBefore(adminBtn, target.host.firstChild);
                } else if (adminBtn !== target.host.firstElementChild) {
                    target.host.insertBefore(adminBtn, target.host.firstChild);
                }
            } else if (adminBtn.parentNode !== target.host) {
                target.host.appendChild(adminBtn);
            }

            placementMode = target.mode;
        } else if (adminBtn.parentNode !== document.body) {
            document.body.appendChild(adminBtn);
            placementMode = 'fixed';
        }

        applyAdminButtonLayout();
    }

    function tryPlaceAdminButton() {
        mountAdminButton(findPlacementTarget());
    }

    function createAdminButton() {
        if (document.getElementById('smurf-admin-gear')) {
            adminBtn = document.getElementById('smurf-admin-gear');
            tryPlaceAdminButton();
            return;
        }

        ensureAdminButtonStyles();

        adminBtn = document.createElement('button');
        adminBtn.id = 'smurf-admin-gear';
        adminBtn.type = 'button';
        adminBtn.setAttribute('aria-label', 'Админ-панель');
        adminBtn.title = 'Админ-панель';
        adminBtn.textContent = '⚙';

        adminBtn.addEventListener('click', function () {
            window.location.href = 'admin.html';
        });

        tryPlaceAdminButton();

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(tryPlaceAdminButton, 100);
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

// ПРОВЕРКА ДОСТУПА К АДМИНКЕ
(function () {
    var SECRET_KEY = 'smurfk8R2mQ9xLvN4pW7zT1hJ6cY3bA0eF5';
    var STORAGE_ACCESS = 'smurf_admin_access';
    var STORAGE_LEGACY = 'isAdmin';
    // Кнопка на главной — только в текущей вкладке после входа по ключу
    var SESSION_BUTTON = 'smurf_admin_session';

    function getKeyFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var key = params.get('key');
        if (!key) return '';
        try {
            return decodeURIComponent(String(key)).trim();
        } catch (e) {
            return String(key).trim();
        }
    }

    function grantAccess() {
        localStorage.setItem(STORAGE_ACCESS, 'true');
        localStorage.setItem(STORAGE_LEGACY, 'true');
        sessionStorage.setItem(SESSION_BUTTON, '1');
    }

    function revokeAccess() {
        localStorage.removeItem(STORAGE_ACCESS);
        localStorage.removeItem(STORAGE_LEGACY);
        sessionStorage.removeItem(SESSION_BUTTON);
    }

    function hasSessionButton() {
        return sessionStorage.getItem(SESSION_BUTTON) === '1';
    }

    function removeAdminButton() {
        var btn = document.getElementById('admin-settings-btn');
        if (btn) btn.remove();

        var legacy = document.getElementById('smurf-admin-gear');
        if (legacy) legacy.remove();
    }

    function applyButtonResponsive(btn) {
        if (window.innerWidth < 768) {
            btn.style.width = '40px';
            btn.style.height = '40px';
            btn.style.fontSize = '20px';
            btn.style.top = '15px';
            btn.style.right = '15px';
        } else {
            btn.style.width = '50px';
            btn.style.height = '50px';
            btn.style.fontSize = '24px';
            btn.style.top = '20px';
            btn.style.right = '20px';
        }
    }

    function createAdminButton() {
        if (!document.body) {
            return false;
        }

        var existing = document.getElementById('admin-settings-btn');
        if (existing) {
            applyButtonResponsive(existing);
            return true;
        }

        var btn = document.createElement('button');
        btn.id = 'admin-settings-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Админ-панель');
        btn.title = 'Админ-панель';
        btn.innerHTML = '⚙️';
        btn.style.cssText =
            'position:fixed;' +
            'top:20px;' +
            'right:20px;' +
            'width:50px;' +
            'height:50px;' +
            'border-radius:50%;' +
            'background:#1a1a2e;' +
            'color:#fff;' +
            'border:2px solid #00d9a3;' +
            'font-size:24px;' +
            'cursor:pointer;' +
            'z-index:10050;' +
            'display:flex;' +
            'align-items:center;' +
            'justify-content:center;' +
            'box-shadow:0 4px 12px rgba(0,0,0,0.5);' +
            'transition:transform 0.2s;' +
            'padding:0;' +
            'line-height:1;';

        btn.onmouseover = function () {
            btn.style.transform = 'scale(1.1)';
        };
        btn.onmouseout = function () {
            btn.style.transform = 'scale(1)';
        };

        btn.onclick = function () {
            window.location.href = 'admin.html';
        };

        applyButtonResponsive(btn);
        document.body.appendChild(btn);

        if (!window.__smurfAdminResizeBound) {
            window.__smurfAdminResizeBound = true;
            window.addEventListener('resize', function () {
                var current = document.getElementById('admin-settings-btn');
                if (current) applyButtonResponsive(current);
            });
        }

        return true;
    }

    function cleanKeyFromUrl() {
        if (!window.history || !window.history.replaceState) return;
        var cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
    }

    function checkAdminAccess() {
        var keyFromURL = getKeyFromUrl();

        if (keyFromURL && keyFromURL !== SECRET_KEY) {
            revokeAccess();
            removeAdminButton();
            console.log('❌ Доступ запрещён: неверный ключ');
            return;
        }

        if (keyFromURL === SECRET_KEY) {
            grantAccess();
            createAdminButton();
            console.log('✅ Ключ верный! Доступ разрешён.');
            setTimeout(cleanKeyFromUrl, 150);
            return;
        }

        if (hasSessionButton()) {
            createAdminButton();
            console.log('✅ Сессия активна. Кнопка показана.');
            return;
        }

        removeAdminButton();
        console.log('❌ Доступ запрещён. Кнопка скрыта.');
    }

    document.addEventListener('DOMContentLoaded', checkAdminAccess);
    window.addEventListener('load', checkAdminAccess);

    if (document.readyState !== 'loading') {
        checkAdminAccess();
    }

    window.logoutAdmin = function () {
        revokeAccess();
        removeAdminButton();
        window.location.href = '/';
    };
})();

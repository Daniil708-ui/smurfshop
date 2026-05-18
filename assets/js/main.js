// ============================================
// 1. АНИМАЦИЯ МОЛНИЙ
// ============================================
function getRandomAngle() { return Math.floor(Math.random() * 20) + 15; }

function strikeLightning() {
    var left = document.getElementById('lightning-left-img');
    var right = document.getElementById('lightning-right-img');
    var overlay = document.getElementById('flash-overlay');
    var leftAngle = getRandomAngle();
    var rightAngle = -getRandomAngle();
    var leftSkew = (Math.random() * 20 - 10).toFixed(2);
    var rightSkew = (Math.random() * 20 - 10).toFixed(2);

    left.style.transform = 'rotate(' + leftAngle + 'deg) skewX(' + leftSkew + 'deg)';
    right.style.transform = 'rotate(' + rightAngle + 'deg) skewX(' + rightSkew + 'deg) scaleX(-1)';

    if (Math.random() > 0.3) left.classList.add('active');
    if (Math.random() > 0.3) right.classList.add('active');
    overlay.classList.add('active');

    setTimeout(function () {
        left.classList.remove('active');
        right.classList.remove('active');
        overlay.classList.remove('active');
        setTimeout(function () { left.style.transform = ''; right.style.transform = ''; }, 100);
    }, 800);
}

function scheduleLightning() {
    setTimeout(function () {
        strikeLightning();
        if (Math.random() > 0.7) { setTimeout(strikeLightning, 300 + Math.random() * 400); }
        scheduleLightning();
    }, 12000 + Math.random() * 8000);
}

// ============================================
// 2. ЗАГРУЗКА ИЗ SUPABASE
// ============================================
var allProducts = [];

function quoteId(id) {
    return "'" + String(id).replace(/'/g, "\\'") + "'";
}

async function loadProducts() {
    console.log('🔄 Загрузка товаров...');

    try {
        var raw = await getProducts();
        allProducts = mapDataToCardFormat(raw);

        var visible = allProducts.filter(function (p) {
            return p.in_stock !== false;
        });

        console.log('✅ Загружено товаров:', visible.length);

        renderCategory('hqd', visible.filter(function (p) { return p.category.toLowerCase().includes('hqd'); }));
        renderCategory('pods', visible.filter(function (p) { return p.category.toLowerCase().includes('pod'); }));
        renderCategory('liquids', visible.filter(function (p) {
            var c = p.category.toLowerCase();
            return c.includes('жидк') || c.includes('liquid');
        }));
        renderCategory('snus', visible.filter(function (p) {
            var c = p.category.toLowerCase();
            return c.includes('снюс') || c.includes('snus');
        }));
        renderCategory('accessories', visible.filter(function (p) {
            var c = p.category.toLowerCase();
            return c.includes('акс') || c.includes('acc');
        }));
    } catch (error) {
        console.error('❌ Ошибка:', error);
        document.querySelector('.section-title').innerHTML += '<br><span style="font-size:1rem;color:#f87171;">Ошибка загрузки. Проверьте Supabase и интернет.</span>';
    }
}

// ============================================
// 3. ФУНКЦИЯ PARSE FLAVORS (С РАЗДЕЛЕНИЕМ НА ДОСТУПНЫЕ/НЕДОСТУПНЫЕ)
// ============================================
function parseFlavors(str) {
    if (!str || str === '-') return { available: [], unavailable: [] };
    var flavors = str.split(/\n|\|/);
    var result = { available: [], unavailable: [] };
    for (var i = 0; i < flavors.length; i++) {
        var flavor = flavors[i].trim();
        if (!flavor) continue;
        if (flavor.indexOf('❌') !== -1 || flavor.indexOf('✖') !== -1) {
            flavor = flavor.replace(/[❌✖]/g, '').trim();
            if (flavor) result.unavailable.push(flavor);
        } else {
            flavor = flavor.replace(/[✅✔✓]/g, '').trim();
            if (flavor) result.available.push(flavor);
        }
    }
    return result;
}

// ============================================
// 4. ХАРАКТЕРИСТИКИ (превью на карточке и модалка)
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function normalizeSpecsArray(specs) {
    if (!Array.isArray(specs)) {
        return [];
    }

    return specs.map(function (item) {
        return {
            label: String(item.label || item.name || '').trim(),
            value: String(item.value || '').trim()
        };
    }).filter(function (item) {
        return item.label || item.value;
    });
}

function parseSpecsInput(specsData) {
    if (!specsData) {
        return [];
    }

    if (Array.isArray(specsData)) {
        return normalizeSpecsArray(specsData);
    }

    if (typeof specsData === 'string') {
        if (typeof parseSpecsArray === 'function') {
            return parseSpecsArray(specsData);
        }

        try {
            var parsed = JSON.parse(specsData);
            if (Array.isArray(parsed)) {
                return normalizeSpecsArray(parsed);
            }
        } catch (e) {
            return [];
        }
    }

    return [];
}

function renderSpecs(specsData, legacyProduct) {
    var specs = parseSpecsInput(specsData);

    if (specs.length > 0) {
        return specs.map(function (spec) {
            if (!spec.label && !spec.value) {
                return '';
            }
            return '<div class="spec-item"><span class="spec-label">' + escapeHtml(spec.label) +
                ':</span> <span class="spec-value">' + escapeHtml(spec.value) + '</span></div>';
        }).join('');
    }

    var legacy = legacyProduct || {};
    var html = '';

    if (legacy.nicotine && legacy.nicotine !== '-') {
        html += '<div class="spec-item"><span class="spec-label">Никотин:</span> <span class="spec-value">' +
            escapeHtml(legacy.nicotine) + '</span></div>';
    }
    if (legacy.puffs && legacy.puffs !== '-') {
        html += '<div class="spec-item"><span class="spec-label">Затяжки:</span> <span class="spec-value">' +
            escapeHtml(legacy.puffs) + '</span></div>';
    }
    if (legacy.rechargeable && legacy.rechargeable !== '-') {
        html += '<div class="spec-item"><span class="spec-label">Зарядка:</span> <span class="spec-value">' +
            escapeHtml(legacy.rechargeable) + '</span></div>';
    }
    if (legacy.mah && legacy.mah !== '-') {
        html += '<div class="spec-item"><span class="spec-label">Батарея:</span> <span class="spec-value">' +
            escapeHtml(legacy.mah) + '</span></div>';
    }

    return html;
}

function renderSpecsPreview(specsData, legacyProduct, maxVisible) {
    var specs = parseSpecsInput(specsData);
    var limit = maxVisible || 3;

    if (!specs.length) {
        return '';
    }

    var html = specs.slice(0, limit).map(function (spec) {
        if (!spec.label && !spec.value) {
            return '';
        }
        return '<p class="product-preview"><strong>' + escapeHtml(spec.label) + ':</strong> ' +
            escapeHtml(spec.value) + '</p>';
    }).join('');

    if (specs.length > limit) {
        html += '<p class="product-preview specs-more">…</p>';
    }

    return html;
}

// ============================================
// 5. РЕНДЕР КАТЕГОРИЙ
// ============================================
function renderCategory(catId, products) {
    var grid = document.getElementById(catId + '-grid');
    if (!grid) return;
    if (products.length === 0) {
        grid.innerHTML = '<p style="color:#b0c4de; grid-column: 1/-1; text-align:center;">Товаров нет</p>';
        return;
    }
    grid.innerHTML = products.map(function (p) {
        var count = p.flavors.available ? p.flavors.available.length : 0;
        var badge, badgeClass;
        if (count > 0) {
            badge = 'В наличии (' + count + ')';
            badgeClass = '';
        } else {
            badge = 'Нет в наличии ❌';
            badgeClass = 'out';
        }
        var idAttr = quoteId(p.id);
        var specsPreview = renderSpecsPreview(p.specsRaw || p.specsList, p, 3);
        return '<div class="product-card" onclick="openModal(' + idAttr + ')">' +
            '<div class="product-image">' +
                '<img src="' + p.image + '" alt="' + p.model + '" onerror="this.src=\'https://placehold.co/400x400/0a0e17/00d4ff?text=Нет+фото\'">' +
                '<div class="stock-badge ' + badgeClass + '">' + badge + '</div>' +
            '</div>' +
            '<div class="product-info">' +
                '<h3 class="product-title">' + p.model + '</h3>' +
                '<p class="product-preview">' + p.description + '</p>' +
                (specsPreview ? '<div class="product-specs-preview">' + specsPreview + '</div>' : '') +
                '<div class="product-price">' + p.price + ' ₽</div>' +
                '<span class="view-details">Нажмите для деталей →</span>' +
                '<button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(' + idAttr + ')">🛒 В корзину</button>' +
            '</div>' +
        '</div>';
    }).join('');
}

// ============================================
// 5. МОДАЛЬНОЕ ОКНО
// ============================================
function openModal(id) {
    var p = allProducts.find(function (x) { return x.id == id; });
    if (!p) return;

    var modal = document.getElementById('product-modal');
    var body = document.getElementById('modal-body');
    var idAttr = quoteId(p.id);

    var specs = renderSpecs(p.specsRaw || p.specsList, p);

    var flavorsHtml = '';
    if (p.flavors.available && p.flavors.available.length > 0) {
        p.flavors.available.forEach(function (f) {
            flavorsHtml += '<div class="flavor-item available"><span>✅</span><span>' + f + '</span></div>';
        });
    }
    if (p.flavors.unavailable && p.flavors.unavailable.length > 0) {
        p.flavors.unavailable.forEach(function (f) {
            flavorsHtml += '<div class="flavor-item unavailable"><span>❌</span><span>' + f + '</span></div>';
        });
    }
    if (!flavorsHtml) {
        flavorsHtml = '<div class="flavor-item unavailable"><span>Нет вкусов</span></div>';
    }

    body.innerHTML = '<div class="modal-header">' +
        '<img src="' + p.image + '" alt="' + p.model + '" onerror="this.src=\'https://placehold.co/400x400/0a0e17/00d4ff?text=Нет+фото\'">' +
        '<h2>' + p.model + '</h2><p style="color:#b0c4de">' + p.description + '</p>' +
    '</div>' +
    '<div class="modal-body">' +
        (specs ? '<div class="modal-section"><h3>📊 Характеристики</h3><div class="specs-grid">' + specs + '</div></div>' : '') +
        '<div class="modal-section"><h3>🎨 Вкусы</h3><div class="flavors-list">' + flavorsHtml + '</div></div>' +
    '</div>' +
    '<div class="modal-footer">' +
        '<div class="modal-price">' + p.price + ' ₽</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-add-cart" onclick="addToCart(' + idAttr + '); closeModal();">🛒 В корзину</button>' +
            '<button class="order-btn" onclick="order(\'' + p.model.replace(/'/g, "\\'") + '\'); closeModal();">⚡ Заказать</button>' +
        '</div>' +
    '</div>';

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

window.onclick = function (e) { if (e.target == document.getElementById('product-modal')) closeModal(); };
document.addEventListener('keydown', function (e) { if (e.key == 'Escape') closeModal(); });

function order(name) {
    var msg = 'Здравствуйте! Интересует товар: ' + name;
    window.open('https://t.me/smurfshop6?text=' + encodeURIComponent(msg), '_blank');
}

// ============================================
// 6. КОРЗИНА
// ============================================
var cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }

function updateCart() {
    var cartItems = document.getElementById('cart-items');
    var cartTotal = document.getElementById('cart-total-price');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
        cartTotal.textContent = '0 ₽';
        return;
    }

    var total = 0;
    cartItems.innerHTML = '';

    cart.forEach(function (item, index) {
        total += item.price * item.quantity;
        cartItems.innerHTML += '<div class="cart-item">' +
            '<div class="cart-item-info">' +
                '<div class="cart-item-name">' + item.name + '</div>' +
                '<div class="cart-item-price">' + item.price + ' ₽</div>' +
            '</div>' +
            '<div class="cart-item-quantity">' +
                '<button onclick="changeQuantity(' + index + ', -1)">-</button>' +
                '<span>' + item.quantity + '</span>' +
                '<button onclick="changeQuantity(' + index + ', 1)">+</button>' +
            '</div>' +
            '<div class="cart-item-actions">' +
                '<button class="cart-item-order" onclick="orderSingleItem(' + index + ')">📦 Заказать</button>' +
                '<button class="cart-item-remove" onclick="removeFromCart(' + index + ')">🗑️ Удалить</button>' +
            '</div>' +
        '</div>';
    });

    cartTotal.textContent = total + ' ₽';
    saveCart();
}

function addToCart(id) {
    var product = allProducts.find(function (p) { return p.id == id; });
    if (!product) return;

    var existingItem = cart.find(function (item) { return item.id == id; });
    if (existingItem) { existingItem.quantity++; }
    else { cart.push({ id: product.id, name: product.model, price: product.price, quantity: 1 }); }

    saveCart(); updateCart();

    var btn = event.target;
    btn.textContent = '✓ В корзине';
    btn.classList.add('added-to-cart');
    setTimeout(function () {
        btn.textContent = '🛒 В корзину';
        btn.classList.remove('added-to-cart');
    }, 2000);
}

function changeQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) { cart.splice(index, 1); }
    saveCart(); updateCart();
}

function removeFromCart(index) { cart.splice(index, 1); saveCart(); updateCart(); }
function clearCart() { cart = []; saveCart(); updateCart(); }

function orderSingleItem(index) {
    var item = cart[index]; if (!item) return;
    var total = item.price * item.quantity;
    var message = '🛒 Заказ товара!\n• ' + item.name + ' — ' + item.quantity + ' шт. × ' + item.price + ' ₽\n💰 Итого: ' + total + ' ₽';
    window.open('https://t.me/smurfshop6?text=' + encodeURIComponent(message), '_blank');
}

function orderCart() {
    if (cart.length === 0) { alert('Корзина пуста!'); return; }
    var total = cart.reduce(function (sum, item) { return sum + (item.price * item.quantity); }, 0);
    var message = '🛒 Новый заказ!\n';
    cart.forEach(function (item) { message += '• ' + item.name + ' — ' + item.quantity + ' шт. × ' + item.price + ' ₽\n'; });
    message += '\n💰 Итого: ' + total + ' ₽';
    window.open('https://t.me/smurfshop6?text=' + encodeURIComponent(message), '_blank');
}

window.addEventListener('load', function () {
    setTimeout(strikeLightning, 2000);
    scheduleLightning();
    loadProducts();
    updateCart();
});

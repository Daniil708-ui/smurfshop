/* global supabaseClient, getProducts */

(function () {
    var CATEGORY_OPTIONS = ['HQD', 'POD', 'Жидкости', 'Снюс'];

    var editingId = null;
    var pendingImageUrl = null;

    var form = document.getElementById('adm-product-form');
    var listEl = document.getElementById('adm-products-list');
    var submitBtn = document.getElementById('adm-submit-btn');
    var cancelEditBtn = document.getElementById('adm-cancel-edit');
    var imageInput = document.getElementById('adm-image');
    var formTitle = document.getElementById('adm-form-title');
    var specsListEl = document.getElementById('specs-list');
    var flavorsListEl = document.getElementById('flavors-list');
    var addSpecBtn = document.getElementById('adm-add-spec');
    var addFlavorBtn = document.getElementById('adm-add-flavor');
    var catalogProducts = [];
    var PLACEHOLDER_IMG = 'https://placehold.co/400x400/0a0e17/00d4ff?text=Нет+фото';

    function showMessage(text, isError) {
        var el = document.getElementById('adm-message');
        if (!el) return;
        el.textContent = text;
        el.className = 'adm-message' + (isError ? ' adm-message--error' : ' adm-message--ok');
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function parseSpecs(specsString) {
        return parseSpecsFromDb(specsString);
    }

    function parseFlavors(flavorsString) {
        return parseFlavorsFromDb(flavorsString);
    }

    function parseSpecsFromDb(raw) {
        if (!raw || !String(raw).trim()) return [];

        var str = String(raw).trim();
        if (str.charAt(0) === '[') {
            try {
                var parsed = JSON.parse(str);
                if (Array.isArray(parsed)) {
                    return parsed.map(function (item) {
                        return {
                            label: (item.label || item.name || '').trim(),
                            value: (item.value || '').trim()
                        };
                    }).filter(function (item) { return item.label || item.value; });
                }
            } catch (e) { /* legacy below */ }
        }

        var legacy = [];
        str.split(',').forEach(function (part) {
            var piece = part.trim();
            if (!piece) return;
            var colonIdx = piece.indexOf(':');
            if (colonIdx === -1) return;
            legacy.push({
                label: piece.slice(0, colonIdx).trim(),
                value: piece.slice(colonIdx + 1).trim()
            });
        });
        return legacy;
    }

    function parseFlavorsFromDb(raw) {
        if (!raw || !String(raw).trim()) return [];

        var str = String(raw).trim();
        if (str.charAt(0) === '[') {
            try {
                var parsed = JSON.parse(str);
                if (Array.isArray(parsed)) {
                    return parsed.map(function (item) {
                        var name = (item.name || item.label || '').trim();
                        var inStock = item.inStock;
                        if (inStock === undefined) inStock = item.in_stock;
                        if (inStock === undefined) inStock = item.available;
                        if (inStock === undefined) inStock = true;
                        return { name: name, inStock: inStock !== false };
                    }).filter(function (item) { return item.name; });
                }
            } catch (e) { /* legacy below */ }
        }

        var result = { available: [], unavailable: [] };
        var lines = str.split(/\n|\|/);
        lines.forEach(function (line) {
            var flavor = line.trim();
            if (!flavor) return;
            if (flavor.indexOf('❌') !== -1 || flavor.indexOf('✖') !== -1) {
                flavor = flavor.replace(/[❌✖]/g, '').trim();
                if (flavor) result.unavailable.push(flavor);
            } else {
                flavor = flavor.replace(/[✅✔✓]/g, '').trim();
                if (flavor) result.available.push(flavor);
            }
        });

        if (!result.available.length && !result.unavailable.length && str.indexOf(',') !== -1) {
            str.split(',').forEach(function (s) {
                var n = s.trim();
                if (n) result.available.push(n);
            });
        }

        var legacy = [];
        result.available.forEach(function (n) { legacy.push({ name: n, inStock: true }); });
        result.unavailable.forEach(function (n) { legacy.push({ name: n, inStock: false }); });
        return legacy;
    }

    function collectSpecsFromDom() {
        var rows = specsListEl.querySelectorAll('.adm-spec-row');
        var arr = [];
        rows.forEach(function (row) {
            var label = row.querySelector('.adm-spec-label').value.trim();
            var value = row.querySelector('.adm-spec-value').value.trim();
            if (label || value) {
                arr.push({ label: label, value: value });
            }
        });
        return arr;
    }

    function collectFlavorsFromDom() {
        var rows = flavorsListEl.querySelectorAll('.adm-flavor-row');
        var arr = [];
        rows.forEach(function (row) {
            var name = row.querySelector('.adm-flavor-name').value.trim();
            if (!name) return;
            arr.push({
                name: name,
                inStock: row.querySelector('.adm-flavor-stock').checked
            });
        });
        return arr;
    }

    function renderSpecsList(specsArray) {
        specsListEl.innerHTML = '';
        (specsArray || []).forEach(function (spec) {
            addSpecRow(spec.label, spec.value);
        });
    }

    function addSpecRow(label, value) {
        var row = document.createElement('div');
        row.className = 'adm-dynamic-row adm-spec-row';
        row.innerHTML =
            '<input type="text" class="adm-spec-label" placeholder="Название" value="' + escapeHtml(label || '') + '">' +
            '<input type="text" class="adm-spec-value" placeholder="Значение" value="' + escapeHtml(value || '') + '">' +
            '<button type="button" class="adm-btn--remove" title="Удалить" aria-label="Удалить">−</button>';

        row.querySelector('.adm-btn--remove').addEventListener('click', function () {
            row.remove();
        });

        specsListEl.appendChild(row);
    }

    function renderFlavorsList(flavorsArray) {
        flavorsListEl.innerHTML = '';
        (flavorsArray || []).forEach(function (flavor) {
            addFlavorRow(flavor.name, flavor.inStock);
        });
    }

    function addFlavorRow(name, inStock) {
        var checked = inStock !== false ? ' checked' : '';
        var row = document.createElement('div');
        row.className = 'adm-dynamic-row adm-flavor-row';
        row.innerHTML =
            '<input type="text" class="adm-flavor-name" placeholder="Название вкуса" value="' + escapeHtml(name || '') + '">' +
            '<label class="adm-flavor-check">' +
                '<input type="checkbox" class="adm-flavor-stock"' + checked + '> В наличии' +
            '</label>' +
            '<button type="button" class="adm-btn--remove" title="Удалить" aria-label="Удалить">−</button>';

        flavorsListEl.appendChild(row);

        row.querySelector('.adm-btn--remove').addEventListener('click', function () {
            row.remove();
        });
    }

    function setCategorySelect(category) {
        var sel = document.getElementById('adm-category');
        var val = (category || '').trim();
        var match = CATEGORY_OPTIONS.find(function (opt) {
            return opt.toLowerCase() === val.toLowerCase() ||
                val.toLowerCase().indexOf(opt.toLowerCase()) !== -1;
        });
        sel.value = match || CATEGORY_OPTIONS[0];
    }

    function resetLists() {
        renderSpecsList([]);
        renderFlavorsList([]);
        addSpecRow();
        addFlavorRow();
    }

    function getFormData() {
        var specsArr = collectSpecsFromDom();
        var flavorsArr = collectFlavorsFromDom();

        return {
            name: document.getElementById('adm-name').value.trim(),
            price: parseInt(document.getElementById('adm-price').value, 10) || 0,
            category: document.getElementById('adm-category').value,
            description: document.getElementById('adm-description').value.trim(),
            specs: JSON.stringify(specsArr),
            flavors: JSON.stringify(flavorsArr),
            in_stock: document.getElementById('adm-in-stock').checked
        };
    }

    function resetForm() {
        editingId = null;
        pendingImageUrl = null;
        form.reset();
        document.getElementById('adm-in-stock').checked = true;
        setCategorySelect('HQD');
        submitBtn.textContent = 'Добавить товар';
        formTitle.textContent = 'Добавить товар';
        if (cancelEditBtn) cancelEditBtn.style.display = 'none';
        resetLists();
    }

    async function uploadImage(file) {
        var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        var fileName = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;

        var uploadResult = await supabaseClient.storage
            .from('images')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadResult.error) {
            throw new Error(uploadResult.error.message);
        }

        var urlResult = supabaseClient.storage.from('images').getPublicUrl(fileName);
        return urlResult.data.publicUrl;
    }

    async function saveProduct(payload) {
        var insertPayload = Object.assign({}, payload, {
            in_stock: payload.in_stock !== false
        });

        var result = await supabaseClient.from('products').insert([insertPayload]).select();
        if (result.error) throw new Error(result.error.message);
        return result.data;
    }

    async function updateProduct(id, payload) {
        var result = await supabaseClient
            .from('products')
            .update(payload)
            .eq('id', id)
            .select();

        if (result.error) throw new Error(result.error.message);
        return result.data;
    }

    async function deleteProduct(id) {
        if (!window.confirm('Удалить товар?')) return;

        var result = await supabaseClient.from('products').delete().eq('id', id);
        if (result.error) throw new Error(result.error.message);
        await loadProducts();
        showMessage('Товар удалён');
    }

    function buildSpecsHtml(specsRaw, limit) {
        var specs = parseSpecs(specsRaw);
        if (!specs.length) {
            return '<p class="product-preview">Характеристики не указаны</p>';
        }
        return specs.slice(0, limit || 3).map(function (spec) {
            return '<p class="product-preview">' + escapeHtml(spec.label) + ': <strong>' + escapeHtml(spec.value) + '</strong></p>';
        }).join('');
    }

    function buildFlavorsHtml(flavorsRaw, limit) {
        var flavors = parseFlavors(flavorsRaw);
        if (!flavors.length) {
            return '<div class="flavor-item unavailable"><span>Нет вкусов</span></div>';
        }
        var max = limit || 5;
        var html = flavors.slice(0, max).map(function (flavor) {
            var cls = flavor.inStock !== false ? 'available' : 'unavailable';
            var icon = flavor.inStock !== false ? '✅' : '❌';
            return '<div class="flavor-item ' + cls + '"><span>' + icon + '</span><span>' + escapeHtml(flavor.name) + '</span></div>';
        }).join('');
        if (flavors.length > max) {
            html += '<p class="product-preview">+' + (flavors.length - max) + ' ещё</p>';
        }
        return html;
    }

    function renderAdminProductsList(products) {
        catalogProducts = products || [];

        if (!catalogProducts.length) {
            listEl.innerHTML = '<p class="adm-empty">Товаров пока нет</p>';
            return;
        }

        listEl.innerHTML = catalogProducts.map(function (p) {
            var img = escapeHtml(p.image_url || PLACEHOLDER_IMG);
            var badgeClass = p.in_stock !== false ? '' : ' out';
            var badgeText = p.in_stock !== false ? 'В каталоге' : 'Нет в наличии';
            var specsHtml = buildSpecsHtml(p.specs, 3);
            var flavorsHtml = buildFlavorsHtml(p.flavors, 5);

            return (
                '<article class="product-card" data-id="' + p.id + '">' +
                    '<div class="product-image">' +
                        '<img src="' + img + '" alt="' + escapeHtml(p.name) + '" onerror="this.src=\'' + PLACEHOLDER_IMG + '\'">' +
                        '<div class="stock-badge' + badgeClass + '">' + badgeText + '</div>' +
                    '</div>' +
                    '<div class="product-info">' +
                        '<span class="adm-product-category">' + escapeHtml(p.category) + '</span>' +
                        '<h3 class="product-title">' + escapeHtml(p.name) + '</h3>' +
                        '<div class="product-price">' + (parseFloat(p.price) || 0) + ' ₽</div>' +
                        '<div class="adm-card-specs">' + specsHtml + '</div>' +
                        '<div class="adm-card-flavors">' + flavorsHtml + '</div>' +
                        '<div class="adm-card-actions">' +
                            '<button type="button" class="adm-btn adm-btn--ghost" data-action="edit" data-id="' + p.id + '">✏️ Редактировать</button>' +
                            '<button type="button" class="adm-btn adm-btn--danger" data-action="delete" data-id="' + p.id + '">🗑️ Удалить</button>' +
                        '</div>' +
                    '</div>' +
                '</article>'
            );
        }).join('');

        listEl.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var product = catalogProducts.find(function (item) {
                    return item.id == btn.getAttribute('data-id');
                });
                if (product) fillEditForm(product);
            });
        });

        listEl.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                deleteProduct(btn.getAttribute('data-id')).catch(function (err) {
                    showMessage(err.message, true);
                });
            });
        });
    }

    function fillEditForm(product) {
        if (!product) return;

        editingId = product.id;
        pendingImageUrl = product.image_url || null;

        document.getElementById('adm-name').value = product.name || '';
        document.getElementById('adm-price').value = product.price || 0;
        setCategorySelect(product.category || '');
        document.getElementById('adm-description').value = product.description || '';
        document.getElementById('adm-in-stock').checked = product.in_stock !== false;

        renderSpecsList(parseSpecs(product.specs));
        renderFlavorsList(parseFlavors(product.flavors));

        if (!specsListEl.children.length) addSpecRow();
        if (!flavorsListEl.children.length) addFlavorRow();

        submitBtn.textContent = 'Сохранить';
        formTitle.textContent = 'Редактировать товар';
        if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function loadProducts() {
        var products = await getProducts();
        renderAdminProductsList(products);
        return products;
    }

    addSpecBtn.addEventListener('click', function () {
        addSpecRow();
    });

    addFlavorBtn.addEventListener('click', function () {
        addFlavorRow();
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        showMessage('Сохранение...');

        try {
            var data = getFormData();
            var imageUrl = pendingImageUrl;

            if (imageInput.files && imageInput.files[0]) {
                imageUrl = await uploadImage(imageInput.files[0]);
            }

            var payload = {
                name: data.name,
                price: data.price,
                category: data.category,
                description: data.description,
                specs: data.specs,
                flavors: data.flavors,
                in_stock: data.in_stock
            };

            if (imageUrl) {
                payload.image_url = imageUrl;
            }

            if (editingId) {
                await updateProduct(editingId, payload);
                showMessage('Товар обновлён');
            } else {
                if (!imageUrl) {
                    showMessage('Добавьте фото товара', true);
                    return;
                }
                await saveProduct(payload);
                showMessage('Товар добавлен');
            }

            resetForm();
            await loadProducts();
        } catch (err) {
            showMessage(err.message || 'Ошибка сохранения', true);
        }
    });

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function () {
            resetForm();
            showMessage('');
        });
    }

    resetLists();

    loadProducts().catch(function (err) {
        showMessage(err.message || 'Не удалось загрузить товары', true);
    });

    window.uploadImage = uploadImage;
    window.saveProduct = saveProduct;
    window.updateProduct = updateProduct;
    window.deleteProduct = deleteProduct;
    window.loadProducts = loadProducts;
    window.renderSpecsList = renderSpecsList;
    window.addSpecRow = addSpecRow;
    window.renderFlavorsList = renderFlavorsList;
    window.addFlavorRow = addFlavorRow;
    window.parseSpecs = parseSpecs;
    window.parseFlavors = parseFlavors;
    window.renderAdminProductsList = renderAdminProductsList;
    window.fillEditForm = fillEditForm;
})();

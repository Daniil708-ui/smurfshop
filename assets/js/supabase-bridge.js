/* global supabase */

var SUPABASE_URL = 'https://dyclzexjwkcacfymtqop.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_mGSBf687TIxhJK9YDexqig_bTdOymiT';

var supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

var PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/0a0e17/00d4ff?text=Нет+фото';

/**
 * Загружает товары из Supabase (все записи; фильтр по категориям — в рендере).
 */
async function getProducts() {
    var result = await supabaseClient
        .from('products')
        .select('*')
        .order('name', { ascending: true });

    if (result.error) {
        throw new Error(result.error.message);
    }

    return result.data || [];
}

/**
 * Парсит характеристики: JSON [{"label":"Никотин","value":"5%"}] или legacy "Никотин: 5%, ..."
 */
function parseSpecs(specsStr) {
    var result = {
        nicotine: '-',
        puffs: '-',
        rechargeable: '-',
        mah: '-'
    };

    if (!specsStr || !String(specsStr).trim()) {
        return result;
    }

    var str = String(specsStr).trim();

    function applyLabelValue(key, value) {
        if (!value) return;
        if (key.indexOf('никотин') !== -1) {
            result.nicotine = value;
        } else if (key.indexOf('затяж') !== -1) {
            result.puffs = value;
        } else if (key.indexOf('заряд') !== -1) {
            result.rechargeable = value;
        } else if (key.indexOf('батар') !== -1) {
            result.mah = value.toLowerCase().indexOf('mah') !== -1 ? value : value + 'mAh';
        }
    }

    if (str.charAt(0) === '[') {
        try {
            var jsonSpecs = JSON.parse(str);
            if (Array.isArray(jsonSpecs)) {
                jsonSpecs.forEach(function (item) {
                    var label = String(item.label || item.name || '').trim().toLowerCase();
                    var value = String(item.value || '').trim();
                    applyLabelValue(label, value);
                });
                return result;
            }
        } catch (e) { /* legacy */ }
    }

    var parts = str.split(',');
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i].trim();
        if (!part) continue;

        var colonIdx = part.indexOf(':');
        if (colonIdx === -1) continue;

        var key = part.slice(0, colonIdx).trim().toLowerCase();
        var val = part.slice(colonIdx + 1).trim();
        applyLabelValue(key, val);
    }

    return result;
}

/**
 * Парсит вкусы: JSON [{"name":"...","inStock":true}] или legacy текст.
 */
function parseFlavorsFromString(str) {
    var result = { available: [], unavailable: [] };

    if (!str || str === '-') {
        return result;
    }

    var raw = String(str).trim();

    if (raw.charAt(0) === '[') {
        try {
            var jsonFlavors = JSON.parse(raw);
            if (Array.isArray(jsonFlavors)) {
                jsonFlavors.forEach(function (item) {
                    var name = String(item.name || item.label || '').trim();
                    if (!name) return;
                    var inStock = item.inStock;
                    if (inStock === undefined) inStock = item.in_stock;
                    if (inStock === undefined) inStock = item.available;
                    if (inStock === undefined) inStock = true;
                    if (inStock !== false) {
                        result.available.push(name);
                    } else {
                        result.unavailable.push(name);
                    }
                });
                return result;
            }
        } catch (e) { /* legacy */ }
    }

    var flavors = raw.split(/\n|\|/);

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

    if (result.available.length === 0 && result.unavailable.length === 0 && raw.indexOf(',') !== -1) {
        var simple = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        result.available = simple;
    }

    return result;
}

/**
 * Преобразует строки БД в формат для renderCategory / openModal / корзины.
 */
function mapDataToCardFormat(products) {
    return products.map(function(p) {
        var specs = parseSpecs(p.specs || '');

        return {
            id: p.id,
            category: p.category || '',
            model: p.name || '',
            price: parseFloat(p.price) || 0,
            image: p.image_url || PLACEHOLDER_IMAGE,
            description: p.description || '',
            nicotine: specs.nicotine,
            puffs: specs.puffs,
            rechargeable: specs.rechargeable,
            mah: specs.mah,
            flavors: parseFlavorsFromString(p.flavors || ''),
            in_stock: p.in_stock !== false
        };
    });
}

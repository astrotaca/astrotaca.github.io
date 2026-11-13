// Shop page: product grid, product pages (/shop?item=...) and a cart drawer kept in localStorage.
// Prices shown here are for display only; the server re-checks everything with Stripe at checkout.
(function () {
    'use strict';

    var CART_KEY = 'astrotaca-cart-v1';
    var $ = function (id) { return document.getElementById(id); };

    var listView = $('shop-list-view');
    var productView = $('shop-product-view');
    var gridEl = $('shop-products');
    var toolbarEl = $('shop-toolbar');
    var filtersEl = $('shop-filters');
    var countEl = $('shop-count');
    var sortEl = $('shop-sort');
    var drawer = $('shop-cart');
    var overlay = $('cart-overlay');
    var linesEl = $('cart-lines');
    var emptyEl = $('cart-empty');
    var footEl = $('cart-foot');
    var subtotalEl = $('cart-subtotal');
    var headCountEl = $('cart-head-count');
    var checkoutButton = $('checkout-button');
    var messageEl = $('cart-message');
    if (!listView || !productView || !gridEl || !drawer) return;

    var BASE_TITLE = document.title;
    var products = [];
    var catalog = {};      // price id -> { product, variant }
    var shopOpen = false;
    var loaded = false;
    var cart = loadCart();
    var refreshers = [];   // re-render functions for "Add to cart" buttons on screen
    var lastFocus = null;
    var cartButton = null;
    var cartBadge = null;

    // ---------- helpers ----------

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var ICONS = {
        bag: ['M6 7h12l-1 13H7z', 'M9 7a3 3 0 0 1 6 0'],
        lock: ['M6 11h12v10H6z', 'M8 11V7a4 4 0 0 1 8 0v4'],
        box: ['M21 8l-9-5-9 5v8l9 5 9-5z', 'M3 8l9 5 9-5M12 13v8'],
        chat: ['M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'],
        check: ['M5 12l5 5 9-10'],
        arrow: ['M5 12h14M13 6l6 6-6 6'],
        back: ['M19 12H5M11 6l-6 6 6 6'],
        image: ['M4 5h16v14H4z', 'M4 16l5-5 4 4 3-3 4 4', 'M15 9h.01'],
        truck: ['M3 6h11v10H3z', 'M14 9h4l3 3v4h-7', 'M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01'],
        ruler: ['M3 15L15 3l6 6L9 21z', 'M7 11l2 2M10 8l2 2M13 5l2 2']
    };

    function icon(name, className) {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        if (className) svg.setAttribute('class', className);
        ICONS[name].forEach(function (d) {
            var path = document.createElementNS(SVG_NS, 'path');
            path.setAttribute('d', d);
            svg.appendChild(path);
        });
        return svg;
    }

    function formatMoney(amount, currency) {
        var code = String(currency || 'eur').toUpperCase();
        try {
            var digits = new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits;
            var value = amount / Math.pow(10, digits);
            // Whole amounts read better without ".00".
            var whole = value === Math.round(value);
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: code,
                minimumFractionDigits: whole ? 0 : digits,
                maximumFractionDigits: digits
            }).format(value);
        } catch (e) {
            return (amount / 100).toFixed(2) + ' ' + code;
        }
    }

    function productHref(product) {
        return '/shop?item=' + encodeURIComponent(product.id);
    }

    function imageOf(product, variant) {
        return (variant && variant.image) || product.images[0] || null;
    }

    function imageBox(src, alt, className) {
        var box = el('div', className);
        if (src) {
            var img = el('img');
            img.src = src;
            img.alt = alt;
            img.loading = 'lazy';
            img.decoding = 'async';
            box.appendChild(img);
        } else {
            box.classList.add('is-placeholder');
            box.appendChild(icon('image'));
        }
        return box;
    }

    function available(product) {
        return product.variants.filter(function (v) { return !v.soldOut; });
    }

    function lowestPrice(product) {
        var pool = available(product).length ? available(product) : product.variants;
        return pool.reduce(function (min, v) { return v.amount < min.amount ? v : min; }, pool[0]);
    }

    function priceText(product) {
        var low = lowestPrice(product);
        var varies = product.variants.some(function (v) { return v.amount !== low.amount; });
        return (varies ? 'From ' : '') + formatMoney(low.amount, low.currency);
    }

    // One short status for a product or a size: [css modifier, text].
    function stockStatus(variants) {
        var open = variants.filter(function (v) { return !v.soldOut; });
        if (!open.length) return ['out', 'Sold out'];
        var low = open.filter(function (v) { return v.left; });
        if (low.length === open.length) {
            var left = low.reduce(function (sum, v) { return sum + v.left; }, 0);
            return ['low', 'Only ' + left + ' left'];
        }
        if (open.some(function (v) { return v.stocked; })) return ['in', 'In stock'];
        // No stock count (built to order): stay positive, the shipping time says the rest.
        return ['order', 'Available'];
    }

    function itemName(entry) {
        var label = entry.variant.label;
        if (!label || entry.product.name.indexOf(label) !== -1) return entry.product.name;
        return label.indexOf(entry.product.name) === 0 ? label : entry.product.name + ' (' + label + ')';
    }

    function showMessage(text) {
        messageEl.textContent = text || '';
    }

    // ---------- cart state ----------

    function loadCart() {
        try {
            var parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
            return Array.isArray(parsed) ? parsed.filter(function (item) {
                return item && typeof item.price === 'string' && item.quantity > 0;
            }) : [];
        } catch (e) {
            return [];
        }
    }

    function saveCart() {
        try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    }

    function limitFor(entry) {
        if (entry.variant.soldOut) return 0;
        var limit = entry.variant.maxPerOrder || 5;
        if (entry.variant.left) limit = Math.min(limit, entry.variant.left);
        return limit;
    }

    function quantityOf(price) {
        var item = cart.filter(function (line) { return line.price === price; })[0];
        return item ? item.quantity : 0;
    }

    function setQuantity(price, quantity) {
        var entry = catalog[price];
        if (!entry) return;
        quantity = Math.max(0, Math.min(quantity, limitFor(entry)));
        var existing = cart.filter(function (item) { return item.price === price; })[0];
        if (existing && quantity === 0) {
            cart = cart.filter(function (item) { return item.price !== price; });
        } else if (existing) {
            existing.quantity = quantity;
        } else if (quantity > 0) {
            cart.push({ price: price, quantity: quantity });
        }
        saveCart();
        renderCart();
    }

    function cartCount() {
        return cart.reduce(function (sum, item) { return catalog[item.price] ? sum + item.quantity : sum; }, 0);
    }

    // ---------- cart drawer ----------

    function stepper(value, max, onChange, name) {
        var wrap = el('div', 'qty');
        var minus = el('button', 'qty-btn', '−');
        minus.type = 'button';
        minus.setAttribute('aria-label', 'Decrease quantity of ' + name);
        var out = el('span', 'qty-value', String(value));
        out.setAttribute('aria-live', 'polite');
        var plus = el('button', 'qty-btn', '+');
        plus.type = 'button';
        plus.setAttribute('aria-label', 'Increase quantity of ' + name);

        function sync() {
            out.textContent = String(value);
            minus.disabled = value <= 1;
            plus.disabled = value >= max();
        }
        minus.addEventListener('click', function () { if (value > 1) { value -= 1; onChange(value); sync(); } });
        plus.addEventListener('click', function () { if (value < max()) { value += 1; onChange(value); sync(); } });
        wrap.appendChild(minus);
        wrap.appendChild(out);
        wrap.appendChild(plus);
        wrap.set = function (next) { value = next; sync(); };
        sync();
        return wrap;
    }

    function renderCart() {
        linesEl.textContent = '';
        var subtotal = 0;
        var currency = null;
        var count = cartCount();

        cart.forEach(function (item) {
            var entry = catalog[item.price];
            if (!entry) return;
            currency = currency || entry.variant.currency;
            subtotal += entry.variant.amount * item.quantity;

            var li = el('li', 'cart-line');
            var thumbLink = el('a', 'cart-line-thumb');
            thumbLink.href = productHref(entry.product);
            thumbLink.tabIndex = -1;
            thumbLink.appendChild(imageBox(imageOf(entry.product, entry.variant), '', 'cart-thumb'));
            li.appendChild(thumbLink);

            var info = el('div', 'cart-line-info');
            var name = el('a', 'cart-line-name', entry.product.name);
            name.href = productHref(entry.product);
            info.appendChild(name);
            if (entry.variant.label && entry.product.name.indexOf(entry.variant.label) === -1) {
                info.appendChild(el('span', 'cart-line-variant', entry.variant.label));
            }
            info.appendChild(el('span', 'cart-line-unit', formatMoney(entry.variant.amount, entry.variant.currency) + ' each'));

            var controls = el('div', 'cart-line-controls');
            controls.appendChild(stepper(item.quantity, function () { return limitFor(entry); }, function (value) {
                setQuantity(item.price, value);
            }, itemName(entry)));
            var remove = el('button', 'cart-remove', 'Remove');
            remove.type = 'button';
            remove.setAttribute('aria-label', 'Remove ' + itemName(entry) + ' from cart');
            remove.addEventListener('click', function () { setQuantity(item.price, 0); });
            controls.appendChild(remove);
            info.appendChild(controls);
            li.appendChild(info);

            li.appendChild(el('span', 'cart-line-total', formatMoney(entry.variant.amount * item.quantity, entry.variant.currency)));
            linesEl.appendChild(li);
        });

        emptyEl.hidden = count > 0;
        footEl.hidden = count === 0;
        subtotalEl.textContent = count ? formatMoney(subtotal, currency) : '';
        headCountEl.textContent = count ? '(' + count + ')' : '';
        checkoutButton.disabled = !shopOpen || count === 0;
        if (cartBadge) {
            cartBadge.textContent = String(count);
            cartBadge.hidden = count === 0;
            cartButton.setAttribute('aria-label', 'Open cart, ' + count + (count === 1 ? ' item' : ' items'));
        }
        refreshers.forEach(function (refresh) { refresh(); });
    }

    function openCart() {
        if (!drawer.hidden) return;
        lastFocus = document.activeElement;
        overlay.hidden = false;
        drawer.hidden = false;
        document.documentElement.classList.add('cart-open');
        // Let the browser paint the closed state first so the slide-in animates.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                overlay.classList.add('is-open');
                drawer.classList.add('is-open');
            });
        });
        $('cart-close').focus();
    }

    function closeCart() {
        if (drawer.hidden) return;
        overlay.classList.remove('is-open');
        drawer.classList.remove('is-open');
        document.documentElement.classList.remove('cart-open');
        setTimeout(function () {
            if (!drawer.classList.contains('is-open')) { drawer.hidden = true; overlay.hidden = true; }
        }, 250);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function addCartButton() {
        var nav = document.querySelector('.top-nav');
        if (!nav || cartButton) return;
        cartButton = el('button', 'shop-cart-button');
        cartButton.type = 'button';
        cartButton.appendChild(icon('bag'));
        cartButton.appendChild(el('span', 'shop-cart-button-text', 'Cart'));
        cartBadge = el('span', 'shop-cart-badge', '0');
        cartButton.appendChild(cartBadge);
        cartButton.setAttribute('aria-haspopup', 'dialog');
        cartButton.setAttribute('aria-controls', 'shop-cart');
        cartButton.addEventListener('click', openCart);
        nav.appendChild(cartButton);
    }

    overlay.addEventListener('click', closeCart);
    $('cart-close').addEventListener('click', closeCart);
    $('cart-continue').addEventListener('click', function () {
        closeCart();
        if (!productView.hidden) return;
        navigate('/shop');
    });
    document.addEventListener('keydown', function (event) {
        if (drawer.hidden) return;
        if (event.key === 'Escape') { closeCart(); return; }
        if (event.key !== 'Tab') return;
        // Keep keyboard focus inside the open drawer.
        var focusable = Array.prototype.filter.call(
            drawer.querySelectorAll('a[href], button:not([disabled])'),
            function (node) { return node.offsetParent !== null && node.tabIndex !== -1; }
        );
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    // ---------- product grid ----------

    var state = { category: '', sort: 'featured' };

    function categories() {
        var seen = [];
        products.forEach(function (p) { if (p.category && seen.indexOf(p.category) === -1) seen.push(p.category); });
        return seen;
    }

    function renderFilters() {
        filtersEl.textContent = '';
        var list = categories();
        filtersEl.hidden = list.length < 2;
        if (filtersEl.hidden) return;
        [''].concat(list).forEach(function (name) {
            var chip = el('button', 'shop-chip', name || 'All');
            chip.type = 'button';
            chip.setAttribute('aria-pressed', String(state.category === name));
            chip.addEventListener('click', function () {
                state.category = name;
                var url = name ? '/shop?category=' + encodeURIComponent(name) : '/shop';
                history.replaceState(null, '', url);
                renderList();
            });
            filtersEl.appendChild(chip);
        });
    }

    function sortedProducts() {
        var list = products.filter(function (p) { return !state.category || p.category === state.category; });
        var order = list.slice();
        if (state.sort === 'price-asc') order.sort(function (a, b) { return lowestPrice(a).amount - lowestPrice(b).amount; });
        if (state.sort === 'price-desc') order.sort(function (a, b) { return lowestPrice(b).amount - lowestPrice(a).amount; });
        if (state.sort === 'name') order.sort(function (a, b) { return a.name.localeCompare(b.name); });
        // Sold-out products move to the end, whatever the sort.
        return order.filter(function (p) { return available(p).length; })
            .concat(order.filter(function (p) { return !available(p).length; }));
    }

    // Smallest and largest dew shield a product fits across all its sizes, or null.
    function fitSpan(product) {
        var fits = product.variants.filter(function (v) { return v.fit; }).map(function (v) { return v.fit; });
        if (!fits.length) return null;
        return {
            min: Math.min.apply(null, fits.map(function (f) { return f.min; })),
            max: Math.max.apply(null, fits.map(function (f) { return f.max; }))
        };
    }

    function formatRange(fit) {
        return fit.min === fit.max ? fit.min + ' mm' : fit.min + '–' + fit.max + ' mm';
    }

    function renderCard(product, headingTag, featured) {
        var card = el('a', 'shop-card' + (featured ? ' is-featured' : ''));
        card.href = productHref(product);
        card.addEventListener('click', function (event) {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            navigate(productHref(product));
        });

        var media = imageBox(product.images[0], product.name, 'shop-card-media');
        var cardImage = media.querySelector('img');
        if (featured && cardImage) cardImage.loading = 'eager';
        var status = stockStatus(product.variants);
        if (status[0] === 'out') card.classList.add('is-sold-out');
        if (status[0] === 'out') {
            media.appendChild(el('span', 'shop-badge shop-badge-out', status[1]));
        } else if (product.badge) {
            media.appendChild(el('span', 'shop-badge', product.badge));
        }
        card.appendChild(media);

        var body = el('div', 'shop-card-body');
        if (product.category) body.appendChild(el('p', 'shop-eyebrow', product.category));
        body.appendChild(el(headingTag || 'h2', 'shop-card-title', product.name));

        var span = fitSpan(product);
        if (span) body.appendChild(el('p', 'shop-card-fit', 'Fits dew shields ' + formatRange(span)));
        if (featured && product.description) {
            body.appendChild(el('p', 'shop-card-text', product.description.split(/\n+/)[0]));
        } else if (!span && product.description) {
            body.appendChild(el('p', 'shop-card-text', product.description.split(/\n+/)[0]));
        }
        if (featured && product.worksWith.length) {
            var works = el('ul', 'pd-works shop-card-works');
            works.setAttribute('aria-label', 'Works with');
            product.worksWith.forEach(function (name) { works.appendChild(el('li', 'pd-work', name)); });
            body.appendChild(works);
        }

        var foot = el('div', 'shop-card-foot');
        var price = el('div', 'shop-card-price');
        price.appendChild(el('span', 'shop-price', priceText(product)));
        var availability = el('span', 'shop-card-availability shop-status-' + status[0]);
        availability.appendChild(el('span', 'shop-dot'));
        var availabilityText = status[1];
        if (status[0] === 'order' && product.ships) availabilityText = product.ships;
        else if (status[0] !== 'out' && product.ships) availabilityText += ' · ' + product.ships;
        availability.appendChild(document.createTextNode(availabilityText));
        price.appendChild(availability);
        foot.appendChild(price);
        var cta = el('span', featured ? 'btn-link shop-card-cta is-button' : 'shop-card-cta');
        cta.appendChild(el('span', null, product.variants.length > 1 ? 'Choose size' : 'View details'));
        cta.appendChild(icon('arrow'));
        foot.appendChild(cta);
        body.appendChild(foot);
        card.appendChild(body);
        return card;
    }

    function renderEmpty() {
        toolbarEl.hidden = true;
        $('shop-faq').hidden = true;
        gridEl.textContent = '';
        var box = el('div', 'shop-empty');
        box.appendChild(icon('box'));
        box.appendChild(el('h2', null, 'Nothing for sale just yet'));
        var p = el('p', null, 'The flat panel is on its way. ');
        var link = el('a', null, 'Register your interest');
        link.href = '/flatpanel#panel-interest';
        p.appendChild(link);
        p.appendChild(document.createTextNode(' and I\'ll let you know when it\'s available.'));
        box.appendChild(p);
        gridEl.appendChild(box);
    }

    function renderList() {
        if (!products.length) { renderEmpty(); return; }
        if (state.category && categories().indexOf(state.category) === -1) state.category = '';
        renderFilters();
        // Sorting a handful of products is just noise, so the toolbar waits until there is a real choice.
        var showSort = products.length >= 4;
        sortEl.parentNode.hidden = !showSort;
        toolbarEl.hidden = filtersEl.hidden && !showSort;
        sortEl.value = state.sort;
        var list = sortedProducts();
        countEl.textContent = showSort ? list.length + (list.length === 1 ? ' product' : ' products') : '';
        gridEl.textContent = '';
        // The first product gets a wide spot on the unfiltered, featured view.
        var featureFirst = !state.category && state.sort === 'featured' && list.length && available(list[0]).length;
        list.forEach(function (product, index) {
            gridEl.appendChild(renderCard(product, 'h2', featureFirst && index === 0));
        });
        $('shop-faq').hidden = false;
    }

    sortEl.addEventListener('change', function () {
        state.sort = sortEl.value;
        renderList();
    });

    // ---------- product page ----------

    function renderGallery(product, variant) {
        var gallery = el('div', 'pd-gallery');
        var images = product.images.slice();
        var main = imageBox(imageOf(product, variant), product.name, 'pd-main');
        gallery.appendChild(main);

        var thumbs = el('div', 'pd-thumbs');
        function show(src) {
            var img = main.querySelector('img');
            if (img && src) img.src = src;
            Array.prototype.forEach.call(thumbs.children, function (button) {
                button.setAttribute('aria-current', String(button.dataset.src === src));
            });
        }
        if (images.length > 1) {
            images.forEach(function (src, index) {
                var button = el('button', 'pd-thumb');
                button.type = 'button';
                button.dataset.src = src;
                button.setAttribute('aria-label', 'Show image ' + (index + 1) + ' of ' + images.length);
                var img = el('img');
                img.src = src;
                img.alt = '';
                img.loading = 'lazy';
                button.appendChild(img);
                button.addEventListener('click', function () { show(src); });
                thumbs.appendChild(button);
            });
            gallery.appendChild(thumbs);
        }
        gallery.show = show;
        show(imageOf(product, variant));
        return gallery;
    }

    function section(className, titleText, id) {
        var box = el('section', 'pd-section ' + className);
        var title = el('h2', null, titleText);
        title.id = id;
        box.setAttribute('aria-labelledby', id);
        box.appendChild(title);
        return box;
    }

    function renderProductPage(product) {
        refreshers = [];
        productView.textContent = '';
        document.title = product.name + ' | AstroTaca Shop';
        var hasFit = product.variants.some(function (v) { return v.fit; });
        var multi = product.variants.length > 1;
        var paragraphs = product.description.split(/\n+/).map(function (p) { return p.trim(); }).filter(Boolean);

        // Breadcrumbs
        var crumbs = el('nav', 'pd-crumbs');
        crumbs.setAttribute('aria-label', 'Breadcrumb');
        var shopLink = el('a', null, 'Shop');
        shopLink.href = '/shop';
        shopLink.addEventListener('click', function (event) { event.preventDefault(); navigate('/shop'); });
        crumbs.appendChild(shopLink);
        if (product.category) {
            crumbs.appendChild(el('span', 'pd-crumb-sep', '/'));
            var catLink = el('a', null, product.category);
            catLink.href = '/shop?category=' + encodeURIComponent(product.category);
            catLink.addEventListener('click', function (event) { event.preventDefault(); navigate(catLink.getAttribute('href')); });
            crumbs.appendChild(catLink);
        }
        crumbs.appendChild(el('span', 'pd-crumb-sep', '/'));
        var current = el('span', 'pd-crumb-current', product.name);
        current.setAttribute('aria-current', 'page');
        crumbs.appendChild(current);
        productView.appendChild(crumbs);

        var layout = el('div', 'pd-layout');
        var selected = available(product)[0] || product.variants[0];
        var qtyValue = 1;
        var gallery = renderGallery(product, selected);
        layout.appendChild(gallery);

        var info = el('div', 'pd-info');
        var eyebrow = el('div', 'pd-eyebrow');
        if (product.badge) eyebrow.appendChild(el('span', 'shop-badge shop-badge-inline', product.badge));
        if (product.category) eyebrow.appendChild(el('span', 'shop-eyebrow', product.category));
        if (eyebrow.children.length) info.appendChild(eyebrow);
        info.appendChild(el('h1', 'pd-title', product.name));

        if (product.worksWith.length) {
            var works = el('ul', 'pd-works');
            works.setAttribute('aria-label', 'Works with');
            works.appendChild(el('li', 'pd-works-label', 'Works with'));
            product.worksWith.forEach(function (name) { works.appendChild(el('li', 'pd-work', name)); });
            info.appendChild(works);
        }

        var priceEl = el('p', 'pd-price');
        info.appendChild(priceEl);
        if (paragraphs.length) info.appendChild(el('p', 'pd-summary', paragraphs[0]));

        // Size picker
        var sizeLabel = null;
        var fitLine = null;
        var sizeButtons = [];
        function choose(variant) {
            selected = variant;
            qtyValue = 1;
            if (variant.image) gallery.show(variant.image);
            update();
        }
        if (multi) {
            var fieldset = el('fieldset', 'pd-sizes');
            var legend = el('legend');
            legend.appendChild(document.createTextNode('Size: '));
            sizeLabel = el('strong');
            legend.appendChild(sizeLabel);
            fieldset.appendChild(legend);
            var options = el('div', 'pd-size-options');
            product.variants.forEach(function (variant) {
                var button = el('button', 'pd-size', variant.label || formatMoney(variant.amount, variant.currency));
                button.type = 'button';
                if (variant.soldOut) {
                    button.classList.add('is-sold-out');
                    button.setAttribute('aria-label', (variant.label || '') + ', sold out');
                }
                button.addEventListener('click', function () { choose(variant); });
                sizeButtons.push({ button: button, variant: variant });
                options.appendChild(button);
            });
            fieldset.appendChild(options);
            if (hasFit) {
                fitLine = el('p', 'pd-fit');
                fieldset.appendChild(fitLine);
            }
            info.appendChild(fieldset);
        } else if (selected.fit) {
            fitLine = el('p', 'pd-fit');
            info.appendChild(fitLine);
        }

        // "Which size do I need?" helper, when sizes say which dew shields they fit.
        if (hasFit) {
            var finder = el('details', 'pd-finder');
            var summary = el('summary');
            summary.appendChild(icon('ruler'));
            summary.appendChild(document.createTextNode(multi ? 'Which size do I need?' : 'Will it fit my telescope?'));
            finder.appendChild(summary);
            var finderBody = el('div', 'pd-finder-body');
            finderBody.appendChild(el('p', null, 'Measure across the outside of your dew shield where the panel will sit, not the clear opening.'));
            var field = el('label', 'pd-finder-field');
            field.appendChild(el('span', null, 'Dew shield outside diameter'));
            var inputWrap = el('span', 'pd-finder-input');
            var input = el('input');
            input.type = 'number';
            input.inputMode = 'decimal';
            input.min = '1';
            input.max = '2000';
            input.step = '0.5';
            input.placeholder = 'e.g. 112';
            inputWrap.appendChild(input);
            inputWrap.appendChild(el('span', null, 'mm'));
            field.appendChild(inputWrap);
            finderBody.appendChild(field);
            var result = el('p', 'pd-finder-result');
            result.setAttribute('aria-live', 'polite');
            finderBody.appendChild(result);
            finder.appendChild(finderBody);
            input.addEventListener('input', function () {
                result.textContent = '';
                result.className = 'pd-finder-result';
                var mm = parseFloat(input.value);
                if (!(mm > 0)) return;
                var match = product.variants.filter(function (v) { return v.fit && mm >= v.fit.min && mm <= v.fit.max; });
                var pick = match.filter(function (v) { return !v.soldOut; })[0] || match[0];
                if (pick) {
                    result.classList.add('is-match');
                    result.textContent = (multi ? (pick.label || product.name) + ' fits a ' + mm + ' mm dew shield.' : 'This fits a ' + mm + ' mm dew shield.') +
                        (pick.soldOut ? ' It is sold out right now.' : '');
                    if (multi && pick !== selected) choose(pick);
                } else {
                    result.classList.add('is-miss');
                    result.appendChild(document.createTextNode('No size fits ' + mm + ' mm yet. '));
                    var tell = el('a', null, 'Tell me about your telescope');
                    tell.href = '/contact';
                    result.appendChild(tell);
                    result.appendChild(document.createTextNode(' and I\'ll let you know if a size is planned.'));
                }
            });
            info.appendChild(finder);
        }

        // Availability, quantity and add to cart
        var availability = el('div', 'pd-availability');
        var stockEl = el('span', 'pd-stock');
        availability.appendChild(stockEl);
        if (product.ships) {
            var ships = el('span', 'pd-ships');
            ships.appendChild(icon('truck'));
            ships.appendChild(document.createTextNode(product.ships));
            availability.appendChild(ships);
        }
        info.appendChild(availability);

        var buy = el('div', 'pd-buy');
        var room = function () { return Math.max(1, limitFor(catalog[selected.price]) - quantityOf(selected.price)); };
        var qty = stepper(qtyValue, room, function (value) { qtyValue = value; }, product.name);
        buy.appendChild(qty);
        var addButton = el('button', 'btn-link pd-add', 'Add to cart');
        addButton.type = 'button';
        buy.appendChild(addButton);
        info.appendChild(buy);
        var note = el('p', 'pd-cart-note');
        info.appendChild(note);

        // Store-wide promises from shop.html (warranty, returns), only if the owner listed any.
        var policies = document.querySelectorAll('#shop-policies > li');
        if (policies.length) {
            var policyList = el('ul', 'pd-policies');
            Array.prototype.forEach.call(policies, function (item) {
                var li = el('li');
                li.appendChild(icon('check'));
                li.appendChild(document.createTextNode(item.textContent.trim()));
                policyList.appendChild(li);
            });
            info.appendChild(policyList);
        }

        addButton.addEventListener('click', function () {
            showMessage('');
            setQuantity(selected.price, quantityOf(selected.price) + qtyValue);
            qtyValue = 1;
            update();
            openCart();
        });

        var help = el('div', 'pd-help');
        help.appendChild(icon('chat'));
        var helpText = el('p');
        helpText.appendChild(el('strong', null, 'Not sure it fits your rig? '));
        helpText.appendChild(document.createTextNode('Send me your telescope and imaging train and I\'ll check before you order. '));
        var contact = el('a', null, 'Ask a question');
        contact.href = '/contact';
        helpText.appendChild(contact);
        help.appendChild(helpText);
        info.appendChild(help);

        layout.appendChild(info);
        productView.appendChild(layout);

        // Sections below the buy box
        var sections = el('div', 'pd-sections');

        var aboutText = paragraphs.slice(1);
        if (aboutText.length || product.highlights.length || product.page || product.inBox.length) {
            var about = section('pd-about', 'About this product', 'pd-about-title');
            var aboutGrid = el('div', 'pd-about-grid');
            about.appendChild(aboutGrid);
            var text = el('div', 'pd-description');
            aboutText.forEach(function (paragraph) { text.appendChild(el('p', null, paragraph)); });
            if (product.highlights.length) {
                var list = el('ul', 'pd-highlights');
                product.highlights.forEach(function (item) {
                    var li = el('li');
                    li.appendChild(icon('check'));
                    li.appendChild(document.createTextNode(item));
                    list.appendChild(li);
                });
                text.appendChild(list);
            }
            if (product.page) {
                var more = el('a', 'pd-more');
                more.href = product.page;
                more.appendChild(el('span', null, 'Full details, guides and compatibility'));
                more.appendChild(icon('arrow'));
                text.appendChild(more);
            }
            aboutGrid.appendChild(text);
            if (product.inBox.length) {
                var box = el('div', 'pd-box');
                box.appendChild(el('h3', null, 'In the box'));
                var boxList = el('ul');
                product.inBox.forEach(function (item) { boxList.appendChild(el('li', null, item)); });
                box.appendChild(boxList);
                aboutGrid.appendChild(box);
            }
            sections.appendChild(about);
        }

        if (multi && hasFit) {
            var sizes = section('pd-size-table', 'Sizes', 'pd-sizes-title');
            var wrap = el('div', 'pd-table-wrap');
            var table = el('table', 'pd-table');
            var hasScopes = product.variants.some(function (v) { return v.scopes.length; });
            var head = el('tr');
            ['Size', 'Fits dew shields (outside)'].concat(hasScopes ? ['Known to fit'] : [], ['Price', '']).forEach(function (name) {
                head.appendChild(el('th', null, name));
            });
            var thead = el('thead');
            thead.appendChild(head);
            table.appendChild(thead);
            var tbody = el('tbody');
            product.variants.forEach(function (variant) {
                var row = el('tr');
                // data-label lets narrow screens show each size as a small labelled block.
                var cellWith = function (className, label, text) {
                    var td = el('td', className, text);
                    td.setAttribute('data-label', label);
                    return td;
                };
                row.appendChild(cellWith('pd-table-strong', 'Size', variant.label));
                row.appendChild(cellWith(null, 'Fits', variant.fit ? formatRange(variant.fit) : '—'));
                if (hasScopes) row.appendChild(cellWith('pd-table-scopes', 'Known to fit', variant.scopes.join(', ') || '—'));
                row.appendChild(cellWith(null, 'Price', formatMoney(variant.amount, variant.currency)));
                var cell = el('td', 'pd-table-action');
                if (variant.soldOut) {
                    cell.appendChild(el('span', 'shop-muted', 'Sold out'));
                } else {
                    var pick = el('button', 'pd-table-pick', 'Choose');
                    pick.type = 'button';
                    pick.setAttribute('aria-label', 'Choose ' + variant.label);
                    pick.addEventListener('click', function () {
                        choose(variant);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                    cell.appendChild(pick);
                }
                row.appendChild(cell);
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            wrap.appendChild(table);
            sizes.appendChild(wrap);
            sections.appendChild(sizes);
        }

        var specsSection = null;
        var specsBody = null;
        var specsTitle = null;
        if (product.variants.some(function (v) { return v.specs.length; })) {
            specsSection = section('pd-specs', 'Specifications', 'pd-specs-title');
            specsTitle = specsSection.firstChild;
            var specTable = el('table', 'pd-table pd-spec-table');
            specsBody = el('tbody');
            specTable.appendChild(specsBody);
            specsSection.appendChild(specTable);
            sections.appendChild(specsSection);
        }

        function renderSpecs() {
            if (!specsSection) return;
            specsTitle.textContent = 'Specifications' + (multi && selected.label ? ': ' + selected.label : '');
            specsBody.textContent = '';
            selected.specs.forEach(function (spec) {
                var row = el('tr');
                row.appendChild(el('th', null, spec.label));
                row.appendChild(el('td', null, spec.value));
                specsBody.appendChild(row);
            });
            if (!selected.specs.length) {
                var empty = el('tr');
                var cell = el('td', 'shop-muted', 'No specifications listed for this size yet.');
                cell.colSpan = 2;
                empty.appendChild(cell);
                specsBody.appendChild(empty);
            }
        }

        if (sections.children.length) productView.appendChild(sections);

        function update() {
            var entry = catalog[selected.price];
            var inCart = quantityOf(selected.price);
            var limit = limitFor(entry);
            var full = inCart >= limit;
            priceEl.textContent = formatMoney(selected.amount, selected.currency);
            var status = stockStatus([selected]);
            stockEl.className = 'pd-stock shop-status-' + status[0];
            stockEl.textContent = status[1];
            if (sizeLabel) sizeLabel.textContent = selected.label;
            if (fitLine) {
                fitLine.textContent = selected.fit
                    ? 'Fits dew shields ' + formatRange(selected.fit) + ' across the outside.'
                    : '';
                fitLine.hidden = !fitLine.textContent;
            }
            sizeButtons.forEach(function (item) {
                item.button.setAttribute('aria-pressed', String(item.variant === selected));
            });
            qtyValue = Math.min(qtyValue, room());
            qty.set(qtyValue);
            qty.hidden = selected.soldOut || full;
            addButton.disabled = selected.soldOut || full || !shopOpen;
            addButton.textContent = selected.soldOut ? 'Sold out' : (full ? 'Limit reached' : 'Add to cart');
            note.textContent = inCart
                ? inCart + ' in your cart' + (full ? ' (limit ' + limit + ' per order)' : '')
                : '';
            note.hidden = !note.textContent;
            renderSpecs();
        }
        refreshers.push(update);
        update();

        // More products
        var others = products.filter(function (p) { return p !== product && available(p).length; }).slice(0, 3);
        if (others.length) {
            var related = el('section', 'pd-related');
            related.appendChild(el('h2', null, 'More from the shop'));
            var grid = el('div', 'shop-grid');
            others.forEach(function (p) { grid.appendChild(renderCard(p, 'h3')); });
            related.appendChild(grid);
            productView.appendChild(related);
        }
    }

    function renderMissing() {
        refreshers = [];
        productView.textContent = '';
        document.title = 'Product not found | AstroTaca Shop';
        var box = el('div', 'shop-empty');
        box.appendChild(icon('box'));
        box.appendChild(el('h1', null, 'This product isn\'t available'));
        box.appendChild(el('p', null, 'It may have sold out or been removed from the shop.'));
        var back = el('a', 'btn-link', 'Back to the shop');
        back.href = '/shop';
        back.addEventListener('click', function (event) { event.preventDefault(); navigate('/shop'); });
        box.appendChild(back);
        productView.appendChild(box);
    }

    // ---------- routing ----------

    function render() {
        if (!loaded) return;
        var params = new URLSearchParams(window.location.search);
        var item = params.get('item');
        if (item) {
            var product = products.filter(function (p) { return p.id === item; })[0];
            listView.hidden = true;
            productView.hidden = false;
            if (product) renderProductPage(product);
            else renderMissing();
        } else {
            refreshers = [];
            document.title = BASE_TITLE;
            state.category = params.get('category') || '';
            productView.hidden = true;
            productView.textContent = '';
            listView.hidden = false;
            renderList();
        }
    }

    function navigate(url) {
        history.pushState(null, '', url);
        render();
        window.scrollTo(0, 0);
    }

    window.addEventListener('popstate', render);

    // ---------- data ----------

    function loadProducts() {
        return fetch('/api/products', { headers: { Accept: 'application/json' } })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                shopOpen = Boolean(data.open);
                products = (data.products || []).map(function (p) {
                    p.images = p.images || [];
                    p.highlights = p.highlights || [];
                    p.worksWith = p.worksWith || [];
                    p.ships = p.ships || '';
                    p.inBox = p.inBox || [];
                    p.variants.forEach(function (v) {
                        v.specs = v.specs || [];
                        v.scopes = v.scopes || [];
                        v.fit = v.fit || null;
                    });
                    p.description = p.description || '';
                    return p;
                });
                catalog = {};
                products.forEach(function (product) {
                    product.variants.forEach(function (variant) {
                        catalog[variant.price] = { product: product, variant: variant };
                    });
                });
                // Drop anything in a saved cart that is no longer for sale, and respect new limits.
                cart = cart.filter(function (item) { return catalog[item.price]; }).map(function (item) {
                    return { price: item.price, quantity: Math.min(item.quantity, limitFor(catalog[item.price])) };
                }).filter(function (item) { return item.quantity > 0; });
                saveCart();
                loaded = true;
                if (products.length || cart.length) addCartButton();
                render();
                renderCart();
            })
            .catch(function () {
                gridEl.textContent = '';
                gridEl.appendChild(el('p', 'shop-status', 'Products could not be loaded right now. Please try again in a moment.'));
            })
            .then(function () {
                gridEl.setAttribute('aria-busy', 'false');
            });
    }

    // ---------- checkout ----------

    checkoutButton.addEventListener('click', function () {
        if (!cart.length) return;
        checkoutButton.disabled = true;
        showMessage('Opening secure checkout…');
        fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ items: cart })
        }).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (data) {
                if (response.ok && typeof data.url === 'string' && data.url.indexOf('https://checkout.stripe.com/') === 0) {
                    window.location.assign(data.url);
                    return;
                }
                showMessage(data.error || 'Checkout could not be started. Please try again.');
                if (response.status === 409) loadProducts();
                checkoutButton.disabled = false;
            });
        }).catch(function () {
            showMessage('Checkout could not be started. Check your connection and try again.');
            checkoutButton.disabled = false;
        });
    });

    // Another tab changed the cart.
    window.addEventListener('storage', function (event) {
        if (event.key === CART_KEY) { cart = loadCart(); renderCart(); }
    });

    // Coming back with the browser's Back button from Stripe should not leave the button stuck.
    window.addEventListener('pageshow', function () { showMessage(''); renderCart(); });

    renderCart();
    loadProducts();
})();

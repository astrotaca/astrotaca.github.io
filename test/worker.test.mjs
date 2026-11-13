// Tests the shop Worker against an in-memory fake of the Stripe API. Run with: npm test
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import worker from '../worker/index.mjs';
import { encodeForm, verifyWebhook } from '../worker/stripe.mjs';

const SITE = 'https://astrotaca.com';
const WEBHOOK_SECRET = 'whsec_testsecret';
const env = {
  STRIPE_SECRET_KEY: 'rk_test_fake',
  STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
  ORDER_NOTIFY_WEBHOOK: 'https://discord.com/api/webhooks/1/fake',
  SITE_URL: SITE,
  SHOP_ENABLED: 'true',
  SHOP_SHIP_COUNTRIES: 'NO,SE,xx',
  SHOP_SHIPPING_RATES: 'shr_standard',
  SHOP_MAX_QUANTITY: '5',
  ASSETS: { fetch: () => new Response('static asset') },
};

let stripe;
let calls;
const realFetch = globalThis.fetch;

function product(id, overrides = {}) {
  return { id, object: 'product', active: true, name: id, description: '', images: [], metadata: { shop: 'true' }, ...overrides };
}

function price(id, productObj, overrides = {}) {
  return { id, object: 'price', active: true, type: 'one_time', currency: 'eur', unit_amount: 10000, nickname: null, metadata: {}, product: productObj, ...overrides };
}

beforeEach(() => {
  const panel = product('prod_panel', { name: 'Flat panel', images: ['https://files.stripe.com/a.jpg', 'javascript:alert(1)'], metadata: { shop: 'true', category: 'Flat panels', page: '/flatpanel', sort: '1', max_per_order: '3' } });
  const hidden = product('prod_hidden', { metadata: {} });
  const archived = product('prod_archived', { active: false });
  stripe = {
    prices: {
      price_small: price('price_small', panel, { nickname: '100 mm', unit_amount: 15000, metadata: { stock: '2' } }),
      price_large: price('price_large', panel, { nickname: '150 mm', unit_amount: 20000 }),
      price_soldout: price('price_soldout', panel, { nickname: '200 mm', unit_amount: 25000, metadata: { stock: '0' } }),
      price_hidden: price('price_hidden', hidden),
      price_archived: price('price_archived', archived),
      price_usd: price('price_usd', product('prod_usd', { metadata: {} }), { currency: 'usd' }),
    },
    sessions: [],
    intents: { pi_1: { id: 'pi_1', metadata: {} } },
    lineItems: [
      { quantity: 2, description: 'Flat panel', price: { id: 'price_small' } },
      { quantity: 1, description: 'Flat panel', price: { id: 'price_large' } },
    ],
    notifications: [],
  };
  calls = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = init.method || 'GET';
    calls.push(`${method} ${url.pathname}`);
    const reply = (body, status = 200) => new Response(JSON.stringify(body), { status });
    const form = new URLSearchParams(init.body || '');

    if (url.hostname === 'discord.com') { stripe.notifications.push(JSON.parse(init.body).content); return reply({}); }
    assert.equal(url.origin, 'https://api.stripe.com');
    assert.equal(init.headers.Authorization, 'Bearer rk_test_fake');

    let match;
    if (method === 'GET' && url.pathname === '/v1/prices') {
      return reply({ object: 'list', has_more: false, data: Object.values(stripe.prices).filter(p => p.active) });
    }
    if ((match = url.pathname.match(/^\/v1\/prices\/(\w+)$/))) {
      const found = stripe.prices[match[1]];
      if (!found) return reply({ error: { message: 'No such price' } }, 404);
      if (method === 'POST') found.metadata = { ...found.metadata, stock: form.get('metadata[stock]') };
      return reply(found);
    }
    if (method === 'POST' && url.pathname === '/v1/checkout/sessions') {
      stripe.sessions.push(form);
      return reply({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' });
    }
    if ((match = url.pathname.match(/^\/v1\/checkout\/sessions\/(\w+)\/line_items$/))) {
      return reply({ object: 'list', has_more: false, data: stripe.lineItems });
    }
    if ((match = url.pathname.match(/^\/v1\/payment_intents\/(\w+)$/))) {
      const intent = stripe.intents[match[1]];
      if (method === 'POST') {
        for (const [key, value] of form) {
          const name = key.match(/^metadata\[(\w+)\]$/)?.[1];
          if (name) intent.metadata[name] = value;
        }
      }
      return reply(intent);
    }
    throw new Error(`Unexpected Stripe call ${method} ${url.pathname}`);
  };
});

afterEach(() => { globalThis.fetch = realFetch; });

const call = (path, init) => worker.fetch(new Request(SITE + path, init), env, { waitUntil() {} });

function checkout(items, headers = {}) {
  return call('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: SITE, ...headers },
    body: JSON.stringify({ items }),
  });
}

function signedWebhook(event, { secret = WEBHOOK_SECRET, timestamp = Math.floor(Date.now() / 1000) } = {}) {
  const payload = JSON.stringify(event);
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return call('/api/webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${timestamp},v1=${signature}` }, body: payload });
}

function paidEvent(overrides = {}) {
  return {
    id: 'evt_1',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_1', payment_status: 'paid', payment_intent: 'pi_1', currency: 'eur', amount_total: 50000, livemode: false, metadata: { source: 'astrotaca-shop' }, shipping_details: { address: { country: 'NO', line1: 'secret street' } }, customer_details: { email: 'buyer@example.com', name: 'Buyer' }, ...overrides } },
  };
}

// ---------- routing ----------

test('non-API paths go to static assets', async () => {
  assert.equal(await (await call('/shop')).text(), 'static asset');
});

test('unknown API routes are JSON 404s', async () => {
  const response = await call('/api/nope');
  assert.equal(response.status, 404);
  assert.match(response.headers.get('Content-Type'), /application\/json/);
});

// ---------- products ----------

test('products lists only shop=true, active products, grouped by variant and sorted by price', async () => {
  const body = await (await call('/api/products')).json();
  assert.equal(body.open, true);
  assert.deepEqual(body.products.map(p => p.id), ['prod_panel']);
  const [panel] = body.products;
  assert.deepEqual(panel.variants.map(v => v.label), ['100 mm', '150 mm', '200 mm']);
  assert.deepEqual(panel.images, ['https://files.stripe.com/a.jpg'], 'non-https image URLs are dropped');
  assert.equal(panel.page, '/flatpanel');
  assert.equal(panel.variants[0].maxPerOrder, 3);
  assert.equal(panel.variants[0].left, 2);
  assert.equal(panel.variants[1].left, null, 'no stock metadata means made to order');
  assert.equal(panel.variants[1].stocked, false);
  assert.equal(panel.variants[0].stocked, true);
  assert.equal(panel.variants[2].soldOut, true);
});

test('SHOP_ENABLED=false closes products and checkout without calling Stripe, but still handles webhooks', async () => {
  const off = { ...env, SHOP_ENABLED: 'false' };
  const products = await worker.fetch(new Request(SITE + '/api/products'), off, {});
  assert.deepEqual(await products.json(), { open: false, products: [] });
  const checkout = await worker.fetch(new Request(SITE + '/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: SITE },
    body: JSON.stringify({ items: [{ price: 'price_large', quantity: 1 }] }),
  }), off, {});
  assert.equal(checkout.status, 503);
  assert.equal(calls.length, 0, 'no Stripe requests while the shop is switched off');

  const payload = JSON.stringify(paidEvent());
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(`${timestamp}.${payload}`).digest('hex');
  const webhook = await worker.fetch(new Request(SITE + '/api/webhook', {
    method: 'POST', headers: { 'Stripe-Signature': `t=${timestamp},v1=${signature}` }, body: payload,
  }), off, {});
  assert.equal(webhook.status, 200, 'orders paid before switching off are still fulfilled');
});

test('products is empty and closed when no Stripe key is configured', async () => {
  const response = await worker.fetch(new Request(SITE + '/api/products'), { ...env, STRIPE_SECRET_KEY: undefined }, {});
  assert.deepEqual(await response.json(), { open: false, products: [] });
  assert.equal(calls.length, 0);
});

test('separate size products that share a group become one card with a size picker', async () => {
  const size = (id, variant, sort, amount) => price(`price_${id}`, product(`prod_${id}`, {
    name: `Flat Panel – ${variant}`,
    images: sort === 2 ? ['https://files.stripe.com/m.jpg', 'https://files.stripe.com/shared.jpg'] : sort === 3 ? ['https://files.stripe.com/shared.jpg'] : [],
    marketing_features: sort === 1 ? [{ name: ' Motorized cover ' }, { name: '' }, {}] : [],
    metadata: { shop: 'true', group: 'flat-panel', group_name: 'Motorized Flat Panel', variant, sort: String(sort), max_per_order: String(sort), badge: sort === 3 ? 'New' : '', fit_min_mm: String(60 + sort * 20), fit_max_mm: String(80 + sort * 20), specs: sort === 1 ? 'Weight: 420 g; nonsense; Power: 12 V DC: or USB-C' : '', ships: sort === 1 ? 'Ships in 1–2 weeks' : '', works_with: sort === 1 ? 'NINA, ASCOM, ,Windows app' : '', in_box: sort === 1 ? 'Flat panel, USB-C cable' : '', scopes: sort === 2 ? 'RedCat 71, Askar FRA400' : '' },
  }), { unit_amount: amount });
  const cable = price('price_cable', product('prod_cable', { name: 'USB-C cable', metadata: { shop: 'true', sort: '9' } }), { unit_amount: 1500 });
  stripe.prices = Object.fromEntries([size('l', '130–160 mm', 3, 30000), size('s', '80–100 mm', 1, 20000), size('m', '100–130 mm', 2, 25000), cable].map(p => [p.id, p]));

  const { products } = await (await call('/api/products')).json();
  assert.deepEqual(products.map(p => p.name), ['Motorized Flat Panel', 'USB-C cable']);
  const [panel, single] = products;
  assert.equal(panel.id, 'flat-panel');
  assert.deepEqual(panel.variants.map(v => v.label), ['80–100 mm', '100–130 mm', '130–160 mm'], 'ordered by sort');
  assert.deepEqual(panel.variants.map(v => v.maxPerOrder), [1, 2, 3], 'limits are per size');
  assert.deepEqual(panel.images, ['https://files.stripe.com/m.jpg', 'https://files.stripe.com/shared.jpg'], 'images of all sizes, without duplicates');
  assert.deepEqual(panel.variants.map(v => v.image), [null, 'https://files.stripe.com/m.jpg', 'https://files.stripe.com/shared.jpg'], 'each size keeps its own first image');
  assert.deepEqual(panel.highlights, ['Motorized cover'], 'Stripe marketing features become highlights');
  assert.equal(panel.badge, 'New');
  assert.deepEqual(panel.variants.map(v => v.fit), [{ min: 80, max: 100 }, { min: 100, max: 120 }, { min: 120, max: 140 }], 'dew shield fit per size');
  assert.deepEqual(panel.variants[0].specs, [{ label: 'Weight', value: '420 g' }, { label: 'Power', value: '12 V DC: or USB-C' }], 'specs keep their order, bad pairs are skipped');
  assert.deepEqual(panel.variants[1].specs, []);
  assert.equal(panel.ships, 'Ships in 1–2 weeks');
  assert.deepEqual(panel.worksWith, ['NINA', 'ASCOM', 'Windows app']);
  assert.deepEqual(panel.inBox, ['Flat panel', 'USB-C cable']);
  assert.deepEqual(panel.variants.map(v => v.scopes), [[], ['RedCat 71', 'Askar FRA400'], []], 'known telescopes per size');
  assert.equal(single.variants[0].fit, null);
  assert.equal(single.badge, '');
  assert.deepEqual(single.highlights, []);
  assert.equal(single.variants[0].label, '', 'ungrouped products need no size label');
});

test('product page links must be local paths', async () => {
  stripe.prices.price_large.product.metadata.page = 'javascript:alert(1)';
  const body = await (await call('/api/products')).json();
  assert.equal(body.products[0].page, null);
});

// ---------- checkout ----------

test('checkout creates a Stripe session using Stripe prices and site settings', async () => {
  const response = await checkout([{ price: 'price_large', quantity: 1 }, { price: 'price_small', quantity: 1 }, { price: 'price_large', quantity: 1 }]);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).url, 'https://checkout.stripe.com/c/pay/cs_test_1');
  const form = stripe.sessions[0];
  assert.equal(form.get('mode'), 'payment');
  assert.equal(form.get('line_items[0][price]'), 'price_large');
  assert.equal(form.get('line_items[0][quantity]'), '2', 'duplicate lines are merged');
  assert.equal(form.get('line_items[1][price]'), 'price_small');
  assert.equal(form.get('success_url'), `${SITE}/order-complete`);
  assert.equal(form.get('cancel_url'), `${SITE}/shop`);
  assert.equal(form.get('shipping_address_collection[allowed_countries][0]'), 'NO');
  assert.equal(form.get('shipping_address_collection[allowed_countries][1]'), 'SE');
  assert.equal(form.get('shipping_address_collection[allowed_countries][2]'), null, 'invalid country codes are ignored');
  assert.equal(form.get('shipping_options[0][shipping_rate]'), 'shr_standard');
  assert.equal(form.get('metadata[source]'), 'astrotaca-shop');
  assert.equal(form.get('automatic_tax[enabled]'), null);
  assert.ok(![...form.keys()].some(key => /amount/.test(key)), 'the browser can never set an amount');
});

test('checkout refuses other origins and non-JSON requests', async () => {
  assert.equal((await checkout([{ price: 'price_large', quantity: 1 }], { Origin: 'https://evil.example' })).status, 403);
  const noOrigin = await call('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(noOrigin.status, 403);
  const form = await call('/api/checkout', { method: 'POST', headers: { Origin: SITE, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'items=1' });
  assert.equal(form.status, 415);
  assert.equal(stripe.sessions.length, 0);
});

test('checkout rejects malformed carts', async () => {
  for (const items of [[], [{ price: 'prod_x', quantity: 1 }], [{ price: 'price_large', quantity: 0 }], [{ price: 'price_large', quantity: 1.5 }], [{ price: 'price_large', quantity: '1' }], Array(21).fill({ price: 'price_large', quantity: 1 })]) {
    assert.equal((await checkout(items)).status, 400, JSON.stringify(items).slice(0, 60));
  }
  const huge = await call('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: 'x'.repeat(9000) });
  assert.equal(huge.status, 400);
  assert.equal(stripe.sessions.length, 0);
});

test('checkout refuses items that are not for sale', async () => {
  for (const id of ['price_hidden', 'price_archived', 'price_doesnotexist']) {
    assert.equal((await checkout([{ price: id, quantity: 1 }])).status, 409, id);
  }
  assert.equal(stripe.sessions.length, 0);
});

test('checkout enforces stock, per-order limits and a single currency', async () => {
  const over = await checkout([{ price: 'price_small', quantity: 3 }]);
  assert.equal(over.status, 409, 'within max_per_order (3) but more than the 2 in stock');
  assert.match((await over.json()).error, /Only 2 of Flat panel \(100 mm\) left/);
  const tooMany = await checkout([{ price: 'price_large', quantity: 4 }]);
  assert.equal(tooMany.status, 400);
  assert.match((await tooMany.json()).error, /at most 3/);
  const soldOut = await checkout([{ price: 'price_soldout', quantity: 1 }]);
  assert.equal(soldOut.status, 409);
  assert.match((await soldOut.json()).error, /sold out/);
  const mixed = await checkout([{ price: 'price_large', quantity: 1 }, { price: 'price_usd', quantity: 1 }]);
  assert.equal(mixed.status, 409, 'price_usd is not marked shop=true');
  stripe.prices.price_usd.product.metadata.shop = 'true';
  assert.equal((await checkout([{ price: 'price_large', quantity: 1 }, { price: 'price_usd', quantity: 1 }])).status, 400);
  assert.equal(stripe.sessions.length, 0);
});

test('checkout stays closed until shipping countries are configured', async () => {
  const response = await worker.fetch(new Request(SITE + '/api/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE }, body: JSON.stringify({ items: [{ price: 'price_large', quantity: 1 }] }),
  }), { ...env, SHOP_SHIP_COUNTRIES: '' }, {});
  assert.equal(response.status, 503);
});

// ---------- webhook ----------

test('webhook rejects missing, wrong, tampered and stale signatures', async () => {
  const unsigned = await call('/api/webhook', { method: 'POST', body: JSON.stringify(paidEvent()) });
  assert.equal(unsigned.status, 400);
  assert.equal((await signedWebhook(paidEvent(), { secret: 'whsec_wrong' })).status, 400);
  assert.equal((await signedWebhook(paidEvent(), { timestamp: Math.floor(Date.now() / 1000) - 600 })).status, 400);

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(`${timestamp}.${JSON.stringify(paidEvent())}`).digest('hex');
  const tampered = JSON.stringify(paidEvent({ amount_total: 1 }));
  const response = await call('/api/webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${timestamp},v1=${signature}` }, body: tampered });
  assert.equal(response.status, 400);
  assert.equal(stripe.prices.price_small.metadata.stock, '2', 'nothing changed');
});

test('paid order counts stock down once and notifies once, even when Stripe retries', async () => {
  assert.equal((await signedWebhook(paidEvent())).status, 200);
  assert.equal(stripe.prices.price_small.metadata.stock, '0');
  assert.equal(stripe.prices.price_large.metadata.stock, undefined, 'made-to-order prices are left alone');
  assert.equal(stripe.notifications.length, 1);
  assert.match(stripe.notifications[0], /2× Flat panel, 1× Flat panel\. Total €500\.00, shipping to NO/);
  assert.match(stripe.notifications[0], /\[TEST\]/);
  assert.doesNotMatch(stripe.notifications[0], /secret street|buyer@example\.com|Buyer/, 'no personal data in notifications');

  stripe.prices.price_small.metadata.stock = '5';
  assert.equal((await signedWebhook(paidEvent())).status, 200);
  assert.equal(stripe.prices.price_small.metadata.stock, '5', 'retry does not count down again');
  assert.equal(stripe.notifications.length, 1, 'retry does not notify again');
});

test('webhook ignores unpaid sessions and sessions from other tools', async () => {
  await signedWebhook(paidEvent({ payment_status: 'unpaid' }));
  await signedWebhook(paidEvent({ metadata: {} }));
  await signedWebhook({ ...paidEvent(), type: 'payment_intent.created' });
  assert.equal(stripe.prices.price_small.metadata.stock, '2');
  assert.equal(stripe.notifications.length, 0);
});

test('a delayed bank payment is fulfilled when it succeeds', async () => {
  await signedWebhook({ ...paidEvent({ payment_status: 'unpaid' }), type: 'checkout.session.async_payment_succeeded' });
  assert.equal(stripe.prices.price_small.metadata.stock, '0');
});

test('a Stripe outage during fulfilment returns 500 so Stripe retries', async () => {
  const working = globalThis.fetch;
  globalThis.fetch = async (input, init) => (String(input).includes('/line_items') ? new Response('{}', { status: 500 }) : working(input, init));
  assert.equal((await signedWebhook(paidEvent())).status, 500);
  globalThis.fetch = working;
  assert.equal((await signedWebhook(paidEvent())).status, 200);
  assert.equal(stripe.prices.price_small.metadata.stock, '0');
});

// ---------- stripe helpers ----------

test('form encoding matches Stripe bracket syntax', () => {
  const form = encodeForm({ a: 1, list: ['x', 'y'], nested: { deep: { v: true } }, skip: undefined });
  assert.equal(decodeURIComponent(form.toString()), 'a=1&list[0]=x&list[1]=y&nested[deep][v]=true');
});

test('signature check accepts any of several v1 signatures (secret rotation)', async () => {
  const now = Date.now();
  const t = Math.floor(now / 1000);
  const good = createHmac('sha256', WEBHOOK_SECRET).update(`${t}.body`).digest('hex');
  assert.equal(await verifyWebhook('body', `t=${t},v1=${'0'.repeat(64)},v1=${good}`, WEBHOOK_SECRET, { now }), true);
  assert.equal(await verifyWebhook('body', `t=${t}`, WEBHOOK_SECRET, { now }), false);
  assert.equal(await verifyWebhook('body', 'garbage', WEBHOOK_SECRET, { now }), false);
});

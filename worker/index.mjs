// AstroTaca shop backend. Static pages are served straight from dist/; only /api/* reaches this code.
//
//   GET  /api/products   products marked shop=true in Stripe, grouped with their size/variant prices
//   POST /api/checkout   validates a cart against Stripe and returns a Stripe Checkout URL
//   POST /api/webhook    Stripe tells us an order was paid: count stock down and send a notification
//
// Secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ORDER_NOTIFY_WEBHOOK) come from Cloudflare
// secrets in production and .dev.vars locally. They are never in this repository.
import { createStripe, verifyWebhook, StripeError } from './stripe.mjs';

const SESSION_SOURCE = 'astrotaca-shop';
const MAX_CART_LINES = 20;
const LOW_STOCK = 3;
const PRODUCTS_CACHE_SECONDS = 60;
const MAX_IMAGES = 8;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      switch (url.pathname) {
        case '/api/products': return await handleProducts(request, env, ctx);
        case '/api/checkout': return await handleCheckout(request, env);
        case '/api/webhook': return await handleWebhook(request, env);
        default: return json({ error: 'Not found.' }, 404);
      }
    } catch (error) {
      console.error('Unhandled API error', url.pathname, error?.message);
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
  },
};

// ---------- helpers ----------

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

function methodNotAllowed(allowed) {
  return json({ error: 'Method not allowed.' }, 405, { Allow: allowed });
}

function shopConfigured(env) {
  return typeof env.STRIPE_SECRET_KEY === 'string' && /^(sk|rk)_(live|test)_/.test(env.STRIPE_SECRET_KEY);
}

// The public on/off switch (SHOP_ENABLED in wrangler.jsonc). While it is off the shop pages are not
// deployed and the API sells nothing, even if Stripe keys are already set.
function shopEnabled(env) {
  return env.SHOP_ENABLED === 'true';
}

function stripeFor(env) {
  return createStripe(env.STRIPE_SECRET_KEY);
}

function siteOrigin(env) {
  return new URL(env.SITE_URL || 'https://astrotaca.com').origin;
}

function listFromEnv(value, pattern) {
  return String(value || '').split(',').map(item => item.trim()).filter(item => pattern.test(item));
}

function isListed(product) {
  return Boolean(product && typeof product === 'object' && product.active && /^(true|yes|1)$/i.test(product.metadata?.shop || ''));
}

function isSellablePrice(price) {
  return Boolean(price && price.active && price.type === 'one_time' && Number.isInteger(price.unit_amount) && isListed(price.product));
}

// Stock is optional. No "stock" metadata on the price means it is made to order (unlimited).
function stockOf(price) {
  const raw = price?.metadata?.stock;
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? Math.max(0, value) : null;
}

function maxPerOrder(product, env) {
  const fallback = Number.parseInt(env.SHOP_MAX_QUANTITY, 10) || 5;
  const own = Number.parseInt(product?.metadata?.max_per_order, 10);
  return Math.min(Number.isFinite(own) && own > 0 ? own : fallback, 99);
}

// Short display-only text such as "New" or "Bestseller".
function shortLabel(value, max = 24) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// "NINA, ASCOM, Windows app" -> ['NINA', 'ASCOM', 'Windows app']
function shortList(value, maxItems = 8, maxLength = 32) {
  return typeof value === 'string'
    ? value.split(',').map(item => item.trim().slice(0, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

// "Weight: 420 g; Power: 12 V DC or USB-C" -> [{ label: 'Weight', value: '420 g' }, ...]
function specList(value) {
  if (typeof value !== 'string') return [];
  return value.split(';').map(pair => {
    const at = pair.indexOf(':');
    if (at < 1) return null;
    const label = pair.slice(0, at).trim().slice(0, 40);
    const text = pair.slice(at + 1).trim().slice(0, 120);
    return label && text ? { label, value: text } : null;
  }).filter(Boolean).slice(0, 20);
}

// Which dew shield outside diameters (in mm) a size fits, from fit_min_mm / fit_max_mm.
function fitRange(meta) {
  const min = Number.parseFloat(meta.fit_min_mm);
  const max = Number.parseFloat(meta.fit_max_mm);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min || max > 2000) return null;
  return { min, max };
}

// Only allow links to our own pages, so product data can never inject javascript: or off-site URLs.
function safePagePath(value) {
  return typeof value === 'string' && /^\/[A-Za-z0-9/_-]*$/.test(value) && !value.startsWith('//') ? value : null;
}

// ---------- GET /api/products ----------

async function handleProducts(request, env, ctx) {
  if (request.method !== 'GET') return methodNotAllowed('GET');
  if (!shopEnabled(env) || !shopConfigured(env)) return json({ open: false, products: [] });

  const cache = globalThis.caches?.default;
  const cacheKey = new Request(new URL('/api/products', request.url).href);
  const cached = cache && await cache.match(cacheKey);
  if (cached) return cached;

  const products = await loadCatalog(stripeFor(env), env);
  const response = json({ open: true, products }, 200, {
    'Cache-Control': `public, max-age=${PRODUCTS_CACHE_SECONDS}`,
  });
  if (cache) ctx?.waitUntil?.(cache.put(cacheKey, response.clone()));
  return response;
}

// Each size is its own Stripe product (so checkout and receipts show the size). Products that share
// a "group" metadata value are shown as one card with a size picker.
export async function loadCatalog(stripe, env) {
  const prices = await stripe.list('prices', { active: true, type: 'one_time', expand: ['data.product'] });
  const groups = new Map();

  for (const price of prices) {
    if (!isSellablePrice(price)) continue;
    const product = price.product;
    const meta = product.metadata || {};
    const key = meta.group || product.id;
    const sort = Number(meta.sort) || 0;
    const images = (product.images || []).filter(src => /^https:\/\//.test(src)).slice(0, MAX_IMAGES);
    const highlights = (product.marketing_features || [])
      .map(feature => (typeof feature?.name === 'string' ? feature.name.trim() : ''))
      .filter(Boolean)
      .slice(0, 12);

    let entry = groups.get(key);
    if (!entry) {
      entry = {
        id: key,
        name: meta.group_name || product.name,
        description: product.description || '',
        images: [],
        highlights,
        category: meta.category || '',
        badge: shortLabel(meta.badge),
        ships: shortLabel(meta.ships, 80),
        worksWith: shortList(meta.works_with),
        inBox: shortList(meta.in_box, 15, 80),
        page: safePagePath(meta.page),
        sort,
        variants: [],
      };
      groups.set(key, entry);
    }
    entry.sort = Math.min(entry.sort, sort);
    if (!entry.highlights.length) entry.highlights = highlights;
    if (!entry.description) entry.description = product.description || '';
    if (!entry.page) entry.page = safePagePath(meta.page);
    if (!entry.badge) entry.badge = shortLabel(meta.badge);
    if (!entry.ships) entry.ships = shortLabel(meta.ships, 80);
    if (!entry.worksWith.length) entry.worksWith = shortList(meta.works_with);
    if (!entry.inBox.length) entry.inBox = shortList(meta.in_box, 15, 80);

    const stock = stockOf(price);
    entry.variants.push({
      price: price.id,
      label: meta.variant || price.nickname || (meta.group ? product.name : ''),
      amount: price.unit_amount,
      currency: price.currency,
      image: images[0] || null,
      images,
      sort,
      maxPerOrder: maxPerOrder(product, env),
      fit: fitRange(meta),
      scopes: shortList(meta.scopes, 20, 60),
      specs: specList(meta.specs),
      stocked: stock !== null,
      soldOut: stock === 0,
      left: stock !== null && stock > 0 && stock <= LOW_STOCK ? stock : null,
    });
  }

  return [...groups.values()]
    .map(group => {
      const variants = group.variants.sort((a, b) => a.sort - b.sort || a.amount - b.amount);
      // The gallery shows every size's images in size order, without repeats.
      const images = [...new Set(variants.flatMap(variant => variant.images))].slice(0, MAX_IMAGES);
      return { ...group, images, variants: variants.map(({ images: _, ...variant }) => variant) };
    })
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}

// ---------- POST /api/checkout ----------

async function readJson(request, limitBytes) {
  const text = await request.text();
  if (text.length > limitBytes) return undefined;
  try { return JSON.parse(text); } catch { return undefined; }
}

function normalizeCart(body) {
  if (!body || !Array.isArray(body.items) || !body.items.length || body.items.length > MAX_CART_LINES) return null;
  const quantities = new Map();
  for (const item of body.items) {
    if (!item || typeof item.price !== 'string' || !/^price_[A-Za-z0-9]{1,64}$/.test(item.price)) return null;
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return null;
    quantities.set(item.price, (quantities.get(item.price) || 0) + item.quantity);
  }
  return [...quantities].map(([price, quantity]) => ({ price, quantity }));
}

async function handleCheckout(request, env) {
  if (request.method !== 'POST') return methodNotAllowed('POST');

  // Only our own pages may start a checkout. A JSON content type also forces a CORS preflight,
  // which this API never approves, so other sites cannot post here from a visitor's browser.
  if (request.headers.get('Origin') !== siteOrigin(env)) return json({ error: 'Forbidden.' }, 403);
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) {
    return json({ error: 'Expected JSON.' }, 415);
  }

  const countries = listFromEnv(env.SHOP_SHIP_COUNTRIES, /^[A-Z]{2}$/);
  if (!shopEnabled(env) || !shopConfigured(env) || !countries.length) {
    return json({ error: 'The shop is not open yet.' }, 503);
  }

  const cart = normalizeCart(await readJson(request, 8 * 1024));
  if (!cart) return json({ error: 'Your cart could not be read. Please refresh the page and try again.' }, 400);

  const stripe = stripeFor(env);
  // Prices always come from Stripe, never from the browser.
  const prices = await Promise.all(cart.map(item =>
    stripe.get(`prices/${item.price}`, { expand: ['product'] }).catch(error => {
      if (error instanceof StripeError && error.status === 404) return null;
      throw error;
    })));

  let currency;
  for (const [index, price] of prices.entries()) {
    const { quantity } = cart[index];
    if (!isSellablePrice(price)) {
      return json({ error: 'One of the items in your cart is no longer available. Please refresh the page.' }, 409);
    }
    currency ??= price.currency;
    if (price.currency !== currency) {
      return json({ error: 'Items with different currencies cannot be bought together.' }, 400);
    }
    const name = price.product.name + (price.nickname ? ` (${price.nickname})` : '');
    if (quantity > maxPerOrder(price.product, env)) {
      return json({ error: `You can order at most ${maxPerOrder(price.product, env)} of ${name}.` }, 400);
    }
    const stock = stockOf(price);
    if (stock !== null && quantity > stock) {
      return json({ error: stock === 0 ? `${name} is sold out.` : `Only ${stock} of ${name} left.` }, 409);
    }
  }

  const site = siteOrigin(env);
  const shippingRates = listFromEnv(env.SHOP_SHIPPING_RATES, /^shr_[A-Za-z0-9]+$/);
  const session = await stripe.post('checkout/sessions', {
    mode: 'payment',
    line_items: cart.map(item => ({ price: item.price, quantity: item.quantity })),
    success_url: `${site}/order-complete`,
    cancel_url: `${site}/shop`,
    shipping_address_collection: { allowed_countries: countries },
    shipping_options: shippingRates.length ? shippingRates.map(rate => ({ shipping_rate: rate })) : undefined,
    phone_number_collection: { enabled: true },
    automatic_tax: env.SHOP_AUTOMATIC_TAX === 'true' ? { enabled: true } : undefined,
    allow_promotion_codes: env.SHOP_ALLOW_PROMOTION_CODES === 'true' ? true : undefined,
    metadata: { source: SESSION_SOURCE },
    payment_intent_data: { metadata: { source: SESSION_SOURCE } },
  });

  return json({ url: session.url });
}

// ---------- POST /api/webhook ----------

async function handleWebhook(request, env) {
  if (request.method !== 'POST') return methodNotAllowed('POST');
  // Deliberately ignores SHOP_ENABLED: orders paid just before the shop was switched off must still be handled.
  if (!shopConfigured(env) || !env.STRIPE_WEBHOOK_SECRET) return json({ error: 'Not configured.' }, 503);

  const payload = await request.text();
  const valid = await verifyWebhook(payload, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET);
  if (!valid) return json({ error: 'Invalid signature.' }, 400);

  const event = JSON.parse(payload);
  const session = event.data?.object;
  const paid =
    (event.type === 'checkout.session.completed' && ['paid', 'no_payment_required'].includes(session?.payment_status)) ||
    event.type === 'checkout.session.async_payment_succeeded';

  // Ignore anything not created by this shop (payment links, invoices, other tools on the account).
  if (paid && session?.metadata?.source === SESSION_SOURCE) {
    await fulfilOrder(stripeFor(env), session, env);
  }
  // Any error above becomes a 500, so Stripe retries the event later.
  return json({ received: true });
}

// Stripe can deliver the same event more than once. Progress is recorded on the PaymentIntent's
// metadata, so a retry never counts stock down twice or sends a second notification.
export async function fulfilOrder(stripe, session, env) {
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  const intent = paymentIntentId ? await stripe.get(`payment_intents/${paymentIntentId}`) : null;
  const done = new Set(String(intent?.metadata?.shop_stock_done || '').split(',').filter(Boolean));

  const lines = await stripe.list(`checkout/sessions/${session.id}/line_items`);
  for (const [index, line] of lines.entries()) {
    if (done.has(String(index)) || !line.price?.id) continue;
    const price = await stripe.get(`prices/${line.price.id}`);
    const stock = stockOf(price);
    if (stock !== null) {
      await stripe.post(`prices/${price.id}`, { metadata: { stock: String(Math.max(0, stock - (line.quantity || 0))) } });
    }
    done.add(String(index));
    if (intent) await stripe.post(`payment_intents/${intent.id}`, { metadata: { shop_stock_done: [...done].join(',') } });
  }

  if (intent?.metadata?.shop_notified !== 'true') {
    await notifyOrder(env, session, lines);
    if (intent) await stripe.post(`payment_intents/${intent.id}`, { metadata: { shop_notified: 'true' } });
  }
}

// Optional Discord ping. It deliberately leaves out the customer's name, email and address.
async function notifyOrder(env, session, lines) {
  const hook = env.ORDER_NOTIFY_WEBHOOK;
  if (!hook || !/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(hook)) return;
  const money = new Intl.NumberFormat('en', { style: 'currency', currency: (session.currency || 'eur').toUpperCase() });
  const fraction = money.resolvedOptions().maximumFractionDigits;
  const items = lines.map(line => `${line.quantity}× ${line.description}`).join(', ');
  const total = money.format((session.amount_total || 0) / 10 ** fraction);
  const country = session.shipping_details?.address?.country || session.collected_information?.shipping_details?.address?.country || '?';
  const mode = session.livemode ? '' : ' [TEST]';
  try {
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `New order${mode}: ${items}. Total ${total}, shipping to ${country}. Details in the Stripe dashboard.` }),
    });
  } catch (error) {
    console.error('Order notification failed', error?.message);
  }
}

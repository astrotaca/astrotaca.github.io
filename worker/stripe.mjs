// Minimal Stripe REST client and webhook signature check for Workers (no SDK needed).

export class StripeError extends Error {
  constructor(status, body) {
    super(body?.error?.message || `Stripe request failed with ${status}`);
    this.status = status;
    this.code = body?.error?.code;
  }
}

// Stripe expects form encoding with bracketed keys: line_items[0][price]=price_123
export function encodeForm(value, prefix = '', params = new URLSearchParams()) {
  if (value === undefined || value === null) return params;
  if (Array.isArray(value)) {
    value.forEach((item, index) => encodeForm(item, `${prefix}[${index}]`, params));
  } else if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      encodeForm(item, prefix ? `${prefix}[${key}]` : key, params);
    }
  } else {
    params.append(prefix, String(value));
  }
  return params;
}

export function createStripe(secretKey, { apiBase = 'https://api.stripe.com' } = {}) {
  async function request(method, path, params) {
    const encoded = params ? encodeForm(params).toString() : '';
    const url = `${apiBase}/v1/${path}${method === 'GET' && encoded ? `?${encoded}` : ''}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      body: method === 'POST' ? encoded : undefined,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new StripeError(response.status, body);
    return body;
  }

  return {
    get: (path, params) => request('GET', path, params),
    post: (path, params) => request('POST', path, params),
    // Follows Stripe's cursor pagination for list endpoints.
    async list(path, params = {}, maxPages = 10) {
      const items = [];
      let startingAfter;
      for (let page = 0; page < maxPages; page++) {
        const result = await request('GET', path, { ...params, limit: 100, starting_after: startingAfter });
        items.push(...result.data);
        if (!result.has_more || !result.data.length) break;
        startingAfter = result.data[result.data.length - 1].id;
      }
      return items;
    },
  };
}

const encoder = new TextEncoder();

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Verifies the Stripe-Signature header the same way Stripe's official libraries do.
export async function verifyWebhook(payload, header, secret, { toleranceSeconds = 300, now = Date.now() } = {}) {
  if (!header || !secret) return false;
  const parts = header.split(',').map(part => part.split('='));
  const timestamp = Number(parts.find(([key]) => key === 't')?.[1]);
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!Number.isFinite(timestamp) || !signatures.length) return false;
  if (Math.abs(now / 1000 - timestamp) > toleranceSeconds) return false;

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(mac)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return signatures.some(signature => timingSafeEqual(signature, expected));
}

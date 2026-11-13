// Verify the deployed static routes and every local HTML asset/link.
// Usage: node check-deployment.js https://example.workers.dev
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const base = new URL(process.argv[2] || 'http://127.0.0.1:8787');
const root = path.join(__dirname, 'dist');

async function main() {
  const pages = fs.readdirSync(root, { recursive: true })
    .filter(file => file.endsWith('.html'));
  const links = new Set();
  for (const file of pages) {
    const route = file.replaceAll(path.sep, '/').replace(/index\.html$/, '').replace(/\.html$/, '');
    const url = new URL('/' + route, base);
    const response = await fetch(url);
    assert.equal(response.status, 200, `${url}: page status`);
    const html = await response.text();
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal(html.match(/<title>(.*?)<\/title>/)?.[1], source.match(/<title>(.*?)<\/title>/)?.[1], `${url}: title`);
    for (const match of source.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const target = new URL(match[1].replaceAll('&amp;', '&'), url);
      if (target.origin === base.origin) {
        target.hash = '';
        links.add(target.href);
      }
    }
  }
  const pending = [...links];
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (pending.length) {
      const url = pending.pop();
      const response = await fetch(url, { method: 'HEAD' });
      assert.equal(response.status, 200, `${url}: linked resource`);
    }
  }));
  const sourceRoutes = [
    '/missing-migration-check', '/guides/missing-migration-check', '/build.js', '/package.json', '/wrangler.jsonc',
    '/worker/index.mjs', '/worker/stripe.mjs', '/scripts/check-secrets.js', '/.dev.vars', '/.dev.vars.example', '/SHOP.md',
  ];
  for (const route of sourceRoutes) {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 404, `${route}: must not serve content with a success status`);
    assert.match(await response.text(), /Back to home/, `${route}: custom 404`);
  }
  for (const route of ['/guides.html', '/guides/', '/gallery/m31.html']) {
    const response = await fetch(new URL(route + '?check=1', base), { redirect: 'manual' });
    assert.ok([301, 302, 307, 308].includes(response.status), `${route}: canonical redirect`);
    const target = new URL(response.headers.get('location'), base);
    assert.equal(target.pathname, route.replace(/\.html$/, '').replace(/\/$/, ''));
    assert.equal(target.search, '?check=1');
  }
  // Shop API: products always answers (empty until the shop is configured); unknown routes are JSON 404s.
  const products = await fetch(new URL('/api/products', base));
  assert.equal(products.status, 200, '/api/products: status');
  const catalog = await products.json();
  assert.ok(Array.isArray(catalog.products), '/api/products: product list');
  // While SHOP_ENABLED is off the build leaves the shop pages out; make sure the site agrees.
  const shopBuilt = fs.existsSync(path.join(root, 'shop.html'));
  if (!shopBuilt) {
    for (const route of ['/shop', '/order-complete', '/terms']) {
      const response = await fetch(new URL(route, base));
      assert.equal(response.status, 404, `${route}: shop is switched off, so this page must not be served`);
    }
    assert.equal(catalog.open, false, '/api/products: shop is switched off, so it must report closed');
  }
  const unknownApi = await fetch(new URL('/api/missing-check', base));
  assert.equal(unknownApi.status, 404, '/api/missing-check: status');
  const foreignCheckout = await fetch(new URL('/api/checkout', base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
    body: '{"items":[]}',
  });
  assert.equal(foreignCheckout.status, 403, '/api/checkout: other sites are refused');
  const unsignedWebhook = await fetch(new URL('/api/webhook', base), { method: 'POST', body: '{}' });
  assert.ok([400, 503].includes(unsignedWebhook.status), '/api/webhook: unsigned events are refused');

  const robots = await (await fetch(new URL('/robots.txt', base))).text();
  assert.match(robots, /User-agent: \*\s+Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/astrotaca.com\/sitemap.xml/);
  console.log(`PASS: ${pages.length} pages, ${links.size} linked resources, clean URLs, custom 404s, source exclusion, shop API (${shopBuilt ? 'shop on' : 'shop switched off'}) and robots.txt at ${base.origin}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });

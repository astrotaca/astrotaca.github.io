// Package only public website files; never deploy the repository root.
const fs = require('fs');
const path = require('path');

require('./build.js');

const root = __dirname;
const output = path.join(root, 'dist');
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) {
  throw new Error('Refusing to replace a linked dist directory.');
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);

const publicFiles = [
  'index.html', 'gallery.html', 'guides.html', 'flatpanel.html',
  'software.html', 'about.html', 'contact.html', '404.html',
  'styles.css', 'home.css', 'flatpanel.css',
  'sidebar.js', 'gallery-filter.js', 'guide-toc.js',
  'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png',
  'apple-touch-icon.png', 'robots.txt', 'sitemap.xml'
];
const assetExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg', '.ico', '.webmanifest']);

function collect(directory, extensions) {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) collect(relative, extensions);
    else if (extensions.has(path.extname(entry.name).toLowerCase())) publicFiles.push(relative);
  }
}
for (const directory of ['images', 'avatar', 'brand']) collect(directory, assetExtensions);
for (const directory of ['gallery', 'guides']) collect(directory, new Set(['.html', ...assetExtensions]));

for (const file of publicFiles) {
  const source = path.join(root, file);
  if (fs.statSync(source).size > 25 * 1024 * 1024) {
    throw new Error(`${file} exceeds Cloudflare's 25 MiB asset limit.`);
  }
  const target = path.join(output, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
console.log(`Packaged ${publicFiles.length} public files into dist/ for Cloudflare.`);

// Fails if anything that looks like a live credential is about to be committed or deployed.
// Usage:
//   node scripts/check-secrets.js            scan every file git would track (used by the build)
//   node scripts/check-secrets.js --staged   scan only staged changes (used by the pre-commit hook)
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const patterns = [
  ['Stripe secret key', /\bsk_(?:live|test)_[A-Za-z0-9]{16,}/],
  ['Stripe restricted key', /\brk_(?:live|test)_[A-Za-z0-9]{16,}/],
  ['Stripe webhook secret', /\bwhsec_[A-Za-z0-9+/=]{16,}/],
  ['Discord webhook URL', /discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]{20,}/],
  ['Cloudflare API token', /\bCLOUDFLARE_API_TOKEN\s*=\s*\S{20,}/],
  ['Private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

// Files that must never be tracked, whatever they contain.
const forbiddenNames = [/^\.dev\.vars$/, /^\.dev\.vars\.(?!example$)/, /^\.env(\..*)?$/, /\.pem$/, /\.key$/];

const binary = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.ico', '.pdf', '.zip', '.woff', '.woff2']);

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function listFiles(staged) {
  try {
    const args = staged
      ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']
      : ['ls-files', '--cached', '--others', '--exclude-standard', '-z'];
    return git(args).split('\0').filter(Boolean);
  } catch {
    if (staged) throw new Error('git is required for --staged');
    // No git available (unusual build environment): walk the tree, skipping ignored folders.
    const skip = new Set(['.git', 'node_modules', 'dist', '.wrangler']);
    const out = [];
    (function walk(dir) {
      for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        const rel = path.posix.join(dir, entry.name);
        if (entry.isDirectory()) { if (!skip.has(entry.name)) walk(rel); }
        else if (!forbiddenNames.some(re => re.test(entry.name))) out.push(rel);
      }
    })('');
    return out;
  }
}

function readContent(file, staged) {
  if (staged) return git(['show', `:${file}`]);
  const full = path.join(root, file);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
}

const staged = process.argv.includes('--staged');
const problems = [];

for (const file of listFiles(staged)) {
  const name = path.posix.basename(file);
  if (forbiddenNames.some(re => re.test(name))) {
    problems.push(`${file}: this file holds secrets and must stay untracked`);
    continue;
  }
  if (binary.has(path.extname(file).toLowerCase())) continue;
  const lines = readContent(file, staged).split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const [label, pattern] of patterns) {
      if (pattern.test(line)) problems.push(`${file}:${index + 1}: looks like a ${label}`);
    }
  });
}

if (problems.length) {
  console.error('Secret check FAILED. Nothing was committed or built.\n');
  for (const problem of problems) console.error('  ' + problem);
  console.error('\nMove the value into .dev.vars (local) or `npx wrangler secret put` (production).');
  console.error('If a real key was ever pushed, roll it in the Stripe dashboard right away.');
  process.exit(1);
}
console.log(`Secret check passed (${staged ? 'staged changes' : 'all tracked files'}).`);

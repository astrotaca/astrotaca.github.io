# Astrotaca Static Site Build

A small build step renders static HTML from `gallery-data.js` and `guides-data.js`.

## Use this order

1. Run the build:

```powershell
node build.js
```

2. Preview the generated site:

```powershell
npx serve .
```

If `serve` is not installed:

```powershell
npm install -g serve
serve .
```

## When to run the build

Run `node build.js` after changing:
- `gallery-data.js`
- `guides-data.js`
- `index.html`, `gallery.html`, `guides.html`
- any `gallery/*.html` or `guides/*.html` template

No build is needed for CSS, images, sidebar content, or static scripts.

## What it does

- generates gallery and guide cards in the main pages
- inlines the shared sidebar
- builds full HTML for `gallery/*.html` and `guides/*.html`

## Notes

- `gallery-data.js` and `guides-data.js` are the source of truth.
- Keep `sidebar.js` and `gallery-filter.js` for runtime interaction.

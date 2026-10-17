# Astrotaca

My astrophotography website, with my image gallery, some guides I've written, and the motorized flat panel I'm building. It's live at [astrotaca.com](https://astrotaca.com).

## How it's built

It's a static site (plain HTML, CSS and JavaScript, no framework). A small Node script, `build.js`, generates the pages so I'm not pasting the sidebar and the gallery cards into every file by hand.

The content lives in two data files:

- `gallery-data.js` for the images and their acquisition details
- `guides-data.js` for the guides

The build reads those and writes out the home page cards, the gallery and guides pages, and each individual gallery and guide page. It also drops the shared sidebar into every page and fills in the per-page meta tags (title, canonical link, social preview image).

Hosted on GitHub Pages with Cloudflare in front for DNS, HTTPS and caching.

## Running it locally

```
node build.js      # generate the pages
npx serve .        # preview locally
```

Rebuild after changing a data file, a page template, or the sidebar. CSS and image changes don't need a rebuild.

## Structure

```
build.js                         build script
gallery-data.js, guides-data.js  content for the gallery and guides
sidebar.html                     shared sidebar, injected at build time
sidebar.js, gallery-filter.js    runtime behavior (menu, filtering)
styles.css                       styles
*.html                           pages, written by the build
gallery/, guides/                individual image and guide pages
images/, avatar/                 assets
```

The data files are the source of truth, so I edit those and rebuild instead of editing the generated HTML directly.

## Brand assets

`brand/v1/` contains the production website assets from [AT-Brand-Kit](https://github.com/astrotaca/AT-Brand-Kit), revision `706c73d9991e14867d511f7aefb991daad9192ef`. The stacked white SVG sits above the subtitle in the dark sidebar, including the expanded mobile menu. The top bar stays unbranded when the sidebar is hidden. The SVG includes outlined lettering and needs no additional font.

`sidebar.html` and `build.js` provide the shared logo and icon markup. The root page templates use the branded social card; gallery and guide detail pages retain their own image previews. Rebuild with `node build.js` after changing these templates. The root favicon files are fallbacks for browsers that request them automatically.

The `/brand/v1/` paths and `styles.css?v=brand-v1` URL distinguish this update from previously cached assets. Use a new version when replacing them. Publishing still uses the existing GitHub Pages and Cloudflare setup.

## License

The code (build script, styles, JavaScript, page markup) is licensed under the [MIT License](LICENSE).

The photographs and other images in `images/`, `guides/`, and `avatar/` are **not** covered by that license — they are © taca, all rights reserved. If you'd like to use one, [get in touch](https://astrotaca.com/contact).

The AstroTaca marks in `brand/` and the root favicon and touch-icon files are also excluded from the code's MIT license; all rights reserved.

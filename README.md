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

`brand/v1/` contains the production website assets from [AT-Brand-Kit](https://github.com/astrotaca/AT-Brand-Kit), revision `706c73d9991e14867d511f7aefb991daad9192ef`. The stacked white SVG is used in dark mode and the charcoal SVG in light mode, in the sidebar and expanded mobile menu. The sidebar has no age/student subtitle. CSS switches the two assets with the saved theme. The top bar stays unbranded when the sidebar is hidden. Both SVGs include outlined lettering and need no additional font.

`sidebar.html` and `build.js` provide the shared logo and icon markup. The root page templates use the branded social card; gallery and guide detail pages retain their own image previews. Rebuild with `node build.js` after changing these templates. The root favicon files are fallbacks for browsers that request them automatically.

The `/brand/v1/` paths version the brand assets. Shared styles use `light-v1` and navigation scripts use `nav-v1` query versions in `build.js` to keep cached files in sync with the page markup. Use a new version when replacing them. Publishing still uses the existing GitHub Pages and Cloudflare setup.

Light-mode overrides live at the end of `styles.css`: a white sidebar, off-white page, blue navigation and focus states, subtle card shadows and contrasting form borders. Product-page teal accents remain in `flatpanel.css`. Layout and dark-mode styling are shared with the existing site.

## Navigation

Below 1200px, the menu has a sticky Close button, closes with Escape, and returns keyboard focus to the opener. The open menu contains Tab navigation and disables the page behind it; the closed sidebar is excluded from keyboard and screen-reader navigation. Desktop navigation remains available at 1200px and above.

Image and guide filters are native buttons with `aria-pressed` state. Tab moves between them; Enter or Space selects a category. Shared menu markup comes from `sidebar.html` and `build.js`, while the filter buttons are in the gallery and guides page templates.

## Homepage

`index.html` and `home.css` arrange Home as two featured guides, a compact flat-panel section, then the latest four images. Both grids reuse the same cards and responsive layout as Gallery and Guides. `buildIndex` in `build.js` selects guides by ID and reads images from the existing data files. There are no homepage filters; the collection pages retain their complete collections and filters. Missing featured guides fail the build.

## Flat panel page

Edit product copy in `flatpanel.html` and its scoped styles in `flatpanel.css`, then run the build to refresh shared navigation. The page presents customer features, NINA automation, 4,096 brightness levels (12-bit), public setup guides, and the existing interest form. Keep implementation details and private repository links out of published content.

`images/flatpanel/astrotaca-design-overview.png` is an earlier design render supplied by the owner. Its caption notes that the current clamp is not shown. Replace it and update the caption when new renders are available. The panel remains in development and is not available to order.

## License

The code (build script, styles, JavaScript, page markup) is licensed under the [MIT License](LICENSE).

The photographs and other images in `images/`, `guides/`, and `avatar/` are **not** covered by that license — they are © taca, all rights reserved. If you'd like to use one, [get in touch](https://astrotaca.com/contact).

The AstroTaca marks in `brand/` and the root favicon and touch-icon files are also excluded from the code's MIT license; all rights reserved.

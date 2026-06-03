const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;

function normalize(text) {
  return text.replace(/\r\n/g, '\n');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadData(filename, exportName) {
  const filePath = path.join(root, filename);
  const source = fs.readFileSync(filePath, 'utf8');
  const context = {
    window: { location: { pathname: '/' } },
    document: {
      readyState: 'loading',
      addEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      body: {},
    },
    console,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(context);
  new vm.Script(source, { filename }).runInContext(context);
  let value;
  try {
    value = vm.runInContext(exportName, context);
  } catch (error) {
    throw new Error(`Missing ${exportName} in ${filename}`);
  }
  if (value === undefined) {
    throw new Error(`Missing ${exportName} in ${filename}`);
  }
  return value;
}

function renderGalleryItems(items) {
  return items.map(item => `
        <a href="${escapeHtml(item.link).replace(/\.html$/, '')}" class="gallery-item" data-category="${escapeHtml(item.categories.join(' '))}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy" class="gallery-image loaded">
            <div class="gallery-info">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.filters)} · ${escapeHtml(item.duration)} · ${escapeHtml(item.categories[0] || '')}</p>
            </div>
        </a>`).join('');
}

function renderGuideItems(items) {
  return items.map(guide => `
        <a href="${escapeHtml(guide.link).replace(/\.html$/, '')}" class="guide-card" data-category="${escapeHtml(guide.category)}">
            <img src="${escapeHtml(guide.image)}" alt="${escapeHtml(guide.title)}" loading="lazy" class="guide-image loaded">
            <div class="guide-content">
                <h3>${escapeHtml(guide.title)}</h3>
                <p>${escapeHtml(guide.shortDescription)}</p>
            </div>
        </a>`).join('');
}

function renderGalleryDetailContent(item) {
  const rows = item.acquisition.map(row => `
                <tr>
                    <td>${escapeHtml(row.filter)}</td>
                    <td>${escapeHtml(row.exposure)}</td>
                    <td>${escapeHtml(String(row.count))}</td>
                    <td>${escapeHtml(row.total)}</td>
                </tr>`).join('');

  const equipmentHtml = item.equipment.map(entry => `
                <li><strong>${escapeHtml(entry.label)}:</strong> ${escapeHtml(entry.value)}</li>`).join('');

  const descriptionHtml = item.description.map(text => `
                <p>${text}</p>`).join('');

  return {
    imageSrc: escapeHtml(item.webImage || item.detailImage),
    detailHref: escapeHtml(item.detailImage),
    tableRows: `${rows}
                <tr class="total-row">
                    <td colspan="3"><strong>Total Integration</strong></td>
                    <td><strong>${escapeHtml(item.duration)}</strong></td>
                </tr>`,
    equipmentHtml,
    aboutHtml: `
            <h3>About the Target</h3>${descriptionHtml}`,
  };
}

function slugify(text) {
  return String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function renderGuideDetailContent(guide) {
  const tocEntries = [];
  const usedIds = new Set();

  const bodyHtml = guide.fullContent.map(block => {
    switch (block.type) {
      case 'heading': {
        const base = slugify(block.content) || 'section';
        let id = base;
        let n = 2;
        while (usedIds.has(id)) { id = `${base}-${n}`; n += 1; }
        usedIds.add(id);
        tocEntries.push({ id, text: block.content });
        return `<h2 id="${id}">${block.content}</h2>`;
      }
      case 'paragraph': return `<p>${block.content}</p>`;
      case 'list': return `<ul>${block.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
      case 'image': return `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" class="guide-detail-image">`;
      default: return '';
    }
  }).join('');

  // Only worth a contents list when there are a few sections to jump between.
  const tocHtml = tocEntries.length >= 3
    ? `<aside class="guide-toc" aria-label="Table of contents">
                            <p class="guide-toc-title">On this page</p>
                            <ul>
${tocEntries.map(e => `                                <li><a class="guide-toc-link" href="#${e.id}">${e.text}</a></li>`).join('\n')}
                            </ul>
                        </aside>`
    : '';

  return {
    imageSrc: escapeHtml(guide.detailImage),
    contentHtml: bodyHtml,
    tocHtml,
  };
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, normalize(content), 'utf8');
}

function extractSidebarHtml() {
  const sidebarPath = path.join(root, 'sidebar.html');
  const source = fs.readFileSync(sidebarPath, 'utf8');
  const match = source.match(/<aside[\s\S]*?<\/aside>/i);
  if (!match) {
    throw new Error('Unable to extract sidebar markup from sidebar.html');
  }
  return match[0];
}

function injectSidebar(content, sidebarHtml) {
  content = content.replace(/\s*<script[^>]*src="(?:\.\.\/)?load-sidebar\.js"[^>]*>\s*<\/script>\s*/gi, '');

  const fullContainerRegex = /<div id="sidebar-container">[\s\S]*?<aside\b[\s\S]*?<\/aside>\s*<\/div>/i;
  const placeholderContainerRegex = /<div id="sidebar-container">[\s\S]*?<\/div>/i;

  if (fullContainerRegex.test(content)) {
    content = content.replace(fullContainerRegex, `<div id="sidebar-container">${sidebarHtml}</div>`);
  } else if (placeholderContainerRegex.test(content)) {
    content = content.replace(placeholderContainerRegex, `<div id="sidebar-container">${sidebarHtml}</div>`);
  } else {
    throw new Error('Unable to locate sidebar container for injection.');
  }

  const cleanupBetweenContainerAndMain = /(<div id="sidebar-container">[\s\S]*?<\/aside><\/div>)[\s\S]*?(?=<main\b)/i;
  if (cleanupBetweenContainerAndMain.test(content)) {
    content = content.replace(cleanupBetweenContainerAndMain, '$1\n');
  }

  let firstSidebarFound = false;
  content = content.replace(/<aside id="sidebar"[\s\S]*?<\/aside>/gi, match => {
    if (!firstSidebarFound) {
      firstSidebarFound = true;
      return match;
    }
    return '';
  });

  // Rebuild the top nav from a canonical template so every page carries the same
  // accessible hamburger plus the light/dark theme toggle (idempotent across rebuilds).
  const topNavHtml = `<nav class="top-nav">
            <button id="sidebar-toggle" class="sidebar-toggle" type="button" aria-label="Open menu" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Switch to light mode" aria-pressed="false" title="Toggle light and dark mode">
                <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
                </svg>
                <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            </button>
        </nav>`;
  content = replaceHtmlElement(content, '<nav class="top-nav">', 'nav', topNavHtml, 'top navigation');

  return content;
}

function injectFavicon(content) {
  // Remove any previously injected favicon block so rebuilds stay idempotent.
  content = content.replace(/\s*<!-- favicons -->[\s\S]*?<!-- \/favicons -->/g, '');

  const block = `
    <!-- favicons -->
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <!-- /favicons -->`;

  const viewportRegex = /<meta name="viewport"[^>]*>/i;
  if (!viewportRegex.test(content)) {
    throw new Error('Unable to locate viewport meta for favicon injection.');
  }
  content = content.replace(viewportRegex, match => `${match}${block}`);
  return injectThemeBootstrap(content);
}

function injectThemeBootstrap(content) {
  // Set the saved theme on <html> before first paint so a light-mode visitor
  // never sees a flash of dark. It's inline and early in <head> so it runs
  // without any external script — the page no longer depends on JS to render.
  content = content.replace(/\s*<!-- theme-init -->[\s\S]*?<!-- \/theme-init -->/g, '');
  const block = `
    <!-- theme-init -->
    <script>(function(){try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.add('light-mode');}}catch(e){}})();</script>
    <!-- /theme-init -->`;
  const charsetRegex = /<meta charset="[^"]*">/i;
  if (!charsetRegex.test(content)) {
    throw new Error('Unable to locate charset meta for theme-init injection.');
  }
  return content.replace(charsetRegex, match => `${match}${block}`);
}

function replaceRegex(source, regex, replacement, description) {
  const matcher = new RegExp(regex.source, regex.flags);
  if (!matcher.test(source)) {
    throw new Error(`Unable to locate ${description} for replacement.`);
  }
  return source.replace(matcher, replacement);
}

function replaceOptional(source, regex) {
  return source.replace(new RegExp(regex.source, regex.flags), '');
}

function findMatchingClosingTag(source, startIndex, tagName) {
  const tagRegex = new RegExp(`<\\s*(\\/)?${tagName}\\b[^>]*>`, 'gi');
  tagRegex.lastIndex = startIndex;

  let depth = 0;
  let match;

  while ((match = tagRegex.exec(source)) !== null) {
    if (!match[1]) {
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0) {
        return tagRegex.lastIndex;
      }
    }
  }

  return -1;
}

function replaceHtmlElement(source, openTagMatch, tagName, replacement, description) {
  const startIndex = source.indexOf(openTagMatch);
  if (startIndex === -1) {
    throw new Error(`Unable to locate ${description} for replacement.`);
  }

  const endIndex = findMatchingClosingTag(source, startIndex, tagName);
  if (endIndex === -1) {
    throw new Error(`Unable to locate closing </${tagName}> for ${description}.`);
  }

  return source.slice(0, startIndex) + replacement + source.slice(endIndex);
}

function replaceNthHtmlElement(source, openTagMatch, tagName, occurrence, replacement, description) {
  let startIndex = -1;
  let searchIndex = 0;

  for (let i = 0; i < occurrence; i += 1) {
    startIndex = source.indexOf(openTagMatch, searchIndex);
    if (startIndex === -1) {
      throw new Error(`Unable to locate ${description} occurrence ${occurrence} for replacement.`);
    }

    const endIndex = findMatchingClosingTag(source, startIndex, tagName);
    if (endIndex === -1) {
      throw new Error(`Unable to locate closing </${tagName}> for ${description}.`);
    }

    if (i === occurrence - 1) {
      return source.slice(0, startIndex) + replacement + source.slice(endIndex);
    }

    searchIndex = endIndex;
  }

  throw new Error(`Unable to locate ${description} occurrence ${occurrence} for replacement.`);
}

function buildIndex(galleryImages, guidesData, sidebarHtml) {
  const filePath = path.join(root, 'index.html');
  let content = normalize(fs.readFileSync(filePath, 'utf8'));

  const galleryHtml = renderGalleryItems(galleryImages.slice(0, 4));
  const guidesHtml = renderGuideItems(guidesData.slice(0, 4));

  content = replaceHtmlElement(content, '<div class="gallery-grid" id="home-gallery"', 'div', `<div class="gallery-grid" id="home-gallery">${galleryHtml}
                </div>`, 'home gallery container');
  content = replaceHtmlElement(content, '<div class="gallery-grid" id="home-guides"', 'div', `<div class="gallery-grid" id="home-guides">${guidesHtml}
                </div>`, 'home guides container');

  content = replaceOptional(content, /\s*<script src="gallery-data\.js"><\/script>\r?\n\s*<script src="guides-data\.js"><\/script>\r?\n/);
  content = replaceOptional(content, /<script>[\s\S]*?const homeGuides = document.getElementById\('home-guides'\);[\s\S]*?<\/script>\r?\n/);
  content = injectSidebar(content, sidebarHtml);
  content = injectFavicon(content);

  writeFile(filePath, content);
  console.log('Updated index.html');
}

function buildGallery(galleryImages, sidebarHtml) {
  const filePath = path.join(root, 'gallery.html');
  let content = normalize(fs.readFileSync(filePath, 'utf8'));
  const galleryHtml = renderGalleryItems(galleryImages);

  content = replaceOptional(content, /\s*<!-- Gallery grid populated by gallery-data\.js -->\r?\n/);
  content = replaceHtmlElement(content, '<div class="gallery-grid"', 'div', `<div class="gallery-grid">${galleryHtml}
                </div>`, 'gallery grid container');
  content = replaceOptional(content, /\s*<script src="gallery-data\.js"><\/script>\r?\n/);
  content = injectSidebar(content, sidebarHtml);
  content = injectFavicon(content);
  writeFile(filePath, content);
  console.log('Updated gallery.html');
}

function buildGuides(guidesData, sidebarHtml) {
  const filePath = path.join(root, 'guides.html');
  let content = normalize(fs.readFileSync(filePath, 'utf8'));
  const guidesHtml = renderGuideItems(guidesData);

  content = replaceHtmlElement(content, '<div id="guidesGrid" class="guides-grid"', 'div', `<div id="guidesGrid" class="guides-grid">${guidesHtml}
                </div>`, 'guides grid container');
  content = replaceOptional(content, /\s*<script src="guides-data\.js"><\/script>\r?\n/);
  content = injectSidebar(content, sidebarHtml);
  content = injectFavicon(content);
  writeFile(filePath, content);
  console.log('Updated guides.html');
}

function buildStaticSidebarPages(pagePaths, sidebarHtml) {
  pagePaths.forEach(relativePath => {
    const filePath = path.join(root, relativePath);
    let content = normalize(fs.readFileSync(filePath, 'utf8'));
    content = injectSidebar(content, sidebarHtml);
    content = injectFavicon(content);
    writeFile(filePath, content);
    console.log(`Updated ${relativePath}`);
  });
}

function buildGalleryDetailPages(galleryImages, sidebarHtml) {
  galleryImages.forEach((item, index) => {
    const filePath = path.join(root, 'gallery', `${item.id}.html`);
    let content = normalize(fs.readFileSync(filePath, 'utf8'));

    const detailContent = renderGalleryDetailContent(item);

    content = replaceOptional(content, /<p class="lead">[\s\S]*?<\/p>\r?\n/);
    content = replaceOptional(content, /<div class="detail-nav">[\s\S]*?<\/div>\s*\r?\n?/);
    const galleryNavHtml = `        <div class="detail-nav">
            <a href="${escapeHtml(galleryImages[index - 1]?.id ? `${galleryImages[index - 1].id}` : '#')}" title="${galleryImages[index - 1] ? `Previous: ${escapeHtml(galleryImages[index - 1].title)}` : 'No previous image'}" class="${galleryImages[index - 1] ? '' : 'disabled'}">←</a>
            <a href="${escapeHtml(galleryImages[index + 1]?.id ? `${galleryImages[index + 1].id}` : '#')}" title="${galleryImages[index + 1] ? `Next: ${escapeHtml(galleryImages[index + 1].title)}` : 'No next image'}" class="${galleryImages[index + 1] ? '' : 'disabled'}">→</a>
        </div>
`;
    content = replaceRegex(content, /(<\/header>\s*\r?\n)/, `$1${galleryNavHtml}`, 'gallery detail navigation insertion');

    content = replaceRegex(content, /<tbody>[\s\S]*?<\/tbody>/, `<tbody>${detailContent.tableRows}
                            </tbody>`, 'detail table body');
    content = replaceRegex(content, /<ul class="equipment-list">[\s\S]*?<\/ul>/, `<ul class="equipment-list">${detailContent.equipmentHtml}
                            </ul>`, 'equipment list');
    content = replaceNthHtmlElement(content, '<div class="info-section">', 'div', 2, `<div class="info-section">${detailContent.aboutHtml}
                        </div>`, 'gallery detail info section');

    const ogImage = `https://astrotaca.com/${item.image}`;
    content = replaceRegex(content, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${escapeHtml(ogImage)}">`, 'og:image meta');
    content = replaceRegex(content, /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${escapeHtml(item.alt)}">`, 'og:image:alt meta');
    content = replaceRegex(content, /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${escapeHtml(ogImage)}">`, 'twitter:image meta');

    content = replaceRegex(content, /<img src="[^"]*" alt="[^"]*" class="detail-image">/, `<img src="${detailContent.imageSrc}" alt="${escapeHtml(item.alt)}" class="detail-image">`, 'detail image');
    content = replaceRegex(content, /<a href="[^"]*" target="_blank"[^>]*class="btn-link">/, `<a href="${detailContent.detailHref}" target="_blank" rel="noopener" class="btn-link">`, 'detail link');

    content = replaceOptional(content, /\s*<script src="\.\.\/gallery-data\.js"><\/script>\r?\n/);
    content = injectSidebar(content, sidebarHtml);
    content = injectFavicon(content);
    writeFile(filePath, content);
    console.log(`Updated gallery/${item.id}.html`);
  });
}

function buildGuideDetailPages(guidesData, sidebarHtml) {
  guidesData.forEach(guide => {
    const filePath = path.join(root, 'guides', `${guide.id}.html`);
    let content = normalize(fs.readFileSync(filePath, 'utf8'));

    const guideContent = renderGuideDetailContent(guide);

    const guideOgImage = `https://astrotaca.com/${guide.image}`;
    content = replaceRegex(content, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${escapeHtml(guideOgImage)}">`, 'guide og:image meta');
    content = replaceRegex(content, /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${escapeHtml(guideOgImage)}">`, 'guide twitter:image meta');

    content = replaceHtmlElement(content, '<div class="guide-detail-image-container">', 'div', `<div class="guide-detail-image-container">
                        <img src="${guideContent.imageSrc}" alt="${escapeHtml(guide.title)}" class="guide-detail-image">
                    </div>`, 'guide detail image container');
    content = replaceHtmlElement(content, '<div class="guide-detail-content">', 'div', `<div class="guide-detail-content">${guideContent.contentHtml}
                    </div>`, 'guide detail content');

    // Table of contents: clear any previous injection, then re-add (idempotent across rebuilds).
    content = replaceOptional(content, /\s*<aside class="guide-toc"[\s\S]*?<\/aside>/i);
    content = replaceOptional(content, /\n\s*<script src="\.\.\/guide-toc\.js"><\/script>/i);
    if (guideContent.tocHtml) {
      content = content.replace('<div class="guide-detail">', `<div class="guide-detail">
                        ${guideContent.tocHtml}`);
      content = content.replace('<script src="../sidebar.js"></script>', '<script src="../sidebar.js"></script>\n    <script src="../guide-toc.js"></script>');
    }

    content = replaceOptional(content, /\s*<script src="\.\.\/guides-data\.js"><\/script>\r?\n/);
    content = injectSidebar(content, sidebarHtml);
    content = injectFavicon(content);

    writeFile(filePath, content);
    console.log(`Updated guides/${guide.id}.html`);
  });
}

function main() {
  const galleryImages = loadData('gallery-data.js', 'galleryImages');
  const guidesData = loadData('guides-data.js', 'guidesData');
  const sidebarHtml = extractSidebarHtml();

  buildIndex(galleryImages, guidesData, sidebarHtml);
  buildGallery(galleryImages, sidebarHtml);
  buildGuides(guidesData, sidebarHtml);
  buildGalleryDetailPages(galleryImages, sidebarHtml);
  buildGuideDetailPages(guidesData, sidebarHtml);
  buildStaticSidebarPages(['about.html', 'contact.html', 'software.html', 'flatpanel.html'], sidebarHtml);

  console.log('Static HTML generation complete.');
}

// Build entry point.
main();

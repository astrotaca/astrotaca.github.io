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
        <a href="${escapeHtml(item.link)}" class="gallery-item" data-category="${escapeHtml(item.categories.join(' '))}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" class="gallery-image loaded">
            <div class="gallery-info">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.filters)} · ${escapeHtml(item.duration)} · ${escapeHtml(item.categories[0] || '')}</p>
            </div>
        </a>`).join('');
}

function renderGuideItems(items) {
  return items.map(guide => `
        <a href="${escapeHtml(guide.link)}" class="guide-card" data-category="${escapeHtml(guide.category)}">
            <img src="${escapeHtml(guide.image)}" alt="${escapeHtml(guide.title)}" class="guide-image loaded">
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

function renderGuideDetailContent(guide) {
  const bodyHtml = guide.fullContent.map(block => {
    switch (block.type) {
      case 'heading': return `<h2>${block.content}</h2>`;
      case 'paragraph': return `<p>${block.content}</p>`;
      case 'list': return `<ul>${block.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
      case 'image': return `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" class="guide-detail-image">`;
      default: return '';
    }
  }).join('');

  return {
    imageSrc: escapeHtml(guide.detailImage),
    contentHtml: bodyHtml,
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

  return content;
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
  writeFile(filePath, content);
  console.log('Updated guides.html');
}

function buildStaticSidebarPages(pagePaths, sidebarHtml) {
  pagePaths.forEach(relativePath => {
    const filePath = path.join(root, relativePath);
    let content = normalize(fs.readFileSync(filePath, 'utf8'));
    content = injectSidebar(content, sidebarHtml);
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
            <a href="${escapeHtml(galleryImages[index - 1]?.id ? `${galleryImages[index - 1].id}.html` : '#')}" title="${galleryImages[index - 1] ? `Previous: ${escapeHtml(galleryImages[index - 1].title)}` : 'No previous image'}" class="${galleryImages[index - 1] ? '' : 'disabled'}">←</a>
            <a href="${escapeHtml(galleryImages[index + 1]?.id ? `${galleryImages[index + 1].id}.html` : '#')}" title="${galleryImages[index + 1] ? `Next: ${escapeHtml(galleryImages[index + 1].title)}` : 'No next image'}" class="${galleryImages[index + 1] ? '' : 'disabled'}">→</a>
        </div>
`;
    content = replaceRegex(content, /(<\/header>\s*\r?\n)/, `$1${galleryNavHtml}`, 'gallery detail navigation insertion');

    content = replaceRegex(content, /<tbody>[\s\S]*?<\/tbody>/, `<tbody>${detailContent.tableRows}
                            </tbody>`, 'detail table body');
    content = replaceRegex(content, /<ul class="equipment-list">[\s\S]*?<\/ul>/, `<ul class="equipment-list">${detailContent.equipmentHtml}
                            </ul>`, 'equipment list');
    content = replaceNthHtmlElement(content, '<div class="info-section">', 'div', 2, `<div class="info-section">${detailContent.aboutHtml}
                        </div>`, 'gallery detail info section');

    content = replaceRegex(content, /<img src="[^"]*" alt="[^"]*" class="detail-image">/, `<img src="${detailContent.imageSrc}" alt="${escapeHtml(item.alt)}" class="detail-image">`, 'detail image');
    content = replaceRegex(content, /<a href="[^"]*" target="_blank" class="btn-link">/, `<a href="${detailContent.detailHref}" target="_blank" class="btn-link">`, 'detail link');

    content = replaceOptional(content, /\s*<script src="\.\.\/gallery-data\.js"><\/script>\r?\n/);
    content = injectSidebar(content, sidebarHtml);
    writeFile(filePath, content);
    console.log(`Updated gallery/${item.id}.html`);
  });
}

function buildGuideDetailPages(guidesData, sidebarHtml) {
  guidesData.forEach(guide => {
    const filePath = path.join(root, 'guides', `${guide.id}.html`);
    let content = normalize(fs.readFileSync(filePath, 'utf8'));

    const guideContent = renderGuideDetailContent(guide);

    content = replaceHtmlElement(content, '<div class="guide-detail-image-container">', 'div', `<div class="guide-detail-image-container">
                        <img src="${guideContent.imageSrc}" alt="${escapeHtml(guide.title)}" class="guide-detail-image">
                    </div>`, 'guide detail image container');
    content = replaceHtmlElement(content, '<div class="guide-detail-content">', 'div', `<div class="guide-detail-content">${guideContent.contentHtml}
                    </div>`, 'guide detail content');
    content = replaceOptional(content, /\s*<script src="\.\.\/guides-data\.js"><\/script>\r?\n/);
    content = injectSidebar(content, sidebarHtml);

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

main();

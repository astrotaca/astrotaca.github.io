const galleryImages = [
    {
        id: 'ngc7000',
        title: 'The Cygnus wall in NGC 7000',
        date: '2026-02-28',
        image: 'images/previews/NGC7000.jpg',
        alt: 'NGC 7000 - North America Nebula',
        filters: 'SHO',
        duration: '6 hours',
        categories: ['nebulae'],
        link: 'gallery/ngc7000.html',
        detailImage: '../images/NGC7000.jpg',
        webImage: '../images/web/NGC7000.jpg',
        acquisition: [
            { filter: 'Hα (656nm)', exposure: '300s', count: 30, total: '2.5h' },
            { filter: 'SII (672nm)', exposure: '300s', count: 30, total: '2.5h' },
            { filter: 'OIII (496nm)', exposure: '300s', count: 12, total: '1' }
        ],
        equipment: [
            { label: 'Telescope', value: 'ZWO FF65 APO' },
            { label: 'Filter Wheel', value: 'ZWO EFW' },
            { label: 'Filters', value: 'Antlia 3nm (36mm) + LRGB-V pro' },
            { label: 'Camera', value: 'ZWO ASI2600MM' },
            { label: 'Mount', value: 'ZWO AM5N' }
        ],
        description: [
            'NGC 7000, the North America Nebula, is an emission nebula in the constellation Cygnus. The Cygnus Wall is a prominent feature within this nebula, showcasing active star formation regions.',
            'This image was captured using narrowband filters in the SHO (Hubble Palette) configuration, revealing the intricate structures of ionized gases within the nebula.'
        ]
    },
    {
        id: 'bodes-cigar',
        title: 'Bode\u2019s Galaxy and the Cigar Galaxy in Ursa Major',
        date: '2026-02-28',
        image: 'images/previews/bodes-cigar.jpg',
        alt: 'Bode\u2019s Galaxy and the Cigar Galaxy in Ursa Major',
        filters: 'RGB',
        duration: '15 hours',
        categories: ['galaxies'],
        link: 'gallery/bodes-cigar.html',
        detailImage: '../images/bodes-cigar.jpg',
        webImage: '../images/web/bodes-cigar.jpg',
        acquisition: [
            { filter: 'None', exposure: '300s', count: 178, total: '15h' },
        ],
        equipment: [
            { label: 'Telescope', value: 'ZWO FF65 APO' },
            { label: 'Camera', value: 'Sony A6000' },
            { label: 'Mount', value: 'ZWO AM5N' }
        ],
        description: [
            'M81, Bode\u2019s Galaxy, is a grand design spiral galaxy in the constellation Ursa Major. M82, the Cigar Galaxy, is a nearby starburst galaxy interacting gravitationally with M81, driving intense star formation and outflows.',
            'This pair is among the brightest galaxies in the northern sky and can be observed together in a wide-field view.'
        ]
    },
    {
        id: 'm33',
        title: 'The Triangulum Galaxy, a Spiral Galaxy in Triangulum',
        date: '2026-02-28',
        image: 'images/previews/m33.jpg',
        alt: 'The Triangulum Galaxy, a Spiral Galaxy in Triangulum',
        filters: 'RGB',
        duration: '22,5 hours',
        categories: ['galaxies'],
        link: 'gallery/m33.html',
        detailImage: '../images/m33.jpg',
        webImage: '../images/web/m33.jpg',
        acquisition: [
            { filter: 'None', exposure: '300s', count: 270, total: '22.5h' },
        ],
        equipment: [
            { label: 'Telescope', value: 'ZWO FF65 APO' },
            { label: 'Camera', value: 'Sony A6000' },
            { label: 'Mount', value: 'ZWO AM5N' }
        ],
        description: [
            'M33, the Triangulum Galaxy, is a spiral galaxy in the constellation Triangulum and a member of the Local Group. Its loosely wound arms are rich in H II regions, with NGC 604 being one of the largest star-forming regions known.',
            'As one of the closest spiral galaxies to the Milky Way, M33 is a prominent target for both amateur and professional astronomers.'
        ]
    },
    {
        id: 'm31',
        title: 'A closer look at the Andromeda Galaxy',
        date: '2026-02-28',
        image: 'images/previews/m31.jpg',
        alt: 'Andromeda Galaxy',
        filters: 'RGB',
        duration: '9 hours',
        categories: ['galaxies'],
        link: 'gallery/m31.html',
        detailImage: '../images/m31.jpg',
        webImage: '../images/web/m31.jpg',
        acquisition: [
            { filter: 'None', exposure: '240s', count: 136, total: '9h' },
        ],
        equipment: [
            { label: 'Telescope', value: 'ZWO FF65 APO' },
            { label: 'Camera', value: 'Sony A6000' },
            { label: 'Mount', value: 'ZWO AM5N' }
        ],
        description: [
            'M31, the Andromeda Galaxy, is a massive spiral galaxy in the constellation Andromeda and the largest member of the Local Group. It contains hundreds of billions of stars and several satellite galaxies, including M32 and M110.',
            'Visible to the naked eye under dark skies, M31 is the closest spiral galaxy to the Milky Way and is on a collision course with it in about 4 billion years.'
        ]
    },
    {
        id: 'mw-tenerife',
        title: 'Milky Way from Tenerife',
        date: '2026-02-28',
        image: 'images/previews/mw-tenerife.jpg',
        alt: 'Milky Way from Tenerife',
        filters: 'RGB',
        duration: '1 hour',
        categories: ['widefield'],
        link: 'gallery/mw-tenerife.html',
        detailImage: '../images/mw-tenerife.jpg',
        webImage: '../images/web/mw-tenerife.jpg',
        acquisition: [
            { filter: 'None', exposure: '101s', count: 42, total: '1h' },
        ],
        equipment: [
            { label: 'Telescope', value: 'Sigma 16mm F1.4' },
            { label: 'Camera', value: 'Sony A6000' },
            { label: 'Mount', value: 'SkyWatcher Star Adventurer 2i' }
        ],
        description: [
            'The Milky Way is our home galaxy, containing hundreds of billions of stars. This wide-field image captures the galactic core with its dense star fields and dark dust lanes.',
            'Captured from Teide National Park in Tenerife at over 2,000 meters elevation, where dark skies and clear atmospheric conditions make it an exceptional location for astrophotography.'
        ]
    },
];

function renderGallery() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    galleryGrid.innerHTML = galleryImages.map(item => `
        <a href="${item.link}" class="gallery-item" data-category="${item.categories.join(' ')}">
            <img src="${item.image}" alt="${item.alt}" class="gallery-image">
            <div class="gallery-info">
                <h3>${item.title}</h3>
                <p>${item.filters} · ${item.duration} · ${item.categories[0]}</p>
            </div>
        </a>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderBreadcrumbsAndMeta(imageData) {
    const sectionHeader = document.querySelector('.section-header');
    if (!sectionHeader) return;

    document.body.classList.add('detail-page');

    let container = sectionHeader.querySelector('.breadcrumbs-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'breadcrumbs-container';
        const titleEl = sectionHeader.querySelector('h1');
        if (titleEl) {
            sectionHeader.insertBefore(container, titleEl.nextSibling);
        } else {
            sectionHeader.prepend(container);
        }
    }

    let leftGroup = container.querySelector('.breadcrumbs-left');
    if (!leftGroup) {
        leftGroup = document.createElement('div');
        leftGroup.className = 'breadcrumbs-left';
        container.appendChild(leftGroup);
    }

    const breadcrumbs = document.createElement('nav');
    breadcrumbs.className = 'breadcrumbs';
    breadcrumbs.setAttribute('aria-label', 'Breadcrumb');
    const items = [
        { label: 'Home', href: '../index.html' },
        { label: 'Gallery', href: '../gallery.html' },
        { label: imageData.title }
    ];
    breadcrumbs.innerHTML = items.map((item, index) => {
        const separator = index < items.length - 1 ? '<span class="breadcrumb-sep">/</span>' : '';
        if (item.href) {
            return `<a href="${item.href}">${item.label}</a>${separator}`;
        }
        return `<span aria-current="page">${item.label}</span>`;
    }).join('');

    const calendarIcon = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x="16" y1="2" x2="16" y2="6"/><line x="8" y1="2" x2="8" y2="6"/><line x="3" y1="10" x2="21" y2="10"/></svg>`;
    const tagIcon = `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0l-5.59-5.59a2 2 0 0 1 0-2.83l7.17-7.17a2 2 0 0 1 2.83 0l5.59 5.59a2 2 0 0 1 0 2.83z"/><circle cx="9" cy="9" r="1"/></svg>`;

    const hasDate = Boolean(imageData.date);
    const dateText = hasDate ? formatDate(imageData.date) : '';

    const tags = (imageData.tags && imageData.tags.length) ? imageData.tags : imageData.categories;
    const tagText = (tags && tags.length) ? tags.join(', ') : '';

    const galleryLink = `<a class="meta-gallery" href="../gallery.html">Gallery</a>`;

    const metaItems = [];
    if (hasDate) {
        metaItems.push(`<span class="meta-item meta-date" title="Capture date">${calendarIcon} ${dateText}</span>`);
    }

    const galleryPart = hasDate ? `to ${galleryLink}` : galleryLink;

    if (tagText) {
        metaItems.push(`<span class="meta-item meta-tags" title="Tags">${tagIcon} Tags: ${tagText}</span>`);
    }

    const metaBarText = [
        ...metaItems,
        `<span class="meta-item meta-gallery">${galleryPart}</span>`
    ].join(' | ');

    let metaBar = container.querySelector('.detail-meta-bar');
    if (!metaBar) {
        metaBar = document.createElement('div');
        metaBar.className = 'detail-meta-bar';
        leftGroup.appendChild(metaBar);
    }
    metaBar.innerHTML = metaBarText;

    leftGroup.innerHTML = '';
    leftGroup.appendChild(breadcrumbs);
    leftGroup.appendChild(metaBar);
}

function renderDetailPage() {
    const currentPage = window.location.pathname.split('/').pop();
    
    const imageId = currentPage.replace('.html', '');
    
    const imageData = galleryImages.find(img => img.id === imageId);
    if (!imageData || !imageData.acquisition) return;
    
    document.title = `${imageData.title} - Astrotaca`;
    const pageTitles = document.querySelectorAll('.page-title, .section-header h1');
    pageTitles.forEach(el => el.textContent = imageData.title);
    
    const lead = document.querySelector('.lead');
    if (lead) {
        lead.textContent = `${imageData.filters} | ${imageData.duration}`;
        lead.style.display = 'none';
    }
    
    const detailImg = document.querySelector('.detail-image');
    if (detailImg) {
        detailImg.src = imageData.webImage || imageData.detailImage;
        detailImg.alt = imageData.alt;
    }
    
    const fullResLink = document.querySelector('.detail-actions a');
    if (fullResLink) fullResLink.href = imageData.detailImage;
    
    const tableBody = document.querySelector('.acquisition-table tbody');
    if (tableBody && imageData.acquisition) {
        const totalTime = imageData.duration;
        tableBody.innerHTML = imageData.acquisition.map(row => `
            <tr>
                <td>${row.filter}</td>
                <td>${row.exposure}</td>
                <td>${row.count}</td>
                <td>${row.total}</td>
            </tr>
        `).join('') + `
            <tr class="total-row">
                <td colspan="3"><strong>Total Integration</strong></td>
                <td><strong>${totalTime}</strong></td>
            </tr>
        `;
    }

    const headerNavHolder = document.querySelector('.breadcrumbs-container');
    if (headerNavHolder) {
        const currentIndex = galleryImages.findIndex(img => img.id === imageId);
        if (currentIndex !== -1) {
            const prev = galleryImages[currentIndex - 1] || null;
            const next = galleryImages[currentIndex + 1] || null;

            let navEl = headerNavHolder.querySelector('.detail-nav');
            if (!navEl) {
                navEl = document.createElement('div');
                navEl.className = 'detail-nav';
                headerNavHolder.appendChild(navEl);
            }

            navEl.innerHTML = '';

            const prevLink = document.createElement('a');
            prevLink.href = prev ? `${prev.id}.html` : '#';
            prevLink.title = prev ? `Previous: ${prev.title}` : 'No previous image';
            prevLink.innerHTML = '◀';
            if (!prev) prevLink.classList.add('disabled');
            navEl.appendChild(prevLink);

            const nextLink = document.createElement('a');
            nextLink.href = next ? `${next.id}.html` : '#';
            nextLink.title = next ? `Next: ${next.title}` : 'No next image';
            nextLink.innerHTML = '▶';
            if (!next) nextLink.classList.add('disabled');
            navEl.appendChild(nextLink);
        }
    }
    
    const equipmentList = document.querySelector('.equipment-list');
    if (equipmentList && imageData.equipment) {
        equipmentList.innerHTML = imageData.equipment.map(item => `
            <li><strong>${item.label}:</strong> ${item.value}</li>
        `).join('');
    }
    
    const descSection = document.querySelector('.info-section:last-child');
    if (descSection && imageData.description) {
        const descHTML = imageData.description.map(p => `<p>${p}</p>`).join('');
        descSection.innerHTML = `<h3>About the Target</h3>${descHTML}`;
    }

    renderBreadcrumbsAndMeta(imageData);
}

function init() {
    renderGallery();
    renderDetailPage();
    
    const images = document.querySelectorAll('.gallery-image, .guide-image, .detail-image');
    images.forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
            if (img.naturalHeight > img.naturalWidth) {
                img.classList.add('portrait');
            }
        } else {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
                if (img.naturalHeight > img.naturalWidth) {
                    img.classList.add('portrait');
                }
            });
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
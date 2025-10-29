const galleryImages = [
    {
        id: 'ngc7000',
        title: 'The Cygnus wall in NGC 7000',
        image: 'images/previews/NGC7000.jpg',
        alt: 'NGC 7000 - North America Nebula',
        filters: 'SHO',
        duration: '6 hours',
        categories: ['nebulae'],
        link: 'gallery/ngc7000.html',
        detailImage: '../images/NGC7000.jpg',
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
        title: 'Bode’s Galaxy and the Cigar Galaxy in Ursa Major',
        image: 'images/previews/bodes-cigar.jpg',
        alt: 'Bode’s Galaxy and the Cigar Galaxy in Ursa Major',
        filters: 'RGB',
        duration: '15 hours',
        categories: ['galaxies'],
        link: 'gallery/bodes-cigar.html',
        detailImage: '../images/bodes-cigar.jpg',
        acquisition: [
            { filter: 'None', exposure: '300s', count: 178, total: '15h' },
        ],
        equipment: [
            { label: 'Telescope', value: 'ZWO FF65 APO' },
            { label: 'Camera', value: 'Sony A6000' },
            { label: 'Mount', value: 'ZWO AM5N' }
        ],
        description: [
            'M81, Bode’s Galaxy, is a grand design spiral galaxy in the constellation Ursa Major. M82, the Cigar Galaxy, is a nearby starburst galaxy interacting gravitationally with M81, driving intense star formation and outflows.',
'This pair is among the brightest galaxies in the northern sky and can be observed together in a wide-field view.'

        ]
    },

    {
        id: 'm33',
        title: 'The Triangulum Galaxy, a Spiral Galaxy in Triangulum',
        image: 'images/previews/m33.jpg',
        alt: 'The Triangulum Galaxy, a Spiral Galaxy in Triangulum',
        filters: 'RGB',
        duration: '22,5 hours',
        categories: ['galaxies'],
        link: 'gallery/m33.html',
        detailImage: '../images/m33.jpg',
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
        image: 'images/previews/m31.jpg',
        alt: 'Andromeda Galaxy',
        filters: 'RGB',
        duration: '9 hours',
        categories: ['galaxies'],
        link: 'gallery/m31.html',
        detailImage: '../images/m31.jpg',
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
        image: 'images/previews/mw-tenerife.jpg',
        alt: 'Milky Way from Tenerife',
        filters: 'RGB',
        duration: '1 hour',
        categories: ['widefield'],
        link: 'gallery/mw-tenerife.html',
        detailImage: '../images/mw-tenerife.jpg',
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
                <p>${item.filters} | ${item.duration}</p>
            </div>
        </a>
    `).join('');
}

function renderDetailPage() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // use ID instead of filename, example: "ngc7000.html" should be "ngc7000")
    const imageId = currentPage.replace('.html', '');
    
    const imageData = galleryImages.find(img => img.id === imageId);
    if (!imageData || !imageData.acquisition) return;
    
    document.title = `${imageData.title} - Astrotaca`;
    const pageTitles = document.querySelectorAll('.page-title, .section-header h1');
    pageTitles.forEach(el => el.textContent = imageData.title);
    
    const lead = document.querySelector('.lead');
    if (lead) lead.textContent = `${imageData.filters} | ${imageData.duration}`;
    
    const detailImg = document.querySelector('.detail-image');
    if (detailImg) {
        detailImg.src = imageData.detailImage;
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
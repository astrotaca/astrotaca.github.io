const guidesData = [
{
    id: 'sleep-while-using-telescope-nina',
    title: 'Sleep While Using Your Telescope: A Guide to NINA',
    categories: ['advanced'],
    image: 'guides/previews/sleep-while-using-telescope-nina-preview.jpg',
    shortDescription: 'Building NINA sequences that handle target acquisition through shutdown, manage failures automatically, and let you sleep while imaging.',
    link: 'guides/sleep-while-using-telescope-nina.html',
    detailImage: '../guides/sleep-while-using-telescope-nina.jpg',
    fullContent: [
        { type: 'paragraph', content: 'This guide covers building NINA sequences that handle target acquisition through shutdown, manage failures automatically, and let you sleep while imaging.' },
        { type: 'paragraph', content: '<strong>Prerequisites:</strong> You should know how to connect your equipment to NINA and run a basic sequence. This guide focuses on building reliable, unattended automation.' },
        { type: 'heading', content: 'What NINA Does' },
        { type: 'paragraph', content: 'NINA is sequencing software. It controls your mount, camera, focuser, filter wheel, and guider to execute a defined plan.' }
    ]
},

{
    id: 'custom-ascom-driver-nina',
    title: 'Building Custom ASCOM Drivers',
    categories: ['advanced'],
    image: 'guides/previews/custom-ascom-driver-nina.jpg',
    shortDescription: 'Building ASCOM drivers to integrate custom hardware with NINA and other imaging software.',
    link: 'guides/custom-ascom-driver-nina.html',
    detailImage: '../guides/custom-ascom-driver-nina.jpg',
    fullContent: [
        { type: 'paragraph', content: 'This guide covers building ASCOM drivers to integrate custom hardware with NINA and other imaging software.' },
        { type: 'heading', content: 'What ASCOM Does' },
        { type: 'paragraph', content: 'ASCOM provides standard interfaces between astronomy software and hardware.' }
    ]
},

{
    id: 'stacked-images-look-like',
    title: 'What Should Stacked Images Look Like?',
    categories: ['basics'],
    image: 'guides/previews/stacked-images-look-like.jpg',
    shortDescription: 'Understanding why your stacked astrophotography images look dim, flat, and green before processing.',
    link: 'guides/stacked-images-look-like.html',
    detailImage: '../guides/stacked-images-look-like.jpg',
    fullContent: [
        { type: 'paragraph', content: 'After stacking your astrophotography data into a FITS file, the result might look underwhelming: dim, flat, and possibly green.' },
        { type: 'heading', content: 'Linear vs. Stretched Images' },
        { type: 'paragraph', content: 'Most processing software saves stacked images in linear format.' }
    ]
}
];

function renderGuides() {

    const guidesGrid = document.querySelector('.guides-grid');
    if (!guidesGrid) return;

    guidesGrid.innerHTML = guidesData.map(guide => `
        <a href="${guide.link}" 
           class="guide-card"
           data-category="${guide.categories.join(' ')}">

            <img src="${guide.image}" 
                 alt="${guide.title}" 
                 class="guide-image">

            <div class="guide-content">
                <h3>${guide.title}</h3>
                <p>${guide.shortDescription}</p>
            </div>

        </a>
    `).join('');

    guidesGrid.querySelectorAll('.guide-image').forEach(img => {
        if (img.complete) img.classList.add('loaded');
        else img.addEventListener('load', () => img.classList.add('loaded'));
    });

    if (window.initFilters) window.initFilters();
}

function renderGuideDetail() {

    const currentPage = window.location.pathname.split('/').pop();
    const guideId = currentPage.replace('.html', '');

    const guide = guidesData.find(g => g.id === guideId);
    if (!guide || !guide.fullContent) return;

    document.title = `${guide.title} - Astrotaca`;

    const sectionHeader = document.querySelector('.section-header h1');
    if (sectionHeader) sectionHeader.textContent = guide.title;

    const detailImageContainer = document.querySelector('.guide-detail-image-container');

    if (detailImageContainer && guide.detailImage) {
        detailImageContainer.innerHTML =
            `<img src="${guide.detailImage}" alt="${guide.title}" class="guide-detail-image">`;
    }

    const guideContent = document.querySelector('.guide-detail-content');

    if (guideContent && guide.fullContent) {

        guideContent.innerHTML = guide.fullContent.map(block => {

            switch(block.type) {

                case 'heading':
                    return `<h2>${block.content}</h2>`;

                case 'paragraph':
                    return `<p>${block.content}</p>`;

                case 'list':
                    return `<ul>${block.items.map(i => `<li>${i}</li>`).join('')}</ul>`;

                case 'image':
                    return `<img src="${block.src}" alt="${block.alt}" class="guide-detail-image">`;

                default:
                    return '';
            }

        }).join('');
    }
}

if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', () => {
        renderGuides();
        renderGuideDetail();
    });

} else {

    renderGuides();
    renderGuideDetail();

}
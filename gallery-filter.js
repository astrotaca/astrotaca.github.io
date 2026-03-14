function initFilters() {
    document.querySelectorAll('.section-header').forEach(header => {
        const tags = header.querySelectorAll('.tag');
        if (!tags.length) return;

        let grid = header.nextElementSibling;
        while (grid && !grid.classList.contains('gallery-grid') && !grid.classList.contains('guides-grid')) {
            grid = grid.nextElementSibling;
        }
        if (!grid) return;

        function applyFilter(filter) {
            const items = grid.querySelectorAll('.gallery-item, .guide-card');
            const currentHeight = grid.getBoundingClientRect().height;
            grid.style.minHeight = currentHeight + 'px';
            grid.classList.add('is-filtering');

            requestAnimationFrame(() => {
                items.forEach(item => {
                    const cat = item.getAttribute('data-category') || '';
                    const show = filter === 'all' || cat.split(' ').includes(filter);
                    item.classList.toggle('hidden', !show);
                });

                requestAnimationFrame(() => {
                    grid.style.minHeight = '';
                    grid.classList.remove('is-filtering');
                });
            });
        }

        tags.forEach(tag => {
            tag.addEventListener('click', () => {
                tags.forEach(t => t.classList.remove('active'));
                tag.classList.add('active');
                applyFilter(tag.getAttribute('data-filter') || 'all');
            });
        });
    });
}

document.addEventListener("DOMContentLoaded", initFilters);
window.initFilters = initFilters;
document.addEventListener('DOMContentLoaded', () => {
    const tags = document.querySelectorAll('.tags .tag');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            
            const filter = tag.getAttribute('data-filter');
            
            galleryItems.forEach(item => {
                const categories = item.getAttribute('data-category');
                
                if (filter === 'all' || categories.includes(filter)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
});
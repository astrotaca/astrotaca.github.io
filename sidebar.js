const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const mainContent = document.querySelector('.main-content');

let isResizing = false;
let startX = 0;
let startWidth = 0;

function toggleSidebar() {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
}

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', toggleSidebar);
}

if (sidebar) {
    sidebar.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || 
            e.target.closest('a') || e.target.closest('button') ||
            e.target.tagName === 'IMG') {
            return;
        }
        
        isResizing = true;
        startX = e.clientX;
        startWidth = sidebar.offsetWidth;
        sidebar.style.transition = 'none';
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
    });
}

function handleResize(e) {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(280, Math.min(window.innerWidth, startWidth + deltaX));
    sidebar.style.width = newWidth + 'px';
    
    if (window.innerWidth > 768 && mainContent) {
        mainContent.style.marginLeft = newWidth + 'px';
    }
}

function stopResize(e) {
    if (!isResizing) return;
    
    isResizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    const currentWidth = sidebar.offsetWidth;
    const threshold = window.innerWidth * 0.5;
    
    sidebar.style.transition = 'width 0.3s ease';
    
    if (currentWidth > threshold) {
        sidebar.style.width = '100vw';
        if (window.innerWidth > 768 && mainContent) {
            mainContent.style.marginLeft = '100vw';
            mainContent.style.transition = 'margin-left 0.3s ease';
        }
    } else {
        sidebar.style.width = '21rem';
        if (window.innerWidth > 768 && mainContent) {
            mainContent.style.marginLeft = '21rem';
            mainContent.style.transition = 'margin-left 0.3s ease';
        }
    }
    
    setTimeout(() => {
        sidebar.style.transition = '';
        if (mainContent) {
            mainContent.style.transition = '';
        }
    }, 300);
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        if (sidebar) sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }
});
const sidebarOverlay = document.getElementById("sidebar-overlay")
const mainContent = document.querySelector(".main-content")

window.initSidebar = function () {

    const sidebar = document.getElementById("sidebar")
    if (!sidebar) return

    const sidebarToggle = document.getElementById("sidebar-toggle")

    const baseWidthValue = getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar-width')
        .trim();

    // Ensure we have a valid CSS size string (e.g. "345px").
    const baseWidth = baseWidthValue.endsWith('px') ? baseWidthValue : `${parseInt(baseWidthValue, 10)}px`;

    sidebar.style.width = baseWidth;

    let isResizing = false
    let startX = 0
    let startWidth = 0

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.contains("open")

            if (isOpen) {
                sidebar.classList.remove("open")
                sidebar.style.width = baseWidth
                if (sidebarOverlay) sidebarOverlay.classList.remove("active")
            } else {
                sidebar.classList.add("open")
                sidebar.style.width = "100vw"
                if (sidebarOverlay) sidebarOverlay.classList.add("active")
            }
        })
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", () => {
            sidebar.classList.remove("open")
            sidebar.style.width = baseWidth
            sidebarOverlay.classList.remove("active")
        })
    }

    sidebar.addEventListener("mousedown", (e) => {

        const interactive = e.target.closest("a, button, input, textarea, select")

        if (interactive) return

        isResizing = true
        startX = e.clientX
        startWidth = sidebar.offsetWidth

        sidebar.style.transition = "none"

        document.addEventListener("mousemove", handleResize)
        document.addEventListener("mouseup", stopResize)

        e.preventDefault()
    })

    function handleResize(e) {
        if (!isResizing) return
        if (e.buttons === 0) return

        const deltaX = e.clientX - startX
        const newWidth = Math.max(315, Math.min(window.innerWidth, startWidth + deltaX))

        sidebar.style.width = newWidth + "px"

        // When resizing, keep main content margin constant so the sidebar overlays.
        // This makes the sidebar expand over the content instead of pushing it.
        // (Main content margin is set once on init based on the base CSS variable.)
    }

    function stopResize() {

        if (!isResizing) return
        isResizing = false

        document.removeEventListener("mousemove", handleResize)
        document.removeEventListener("mouseup", stopResize)

        const currentWidth = sidebar.offsetWidth
        const snapThreshold = window.innerWidth * 0.5

        sidebar.style.transition = "width 0.25s ease"

        const targetWidth = currentWidth >= snapThreshold ? "100vw" : baseWidth
        sidebar.style.width = targetWidth

        setTimeout(() => {
            sidebar.style.transition = "";
        }, 260);
    }

    const links = sidebar.querySelectorAll(".nav-link")

    const path = window.location.pathname
    const section = path.split("/")[1]

    links.forEach(link => {

        const href = link.getAttribute("href")

        if (
            path === href ||
            href === `/${section}.html`
        ) {
            link.classList.add("active")
        } else {
            link.classList.remove("active")
        }

    })

    window.addEventListener("resize", () => {
        sidebar.classList.remove("open")
        sidebar.style.width = baseWidth
        if (sidebarOverlay) sidebarOverlay.classList.remove("active")
    })
}

function initSidebarOnLoad() {
    if (typeof window.initSidebar === 'function') {
        window.initSidebar()
    }
    document.body.classList.add('ready')
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarOnLoad)
} else {
    initSidebarOnLoad()
}

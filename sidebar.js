// The saved theme is applied pre-paint by the inline theme-init script in <head>,
// so there's no flash of the wrong theme and the page never depends on this file
// to become visible.
const sidebarOverlay = document.getElementById("sidebar-overlay")

window.initSidebar = function () {

    const sidebar = document.getElementById("sidebar")
    if (!sidebar) return

    const sidebarToggle = document.getElementById("sidebar-toggle")
    const sidebarClose = document.getElementById("sidebar-close")
    const main = document.querySelector("main")
    const desktop = window.matchMedia("(min-width: 1200px)")

    const baseWidthValue = getComputedStyle(document.documentElement)
        .getPropertyValue('--sidebar-width')
        .trim();

    // Ensure we have a valid CSS size string (e.g. "345px").
    const baseWidth = baseWidthValue.endsWith('px') ? baseWidthValue : `${parseInt(baseWidthValue, 10)}px`;

    sidebar.style.width = baseWidth;

    let isResizing = false
    let startX = 0
    let startWidth = 0

    function setMenuOpen(open, restoreFocus = false) {
        open = open && !desktop.matches
        sidebar.classList.toggle("open", open)
        sidebar.style.width = open ? "100%" : baseWidth
        if (sidebarOverlay) sidebarOverlay.classList.toggle("active", open)
        document.documentElement.classList.toggle("menu-open", open)
        if (main) main.inert = open
        sidebar.inert = false

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", String(open))
            sidebarToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu")
        }

        if (open) {
            sidebar.removeAttribute("aria-hidden")
            sidebar.setAttribute("role", "dialog")
            sidebar.setAttribute("aria-modal", "true")
            sidebar.setAttribute("aria-label", "Navigation menu")
            sidebar.scrollTop = 0
            if (sidebarClose) sidebarClose.focus({ preventScroll: true })
        } else {
            // Move focus out before hiding the off-screen sidebar.
            if (!desktop.matches && (restoreFocus || sidebar.contains(document.activeElement))) {
                if (sidebarToggle) sidebarToggle.focus({ preventScroll: true })
            }
            sidebar.removeAttribute("role")
            sidebar.removeAttribute("aria-modal")
            sidebar.removeAttribute("aria-label")
            sidebar.inert = !desktop.matches
            if (desktop.matches) sidebar.removeAttribute("aria-hidden")
            else sidebar.setAttribute("aria-hidden", "true")
        }
    }

    if (sidebarToggle) sidebarToggle.addEventListener("click", () => setMenuOpen(!sidebar.classList.contains("open"), true))
    if (sidebarClose) sidebarClose.addEventListener("click", () => setMenuOpen(false, true))
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", () => setMenuOpen(false, true))

    sidebar.addEventListener("keydown", (event) => {
        if (!sidebar.classList.contains("open") || desktop.matches) return
        if (event.key === "Escape") {
            event.preventDefault()
            setMenuOpen(false, true)
        } else if (event.key === "Tab") {
            const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled])')]
                .filter(element => element.getClientRects().length > 0)
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }
    })

    function syncViewport() {
        const focusWasOnClose = document.activeElement === sidebarClose ||
            (desktop.matches && sidebar.classList.contains("open") && document.activeElement === document.body)
        setMenuOpen(false)
        if (desktop.matches && focusWasOnClose) sidebar.querySelector('.brand-link').focus()
    }
    desktop.addEventListener("change", syncViewport)
    syncViewport()

    sidebar.addEventListener("mousedown", (e) => {

        if (!desktop.matches || e.button !== 0) return

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

    const normalizePath = (p) => p.replace(/\.html$/, "").replace(/\/+$/, "") || "/"
    const path = normalizePath(window.location.pathname)

    links.forEach(link => {

        const href = normalizePath(link.getAttribute("href"))

        const isActive = path === href || (href !== "/" && path.startsWith(href + "/"))
        link.classList.toggle("active", isActive)
        if (isActive) link.setAttribute("aria-current", path === href ? "page" : "location")
        else link.removeAttribute("aria-current")

    })

}

function initThemeToggle() {
    const toggle = document.getElementById("theme-toggle")
    if (!toggle) return

    const root = document.documentElement

    const syncState = () => {
        const isLight = root.classList.contains("light-mode")
        toggle.setAttribute("aria-pressed", isLight ? "true" : "false")
        toggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode")
    }

    syncState()

    toggle.addEventListener("click", () => {
        const isLight = root.classList.toggle("light-mode")
        try {
            localStorage.setItem("theme", isLight ? "light" : "dark")
        } catch (e) {}
        syncState()
    })
}

function initSidebarOnLoad() {
    if (typeof window.initSidebar === 'function') {
        window.initSidebar()
    }
    initThemeToggle()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarOnLoad)
} else {
    initSidebarOnLoad()
}

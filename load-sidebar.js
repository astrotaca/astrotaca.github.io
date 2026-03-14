function loadSidebar() {

    const container = document.getElementById("sidebar-container")
    if (!container) return

    fetch(`/sidebar.html?v=${Date.now()}`, { cache: "reload" })
        .then(res => res.text())
        .then(html => {

            // Parse the fetched HTML safely
            const parser = new DOMParser()
            const doc = parser.parseFromString(html, "text/html")
            const sidebar = doc.querySelector("aside#sidebar")

            if (!sidebar) {
                console.warn("Sidebar not found in sidebar.html")
                return
            }

            // Insert sidebar
            container.innerHTML = ""
            container.appendChild(sidebar)
            container.style.visibility = "visible"

            const sidebarEl = document.getElementById("sidebar")
            if (sidebarEl) sidebarEl.classList.add("no-transition")

            // Initialize sidebar logic
            if (window.initSidebar) {
                window.initSidebar()
            }

            // Allow transitions again next frame
            requestAnimationFrame(() => {
                if (sidebarEl) sidebarEl.classList.remove("no-transition")
                document.body.classList.add("ready")
            })
        })
        .catch(err => {
            console.error("Failed to load sidebar:", err)
        })
}


// Ensure sidebar loads regardless of DOM ready timing
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSidebar)
} else {
    loadSidebar()
}
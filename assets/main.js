// === MOBILE MENU TOGGLE ===
function toggleMenu() {
  const nav = document.getElementById("nav-menu");
  if (nav) {
    nav.classList.toggle("open");
  }
}

// === GO BACK FUNCTION ===
function goBack() {
  const sidebar = document.querySelector('.right-sidebar');
  if (sidebar) {
    // Trigger the reverse (slide‑out) animation
    sidebar.classList.remove('slide-in');
  }
  // Wait for the reverse animation to finish before navigating back
  setTimeout(() => {
    window.history.back();
  }, 800); // Adjust the delay if needed (should match your CSS transition duration)
}

// === SEARCH DATA & FUNCTIONS ===
const searchItems = [
  { name: "About", link: "/about/" },
  { name: "Products", link: "/products/" },
  { name: "Flap Flat Panel", link: "/products/flap-flat-panel/" },
  { name: "Auto Focuser (EAF)", link: "/products/eaf/" },
  { name: "DC Hub", link: "/products/dc-hub/" },
  { name: "Drivers/Software", link: "/drivers/" },
  { name: "Guides", link: "/guides/" },
  { name: "Contact", link: "/contact/" },
  { name: "FAQ", link: "/faq/" },
  { name: "LRGB Processing", link: "/guides/lrgb-processing/" },
  { name: "OSC vs. Mono Cameras", link: "/guides/osc-vs-mono/" },
  { name: "Beginner Astro Tips", link: "/guides/beginners-astro-tips/" },
  { name: "ascom", link: "/drivers/" }
];

function toggleSearch() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.focus();
  }
}

function liveSearch() {
  let input = document.getElementById("search-input").value.toLowerCase();
  let results = document.getElementById("search-results");
  results.innerHTML = "";
  if (input.length === 0) {
    results.classList.remove('show');
    return;
  }
  let filtered = searchItems.filter(item => item.name.toLowerCase().includes(input));
  if (filtered.length > 0) {
    filtered.forEach(item => {
      let li = document.createElement("li");
      li.innerHTML = `<a href="${item.link}" style="color:white;text-decoration:none;">${item.name}</a>`;
      results.appendChild(li);
    });
    results.classList.add('show');
  } else {
    results.classList.remove('show');
  }
}

// Close search results when clicking outside the search box
document.addEventListener("click", function(e) {
  let box = document.querySelector(".search-box");
  let list = document.getElementById("search-results");
  if (box && !box.contains(e.target)) {
    list.classList.remove('show');
  }
});

// === SIDEBAR OPEN/CLOSE (for mobile) ===
function openSidebar() {
  const sidebarWrapper = document.querySelector(".sidebar-wrapper");
  const sidebarOverlay = document.querySelector(".sidebar-overlay");
  if (sidebarWrapper && sidebarOverlay) {
    sidebarWrapper.classList.add("active");
    sidebarOverlay.classList.add("active");
  }
}

function closeSidebar() {
  const sidebarWrapper = document.querySelector(".sidebar-wrapper");
  const sidebarOverlay = document.querySelector(".sidebar-overlay");
  if (sidebarWrapper && sidebarOverlay) {
    sidebarWrapper.classList.remove("active");
    sidebarOverlay.classList.remove("active");
  }
}

// === COOKIE BANNER FUNCTIONS ===
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
  let cname = name + "=";
  let decoded = decodeURIComponent(document.cookie);
  let ca = decoded.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(cname) === 0) {
      return c.substring(cname.length, c.length);
    }
  }
  return "";
}

function showCookieBanner() {
  let banner = document.getElementById("cookie-banner");
  if (!banner) return;
  if (!getCookie("cookieConsent")) {
    banner.style.display = "flex";
  }
}

// === DOMContentLoaded: Unified Setup ===
document.addEventListener("DOMContentLoaded", function() {
  // Remove any lingering fade-out class from the body (if present)
  document.body.classList.remove("fade-out");

  // Ensure the sidebar wrapper is visible on post pages
  const sidebarWrapper = document.querySelector('.sidebar-wrapper');
  if (sidebarWrapper) {
    sidebarWrapper.classList.add('active'); // This sets display: block per your CSS
  }

  // Trigger the sidebar slide‑in animation on page load
  const sidebar = document.querySelector('.right-sidebar');
  if (sidebar) {
    // Force a reflow to ensure the transition will occur
    void sidebar.offsetWidth;
    setTimeout(() => {
      sidebar.classList.add('slide-in');
    }, 50); // Adjust delay as needed
  }

  // Set up internal link navigation (without applying a global fade-out)
  let cancelNavigation = false; // Flag to cancel pending navigation if needed
  const internalLinks = document.querySelectorAll("a[href^='/'], a[href^='" + window.location.origin + "']");
  internalLinks.forEach(link => {
    if (link.target === "_blank") return;
    link.addEventListener("click", function(e) {
      e.preventDefault();
      cancelNavigation = false; // Reset cancellation flag on each click
      const href = this.getAttribute("href");

      if (sidebar) {
        // Trigger the sidebar slide‑out (reverse) animation
        sidebar.classList.remove('slide-in');

        // Use the transitionend event so that navigation waits for the sidebar to finish animating out.
        const transitionHandler = function(event) {
          sidebar.removeEventListener('transitionend', transitionHandler);
          if (!cancelNavigation) {
            window.location.href = href;
          }
        };
        sidebar.addEventListener('transitionend', transitionHandler);
      } else {
        window.location.href = href;
      }
    });
  });

  // Listen for the popstate event to cancel pending navigation if the user goes back
  window.addEventListener("popstate", function() {
    cancelNavigation = true;
  });

  // Set up the cookie banner functionality
  showCookieBanner();
  const acceptBtn = document.getElementById("cookie-accept-btn");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", function() {
      setCookie("cookieConsent", "true", 365);
      const banner = document.getElementById("cookie-banner");
      if (banner) {
        banner.style.display = "none";
      }
    });
  }
});

// === PAGESHOW EVENT (for bfcache) ===
window.addEventListener("pageshow", function(event) {
  // Ensure the sidebar wrapper is visible when the page is loaded from cache
  const sidebarWrapper = document.querySelector('.sidebar-wrapper');
  if (sidebarWrapper) {
    sidebarWrapper.classList.add('active');
  }
  
  const sidebar = document.querySelector('.right-sidebar');
  if (sidebar) {
    // Remove any lingering slide‑in state, force reflow, then re-add the class
    sidebar.classList.remove('slide-in');
    void sidebar.offsetWidth;
    setTimeout(() => {
      sidebar.classList.add('slide-in');
    }, 50); // Adjust delay as needed
  }
});

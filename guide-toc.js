// Scroll-spy for the guide table of contents, with a sliding indicator that
// animates between sections. Standard approach: the active section is the last
// heading scrolled past a line near the top of the viewport; the final section
// is shown once the page is scrolled to the bottom (those short trailing sections
// can never reach the line on their own).
(function () {
    function init() {
        var toc = document.querySelector('.guide-toc');
        var content = document.querySelector('.guide-detail-content');
        if (!toc || !content) return;

        var list = toc.querySelector('ul');
        var headings = Array.prototype.slice.call(content.querySelectorAll('h2[id]'));
        if (!list || !headings.length) return;

        var linkById = {};
        Array.prototype.forEach.call(toc.querySelectorAll('a[href^="#"]'), function (link) {
            linkById[link.getAttribute('href').slice(1)] = link;
            // Scroll to the section without writing a #hash into the URL.
            link.addEventListener('click', function (e) {
                var target = document.getElementById(link.getAttribute('href').slice(1));
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // Single indicator bar that slides to the active item.
        var indicator = document.createElement('span');
        indicator.className = 'guide-toc-indicator';
        list.appendChild(indicator);

        var activeId = null;
        var first = true;
        function setActive(id) {
            if (id === activeId) return;
            if (activeId && linkById[activeId]) linkById[activeId].classList.remove('active');
            activeId = id;
            var link = linkById[id];
            if (!link) return;
            link.classList.add('active');

            // Skip the slide animation on the very first placement.
            if (first) indicator.style.transition = 'none';
            indicator.style.transform = 'translateY(' + link.offsetTop + 'px)';
            indicator.style.height = link.offsetHeight + 'px';
            indicator.style.opacity = '1';
            if (first) {
                void indicator.offsetHeight; // force reflow so the jump isn't animated
                indicator.style.transition = '';
                first = false;
            }
        }

        function computeActive() {
            var line = window.innerHeight * 0.25;
            var current = headings[0].id;
            for (var i = 0; i < headings.length; i++) {
                if (headings[i].getBoundingClientRect().top <= line) current = headings[i].id;
                else break;
            }
            // Once at the bottom, the final short sections can't reach the line — show the last.
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
                current = headings[headings.length - 1].id;
            }
            setActive(current);
        }

        var ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(function () {
                ticking = false;
                computeActive();
            });
        }

        computeActive();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

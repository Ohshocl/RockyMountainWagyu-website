/* ============================================================
   ROCKY MOUNTAIN WAGYU — MAIN JAVASCRIPT
   Replaces all inline <script> blocks across every page.

   Covers:
     index.html, About_us.html, Products-Pricing.html,
     Ordering_Process.html, Contact.html,
     salt-lake-city-wagyu-beef.html, ogden-wagyu-beef.html,
     provo-wagyu-beef.html

   What stays in each page's own inline <script>:
     - Google Analytics page_view event with the page-specific
       title and path (see migration notes)

   Bug fix included:
     - index.html had TWO separate document click listeners
       (one for nav, one for TOC). This file consolidates
       them into one. Delete both old listeners when migrating
       index.html.
   ============================================================ */


/* ============================================================
   1. MOBILE NAVIGATION TOGGLE
   Called via onclick="toggleMenu()" in HTML.
   Must remain in global scope.
   ============================================================ */
function toggleMenu() {
    const nav = document.getElementById('navMenu');
    if (nav) nav.classList.toggle('active');
}


/* ============================================================
   2. TABLE OF CONTENTS TOGGLE
   Called via onclick="toggleTOC()" in HTML.
   Must remain in global scope.
   ============================================================ */
function toggleTOC() {
    const sidebar   = document.getElementById('tocSidebar');
    const hamburger = document.querySelector('.toc-hamburger');
    if (sidebar)   sidebar.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');
}


/* ============================================================
   3. CLICK OUTSIDE — CLOSE NAV AND TOC
   Single consolidated listener.

   Replaces the two separate document click listeners that
   existed on index.html (one for nav, one for TOC).
   All other pages already had this combined correctly.
   ============================================================ */
document.addEventListener('click', function (event) {
    const nav          = document.getElementById('navMenu');
    const toggle       = document.querySelector('.mobile-menu-toggle');
    const tocSidebar   = document.getElementById('tocSidebar');
    const tocHamburger = document.querySelector('.toc-hamburger');

    // Close mobile nav if clicking outside
    if (nav && toggle &&
        !nav.contains(event.target) &&
        !toggle.contains(event.target)) {
        nav.classList.remove('active');
    }

    // Close TOC sidebar if clicking outside
    if (tocSidebar && tocHamburger &&
        !tocSidebar.contains(event.target) &&
        !tocHamburger.contains(event.target)) {
        tocSidebar.classList.remove('active');
        tocHamburger.classList.remove('active');
    }
});


/* ============================================================
   4. NAV LINKS — CLOSE MOBILE MENU ON CLICK
   ============================================================ */
document.querySelectorAll('nav a').forEach(function (link) {
    link.addEventListener('click', function () {
        const nav = document.getElementById('navMenu');
        if (nav) nav.classList.remove('active');
    });
});


/* ============================================================
   5. TOC — SMOOTH SCROLL + CLOSE SIDEBAR ON LINK CLICK

   Header offset is calculated dynamically from the actual
   header element height. This means:
     - index, about, ordering, contact → ~134px automatically
     - products (main margin-top: 0 override) → still correct
     - city pages (SLC, Ogden, Provo) → ~134px automatically

   Previously pages hardcoded 94 or 134. Dynamic calculation
   removes that inconsistency entirely.
   ============================================================ */
(function () {
    const tocLinks = document.querySelectorAll('.toc-link');
    if (!tocLinks.length) return;

    // Measure the fixed header once on load
    const header       = document.querySelector('header');
    const headerOffset = header ? header.offsetHeight : 134;

    tocLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId      = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const elementPosition = targetSection.getBoundingClientRect().top;
                const scrollTarget    = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
            }

            // Close TOC after navigating
            const sidebar   = document.getElementById('tocSidebar');
            const hamburger = document.querySelector('.toc-hamburger');
            if (sidebar)   sidebar.classList.remove('active');
            if (hamburger) hamburger.classList.remove('active');
        });
    });
}());


/* ============================================================
   6. TOC ACTIVE SECTION HIGHLIGHTING ON SCROLL

   Queries both section[id] AND div[id] to cover
   Products-Pricing.html which uses div IDs for the detailed
   product panels (whole-beef, half-beef, quarter-beef,
   presale). Other pages have no div[id] sections so the
   broader selector causes no issues there.

   Uses requestAnimationFrame to throttle scroll handler —
   matches the optimized pattern used on Ordering and About
   pages. Index and Contact did not use rAF; this is an
   improvement for those pages.
   ============================================================ */
(function () {
    const tocLinks = document.querySelectorAll('.toc-link');
    const sections = document.querySelectorAll('section[id], div[id]');
    if (!tocLinks.length || !sections.length) return;

    function highlightActiveSection() {
        // 150px offset accounts for fixed header + some breathing room
        const scrollPos = window.scrollY + 150;

        sections.forEach(function (section) {
            const sectionTop    = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId     = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                tocLinks.forEach(function (link) {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // Throttle with rAF — one paint cycle per scroll event
    let rafPending = false;
    window.addEventListener('scroll', function () {
        if (!rafPending) {
            rafPending = true;
            window.requestAnimationFrame(function () {
                highlightActiveSection();
                rafPending = false;
            });
        }
    });

    // Run once on load to highlight correct section on page refresh
    highlightActiveSection();
}());


/* ============================================================
   7. GOOGLE ANALYTICS — GENERIC CTA CLICK TRACKING

   Tracks clicks on any .btn element across the entire site.
   This is the generic version of the tracking that existed
   only on salt-lake-city-wagyu-beef.html — now it works
   on every page automatically.

   The gtag.js snippet and individual page_view events stay
   in each page's own <head> / inline <script>.
   ============================================================ */
document.querySelectorAll('.btn').forEach(function (button) {
    button.addEventListener('click', function () {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'cta_click', {
                event_category: 'CTA',
                event_label:    this.textContent.trim(),
                value:          1
            });
        }
    });
});

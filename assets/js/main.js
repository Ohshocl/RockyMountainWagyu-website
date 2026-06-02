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


/* ============================================================
   8. NAV HOME LINK — REWRITE index.html → /

   Any nav link with href="index.html" is rewritten to href="/"
   at runtime. This prevents Google from discovering /index.html
   as a separate URL from /, which causes the "Alternate page
   with proper canonical tag" warning in Search Console.

   No HTML changes needed across any page — one fix here
   covers the entire site.
   ============================================================ */
document.querySelectorAll('nav a[href="index.html"]').forEach(function (link) {
    link.setAttribute('href', '/');
});


/* ============================================================
   9. SHARED FOOTER INJECTION

   Injects the shared footer into every page automatically.
   Each HTML page must replace its hardcoded <footer>...</footer>
   block with this single placeholder tag:

       <div id="site-footer"></div>

   To update phone numbers, social links, or any footer copy
   site-wide: edit ONLY this section. No HTML changes needed.

   Phone numbers:
     Primary:   402-217-5291  (href="tel:4022175291")
     Secondary: 801-301-3850  (href="tel:8013013850")
     Tertiary:  435-239-5465  (display only — no href)
   ============================================================ */
(function () {
    const target = document.getElementById('site-footer');
    if (!target) return;

    target.outerHTML = `
<footer>
    <div class="footer-content">
        <div class="footer-section">
            <div class="footer-logo">
                <img src="documents/Rocky Mountain Wagyu Logo.png" alt="Rocky Mountain Wagyu Logo">
            </div>
            <div class="footer-brand">
                <p>Premium, organic Wagyu beef raised with care in Utah's Rocky Mountains.</p>
                <p>We're a family-operated farm with a commitment to quality that exceeds industry standards.</p>
                <p class="footer-tagline">Pasture to plate, The Rocky Mountain Way</p>
            </div>
        </div>
        <div class="footer-section">
            <h4>Contact Us</h4>
            <ul class="footer-contact-info">
                <li><strong>Phone:</strong><br><a href="tel:4022175291">402-217-5291</a></li>
                <li><a href="tel:8013013850">801-301-3850</a></li>
                <li>435-239-5465</li>
                <li><strong>Email:</strong><br><a href="mailto:rockymtnwagyu&#64;gmail.com">rockymtnwagyu&#64;gmail.com</a></li>
                <li><strong>Location:</strong><br>Utah Rocky Mountains</li>
                <li><strong>Hours:</strong><br>By appointment</li>
            </ul>
        </div>
        <div class="footer-section">
            <h4>Follow Us</h4>
            <div class="footer-social-links">
                <a href="https://www.instagram.com/RockymtnWagyu" target="_blank" class="footer-social-link" rel="noopener">
                    <div class="footer-social-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                    </div>
                    <span>@RockymtnWagyu</span>
                </a>
                <a href="https://www.tiktok.com/@Rockymtnwagyu" target="_blank" class="footer-social-link" rel="noopener">
                    <div class="footer-social-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                    </div>
                    <span>@Rockymtnwagyu</span>
                </a>
            </div>
        </div>
    </div>
    <div class="footer-bottom">
        <p>&copy; 2025 Rocky Mountain Wagyu. All rights reserved.</p>
        <p style="margin-top: 10px;">Premium Wagyu Beef Near You | Utah Family Farm | Prime Grade Organic Beef</p>
    </div>
</footer>`;
}());

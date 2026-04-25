/* Unfied Navigation & Dropdown Logic using Event Delegation (ohshtml Pattern) */
(function () {
  const CLOSE_DURATION = 350;

  document.addEventListener("click", function (e) {
    const target = e.target;

    // 1. Hamburger / Offcanvas Toggle
    const toggler = target.closest(".navbar-toggler");
    if (toggler) {
      const targetId =
        toggler.getAttribute("data-bs-target") || "#offcanvasNavbar";
      const offcanvas = document.querySelector(targetId);
      if (offcanvas) {
        offcanvas.classList.toggle("show");
        // Add a backdrop if missing or handle it via CSS
      }
      return;
    }

    // 2. Offcanvas Close Button
    const closeBtn = target.closest(".btn-close");
    if (closeBtn) {
      const offcanvas = closeBtn.closest(".offcanvas");
      if (offcanvas) offcanvas.classList.remove("show");
      return;
    }

    // 3. Dropdown Toggle (Desktop & Mobile)
    const dropdownToggle = target.closest(".menu-header .dropdown-toggle");
    if (dropdownToggle) {
      e.preventDefault();
      e.stopPropagation();

      const parent = dropdownToggle.closest(".dropdown");
      const desktopMenu = parent.querySelector(".dropdown-menu");
      let mobileMenuId =
        dropdownToggle.getAttribute("href") ||
        dropdownToggle.getAttribute("data-bs-target");
      if (mobileMenuId) mobileMenuId = mobileMenuId.replace("#", "");
      const mobileMenu = mobileMenuId
        ? document.getElementById(mobileMenuId)
        : null;

      if (window.innerWidth >= 992) {
        // Desktop Logic
        if (!desktopMenu) return;
        const isOpen = desktopMenu.classList.contains("show");

        // Close other open dropdowns
        document.querySelectorAll(".menu-header .dropdown").forEach((item) => {
          if (item !== parent) {
            item.classList.remove("show");
            const m = item.querySelector(".dropdown-menu");
            if (m) m.classList.remove("show");
            const link = item.querySelector(".nav-link");
            if (link) link.classList.remove("show");
          }
        });

        // Toggle current
        if (isOpen) {
          parent.classList.remove("show");
          desktopMenu.classList.remove("show");
          dropdownToggle.classList.remove("show");
        } else {
          parent.classList.add("show");
          desktopMenu.classList.add("show");
          dropdownToggle.classList.add("show");
        }
      } else if (mobileMenu) {
        // Mobile Accordion Logic
        const isShown = mobileMenu.classList.contains("show");
        if (isShown) {
          mobileMenu.style.height = mobileMenu.scrollHeight + "px";
          mobileMenu.classList.remove("collapse", "show");
          mobileMenu.classList.add("collapsing");
          void mobileMenu.offsetHeight; // force reflow
          mobileMenu.style.height = "0px";
          setTimeout(() => {
            mobileMenu.classList.remove("collapsing");
            mobileMenu.classList.add("collapse");
            mobileMenu.style.height = "";
          }, CLOSE_DURATION);
        } else {
          mobileMenu.classList.remove("collapse");
          mobileMenu.classList.add("collapsing");
          mobileMenu.style.height = mobileMenu.scrollHeight + "px";
          setTimeout(() => {
            mobileMenu.classList.remove("collapsing");
            mobileMenu.classList.add("collapse", "show");
            mobileMenu.style.height = "";
          }, CLOSE_DURATION);
        }
        dropdownToggle.classList.toggle("collapsed");
      }
      return;
    }

    // 4. Close on Click Outside (Desktop only)
    if (window.innerWidth >= 992 && !target.closest(".dropdown")) {
      document.querySelectorAll(".menu-header .dropdown").forEach((item) => {
        item.classList.remove("show");
        const m = item.querySelector(".dropdown-menu");
        if (m) m.classList.remove("show");
        const link = item.querySelector(".nav-link");
        if (link) link.classList.remove("show");
      });
    }

    // 5. Close Mobile Menu on Link Click
    if (window.innerWidth < 992 && target.closest(".offcanvas-body a")) {
      const offcanvas = target.closest(".offcanvas");
      if (offcanvas) offcanvas.classList.remove("show");
    }
  });

  // 3. Lazy Load Third-Party Scripts (GTM, LeadConnector)
  let scriptsLoaded = false;
  const lazyLoadScripts = () => {
    if (scriptsLoaded) return;
    scriptsLoaded = true;

    console.log("Lazy loading third-party scripts...");

    // Google Tag Manager
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", "GTM-W6WCW52");

    // LeadConnector Form Scripts
    const lcScripts = [
      "https://link.msgsndr.com/js/form_embed.js",
      "https://widgets.leadconnectorhq.com/loader.js",
    ];
    lcScripts.forEach((src) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      document.head.appendChild(s);
    });
  };

  // Trigger loading on interaction or after 3.5s delay
  const triggerEvents = [
    "touchstart",
    "mouseover",
    "wheel",
    "scroll",
    "keydown",
  ];
  triggerEvents.forEach((ev) =>
    window.addEventListener(ev, lazyLoadScripts, { once: true, passive: true }),
  );
  setTimeout(lazyLoadScripts, 8000);

  // Sticky Header Logic (Simplified)
  window.addEventListener(
    "scroll",
    function () {
      const header = document.querySelector(".page-header");
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
      }
    },
    { passive: true },
  );
})();

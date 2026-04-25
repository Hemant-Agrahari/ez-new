/* components/header/header.js */

(function () {
  // Vanilla JS replacement for Bootstrap navigation toggles
  const offcanvasToggles = document.querySelectorAll('[data-bs-toggle="offcanvas"]');
  const offcanvasCloseBtns = document.querySelectorAll('.offcanvas .btn-close');
  
  offcanvasToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = toggle.getAttribute('data-bs-target') || toggle.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        target.classList.add('show');
        // Bootstrap offcanvas requires visibility
        target.style.visibility = 'visible';
      }
    });
  });

  offcanvasCloseBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const offcanvas = btn.closest('.offcanvas');
      if (offcanvas) {
        offcanvas.classList.remove('show');
        setTimeout(() => {
          if (!offcanvas.classList.contains('show')) {
            offcanvas.style.visibility = 'hidden';
          }
        }, 300); // match transition duration
      }
    });
  });

  const collapseToggles = document.querySelectorAll('[data-bs-toggle="collapse"]');
  collapseToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = toggle.getAttribute('href') || toggle.getAttribute('data-bs-target');
      let target = null;
      if (targetId && targetId !== '#') {
        target = document.querySelector(targetId);
      }
      
      const dropdownParent = toggle.closest('.dropdown');
      
      // Close other dropdowns
      document.querySelectorAll('.collapse.show, .dropdown.show').forEach(el => {
        if (el !== target && el !== dropdownParent) {
           el.classList.remove('show');
        }
      });

      if (target) {
        target.classList.toggle('show');
      }
      
      if (dropdownParent) {
        dropdownParent.classList.toggle('show');
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown') && !e.target.closest('[data-bs-toggle="offcanvas"]')) {
      document.querySelectorAll('.collapse.show, .dropdown.show').forEach(el => {
        el.classList.remove('show');
      });
    }
  });

  // Dynamic Time Update
  const dayEl = document.getElementById("current-day");
  const timeEl = document.getElementById("current-time");

  function updateTime() {
    const now = new Date();
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];

    if (dayEl) dayEl.textContent = days[now.getDay()];
    if (timeEl) {
      let hours = now.getHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutes = now.getMinutes().toString().padStart(2, "0");
      timeEl.textContent = `${hours}:${minutes} ${ampm}`;
    }
  }

  updateTime();
  setInterval(updateTime, 60000);
})();

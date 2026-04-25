document.addEventListener("DOMContentLoaded", () => {
  const promoCarousel = document.querySelector(".promo-carousel");
  if (promoCarousel) {
    new VCarousel(promoCarousel, {
      infinite: true,
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 3000,
      arrows: false,
      dots: true,
      responsive: [
        { breakpoint: 991, settings: { slidesToShow: 2, slidesToScroll: 1 } },
        { breakpoint: 767, settings: { slidesToShow: 1, slidesToScroll: 1 } },
      ],
    });
  }
  const testimonialCarousel = document.querySelector(".testimonial-carousel");
  if (testimonialCarousel) {
    new VCarousel(testimonialCarousel, {
      infinite: true,
      slidesToShow: 2,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 3000,
      arrows: false,
      dots: true,
      responsive: [
        { breakpoint: 767, settings: { slidesToShow: 1, slidesToScroll: 1 } },
      ],
    });
  }
  const accordionButtons = document.querySelectorAll(".accordion-button");
  accordionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const parent = button.closest(".accordion-item");
      const collapse = parent.querySelector(".accordion-collapse");
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      accordionButtons.forEach((otherButton) => {
        if (otherButton !== button) {
          otherButton.setAttribute("aria-expanded", "false");
          otherButton.classList.add("collapsed");
          const otherParent = otherButton.closest(".accordion-item");
          const otherCollapse = otherParent.querySelector(
            ".accordion-collapse",
          );
          otherCollapse.classList.remove("show");
        }
      });
      button.setAttribute("aria-expanded", !isExpanded);
      button.classList.toggle("collapsed", isExpanded);
      collapse.classList.toggle("show", !isExpanded);
    });
  });
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove("lazy");
          }
          observer.unobserve(img);
        }
      });
    });
    lazyImages.forEach((img) => observer.observe(img));
  }
});
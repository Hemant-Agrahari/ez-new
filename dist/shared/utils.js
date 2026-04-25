async function injectComponent(id, path) {
  const target = document.getElementById(id);
  if (!target) return;
  try {
    const response = await fetch(path);
    const html = await response.text();
    target.innerHTML = html;
    const scripts = target.querySelectorAll("script");
    scripts.forEach((script) => {
      const newScript = document.createElement("script");
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      document.body.appendChild(newScript);
      script.remove();
    });
  } catch (error) {
    console.error(`Error loading component from ${path}:`, error);
  }
}
function initLazyLoading() {
  const images = document.querySelectorAll("img[data-src]");
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        observer.unobserve(img);
      }
    });
  }, observerOptions);
  images.forEach((img) => observer.observe(img));
}
window.ezUtils = {
  injectComponent,
  initLazyLoading,
};
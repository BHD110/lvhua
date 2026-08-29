(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const interactiveSelector = "button, a.generate, label.pick, label.action, label.upload";
  const entranceObserver = reducedMotion ? null : new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.amicroDelay || 0);
      window.setTimeout(() => entry.target.classList.add("is-visible"), delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: .2 });

  function addEntrance(element, delay = 0) {
    if (element.dataset.amicroEntrance) return;
    element.dataset.amicroEntrance = "true";
    element.classList.add("motion-enter");
    element.dataset.amicroDelay = String(delay);
    if (entranceObserver) entranceObserver.observe(element);
    else element.classList.add("is-visible");
  }

  function makeMagnetic(element) {
    if (element.dataset.amicroMagnetic || reducedMotion) return;
    element.dataset.amicroMagnetic = "true";
    element.classList.add("magnetic");
    element.addEventListener("mousemove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .12;
      const y = (event.clientY - rect.top - rect.height / 2) * .12;
      element.style.transform = `translate(${x}px, ${y}px)`;
    });
    element.addEventListener("mouseleave", () => { element.style.transform = "translate(0, 0)"; });
  }

  function makeTilt(element) {
    if (element.dataset.amicroTilt || reducedMotion) return;
    element.dataset.amicroTilt = "true";
    element.classList.add("tilt-surface");
    element.addEventListener("mousemove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      element.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateZ(0)`;
    });
    element.addEventListener("mouseleave", () => { element.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateZ(0)"; });
  }

  function prepare(root = document) {
    root.querySelectorAll("main > header, main > .brand, main > section, .location").forEach((element, index) => addEntrance(element, Math.min(index * 65, 260)));
    root.querySelectorAll(interactiveSelector).forEach(makeMagnetic);
    root.querySelectorAll("main figure.image, main figure.preview").forEach(makeTilt);
  }

  window.amicroLoading = (message) => `${message}<span class="pulse-dots" aria-label="处理中"><i></i><i></i><i></i></span>`;
  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "file" || !input.files?.length) return;
    const target = input.closest("label") || input.parentElement;
    if (target) target.classList.add("upload-complete");
  });
  new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
    if (node instanceof Element) prepare(node.parentElement || document);
  }))).observe(document.body, { childList: true, subtree: true });
  prepare();
})();

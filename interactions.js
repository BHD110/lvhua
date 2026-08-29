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
      const x = (event.clientX - rect.left - rect.width / 2) * .28;
      const y = (event.clientY - rect.top - rect.height / 2) * .28;
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
  const generateButton = document.querySelector("#generate");
  const heroStatus = document.querySelector("#status");
  const reframeStatus = document.querySelector("#result");
  if (generateButton && heroStatus) {
    generateButton.onclick = () => {
      heroStatus.innerHTML = window.amicroLoading("正在组合你的旅途画面");
      window.setTimeout(() => { heroStatus.textContent = "画面已准备好，可以继续调整照片"; }, 750);
    };
  }
  if (generateButton && reframeStatus) {
    generateButton.onclick = () => {
      generateButton.disabled = true;
      generateButton.textContent = "正在生成";
      reframeStatus.innerHTML = window.amicroLoading("旅画正在整理这段旅途的色彩与记忆");
      window.setTimeout(() => {
        generateButton.disabled = false;
        generateButton.textContent = "再次生成";
        reframeStatus.textContent = "画面已准备完成";
      }, 1100);
    };
  }
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

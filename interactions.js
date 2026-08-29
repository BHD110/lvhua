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

  function replaceBrandText() {
    document.querySelectorAll(".brand").forEach((brand) => {
      if (brand.dataset.brandLogo) return;
      brand.dataset.brandLogo = "true";
      brand.classList.add("brand-logo");
      const homeLink = document.createElement("a");
      homeLink.href = "index.html";
      homeLink.setAttribute("aria-label", "返回首页");
      const logo = document.createElement("img");
      logo.src = "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images/%E7%B4%A0%E6%9D%90/logo.png";
      logo.alt = "旅画";
      homeLink.append(logo);
      brand.replaceChildren(homeLink);
    });
  }

  function addExampleButton(anchor, imagePath, input) {
    if (!anchor || anchor.parentElement?.querySelector(`.example-upload[data-example="${imagePath}"]`)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "example-upload";
    button.dataset.example = imagePath;
    button.textContent = "使用示例图片";
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const response = await fetch(imagePath);
        if (!response.ok) throw new Error("示例图片暂时无法读取。");
        const blob = await response.blob();
        const transfer = new DataTransfer();
        transfer.items.add(new File([blob], imagePath.split("/").pop(), { type: blob.type || "image/jpeg" }));
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      } catch (error) {
        const status = document.querySelector("#status, #result");
        if (status) status.textContent = error instanceof Error ? error.message : "示例图片正在准备中。";
      } finally {
        button.disabled = false;
      }
    });
    anchor.insertAdjacentElement("afterend", button);
  }

  function loadImageGenerator() {
    if (window.GptImage2) return Promise.resolve();
    if (window.amicroImageGenerator) return window.amicroImageGenerator;
    window.amicroImageGenerator = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "gpt-image-2-generator.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("生图组件暂时无法加载。"));
      document.head.append(script);
    });
    return window.amicroImageGenerator;
  }

  function attachGenerator(button, status, preview, getImages, prompt, aspectRatio, readyLabel) {
    let generator;
    button.onclick = async () => {
      const images = getImages();
      if (!images.length) {
        status.textContent = "请先上传图片或使用示例图片";
        return;
      }
      button.disabled = true;
      button.textContent = "正在生成";
      status.innerHTML = window.amicroLoading("正在生成画面，通常约需 1 分钟");
      try {
        await loadImageGenerator();
        if (!generator) {
          generator = window.GptImage2.create({ prompt, aspectRatio });
          generator.addEventListener("generated", (event) => {
            preview.src = event.detail.images[0];
            preview.alt = readyLabel;
            button.disabled = false;
            button.textContent = "再次生成";
            status.textContent = "画面已生成";
            preview.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          generator.addEventListener("generationerror", (event) => {
            button.disabled = false;
            button.textContent = "再次生成";
            status.textContent = event.detail.message;
          });
        }
        generator.setReferenceImages(images);
        await generator.generate();
      } catch (error) {
        button.disabled = false;
        button.textContent = "再次生成";
        status.textContent = error instanceof Error ? error.message : "图片生成正在准备中。";
      }
    };
  }

  function enhanceReframePage() {
    const input = document.querySelector("#file");
    if (!input) return;
    const pick = document.querySelector("label.pick");
    addExampleButton(pick?.parentElement || pick, "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images/%E7%B4%A0%E6%9D%90/%E5%BA%9F%E7%89%87mock/%E5%BA%9F%E7%89%87.jpg", input);
    const button = document.querySelector("#generate");
    const status = document.querySelector("#result");
    const preview = document.querySelector("#preview");
    if (button && status && preview) attachGenerator(button, status, preview, () => Array.from(input.files), "将参考旅行照片整理成一张具有电影感的旅拍画面，保留原有地点、主体与构图特征，光线自然，画面细节清晰。", "4:3", "生成的旅画");
  }

  function enhanceHeroPage() {
    const peopleInput = document.querySelector("#peopleInput");
    const placeInput = document.querySelector("#placeInput");
    if (!peopleInput || !placeInput) return;
    addExampleButton(document.querySelector('[data-input="peopleInput"]'), "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images/%E7%B4%A0%E6%9D%90/%E4%B8%BB%E8%A7%92mock/%E4%BA%BA%E7%89%A9.jpg", peopleInput);
    addExampleButton(document.querySelector('[data-input="placeInput"]'), "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images/%E7%B4%A0%E6%9D%90/%E4%B8%BB%E8%A7%92mock/%E9%A3%8E%E6%99%AF1.jpg", placeInput);
    const button = document.querySelector("#generate");
    const status = document.querySelector("#status");
    const preview = document.querySelector(".preview img");
    if (button && status && preview) attachGenerator(button, status, preview, () => [...peopleInput.files, ...placeInput.files], "以人物照片和风景照片为参考，生成一张人物融入旅行地点的电影感旅拍画面。保留人物五官、服装与姿态特征，地点清晰自然，光线柔和，画面细节丰富。", "16:9", "生成的主角画面");
  }

  function enhanceFootprintPage() {
    const personInput = document.querySelector("#person-file");
    const locations = document.querySelector("#locations");
    const preview = document.querySelector(".preview img");
    if (!personInput || !locations || !preview) return;
    addExampleButton(personInput.closest("label"), "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images/%E7%B4%A0%E6%9D%90/%E8%B6%B3%E8%BF%B9%E5%9B%BEmock/%E4%BA%BA%E7%89%A9-%E4%B8%BB%E5%BD%A2%E8%B1%A1.jpg", personInput);
    const placeExamples = [
      ["黄果树大瀑布", "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images/%E7%B4%A0%E6%9D%90/%E8%B6%B3%E8%BF%B9%E5%9B%BEmock/%E6%99%AF%E5%8C%BA-%E9%BB%84%E6%9E%9C%E6%A0%91%E5%A4%A7%E7%80%91%E5%B8%83.jpg"],
      ["黔灵山公园", "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images/%E7%B4%A0%E6%9D%90/%E8%B6%B3%E8%BF%B9%E5%9B%BEmock/%E6%99%AF%E5%8C%BA-%E9%BB%94%E7%81%B5%E5%B1%B1%E5%85%AC%E5%9B%AD.jpg"],
      ["青云市集", "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images/%E7%B4%A0%E6%9D%90/%E8%B6%B3%E8%BF%B9%E5%9B%BEmock/%E6%99%AF%E5%8C%BA-%E9%9D%92%E4%BA%91%E5%B8%82%E9%9B%86.jpg"],
      ["西江千户苗寨", "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images/%E7%B4%A0%E6%9D%90/%E8%B6%B3%E8%BF%B9%E5%9B%BEmock/%E6%99%AF%E5%8C%BA-%E8%A5%BF%E6%B1%9F%E5%8D%83%E6%88%B7%E8%8B%97%E5%AF%A8.jpg"],
    ];
    const addButton = document.querySelector("#add-location");
    const exampleButton = document.createElement("button");
    exampleButton.type = "button";
    exampleButton.className = "example-upload";
    exampleButton.textContent = "使用示例足迹";
    addButton?.insertAdjacentElement("afterend", exampleButton);
    exampleButton.addEventListener("click", async () => {
      exampleButton.disabled = true;
      try {
        locations.replaceChildren();
        const rows = placeExamples.map(([name]) => window.addFootprintLocation(name));
        await Promise.all(rows.map(async (row, index) => {
          const [, imagePath] = placeExamples[index];
          const response = await fetch(imagePath);
          if (!response.ok) throw new Error("示例足迹图片暂时无法读取。");
          const blob = await response.blob();
          const transfer = new DataTransfer();
          transfer.items.add(new File([blob], imagePath.split("/").pop(), { type: blob.type || "image/jpeg" }));
          const input = row.querySelector('input[type="file"]');
          input.files = transfer.files;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }));
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : "示例足迹正在准备中。";
      } finally {
        exampleButton.disabled = false;
      }
    });
    const side = document.querySelector(".side");
    const button = document.createElement("button");
    button.type = "button";
    button.id = "generate-footprint";
    button.className = "action footprint-generate";
    button.textContent = "生成足迹海报";
    const status = document.createElement("p");
    status.className = "generation-status";
    status.setAttribute("aria-live", "polite");
    side.append(button, status);
    attachGenerator(button, status, preview, () => [ ...personInput.files, ...Array.from(locations.querySelectorAll('input[type="file"]')).flatMap((input) => Array.from(input.files)) ], "以人物照片和旅行地点照片为参考，生成一张竖版旅行足迹海报。保留人物形象与地点标志性景观，排版具有旅行记录感，画面清晰自然。", "3:4", "生成的足迹海报");
  }

  enhanceReframePage();
  enhanceHeroPage();
  enhanceFootprintPage();

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
  document.querySelector("#person-file")?.closest("label")?.classList.add("person-upload");
  replaceBrandText();
  prepare();
})();

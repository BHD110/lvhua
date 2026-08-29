(() => {
  // 动画默认始终运行；仅在 URL 带 ?motion-off 时尊重系统的"减弱动态效果"设置
  const respectSystemReducedMotion = new URLSearchParams(location.search).has("motion-off");
  const reducedMotion = respectSystemReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) document.documentElement.classList.add("motion-off");
  const interactiveSelector = "button, a.generate, label.pick, label.action, label.upload";
  const PROMPTS = Object.freeze({
    reframe: "将第1张参考照片转化为一张高品质竖版旅行艺术海报，精致混搭媒介旅行拼贴风格。整张画面以古旧象牙色手工纸为底衬，纸张带细微植物纤维、岁月斑点和自然泛黄旧化纹理。画面上半部保留大量雅致留白，叠加炭灰色建筑蓝图线稿与克制的褪色朱砂红色竖向工程制图线条，像古旧图纸上印出的建筑测绘稿。画面下半部通过一个边缘自然撕裂、露出粗纤维毛边的有机纸窗，框住第1张参考图中的原始场景：完整保留照片的构图、光影和照片质感，转为电影感实景效果。整体带细腻不完美的活版印刷颗粒感，色调以柔和炭灰、老木棕、象牙白、暖红点缀和砖红为主。右下角点缀一枚朱砂红色圆形印章拓印痕迹。竖构图 9:16，画廊级海报质感，细节清晰锐利，无 logo、无水印、无可读文字。",
    hero: "根据上传的人物肖像自动生成一张收藏版史诗叙事打卡纪念海报：巨大的人物剪影作为外轮廓，剪影内部自动生长出完整世界观、标志性场景、象征符号、关键建筑、风物、道具与氛围（贵州旅行打卡主题）。整体不是普通拼贴，而是高级剪影轮廓填充式叙事合成，带有双重曝光式联想，电影海报与梦幻水彩插画融合风格；柔和空气透视，轻雾化过渡，纸张颗粒，边缘飞白与刷痕，大面积留白，版式克制高级，安静、宏大、神圣、怀旧、诗意、旅途传说感。风格、色彩、场景、材质全部根据贵州旅行主题自动适配，剪影内的风景元素由上传的参考图决定。所有元素必须强绑定贵州地域气质，一眼识别，画面整洁有序，呈现高级叙事感与贵州旅行纪念感。人物穿日常旅行穿搭，整体自然、青春、有纪念感，生成人物样貌与第1张人物参考图高度相似。上传的前【人物图数量】张为人物参考图，人物保持一致性，五官、发型、肤色、服装与参考图贴合，主要生成自然侧颜。其余图片为贵州地点参考图，地点景观按上传顺序从上到下、由远及近自然排布并融合在人物剪影轮廓内部。每个地点元素在剪影内部各自占据一块区域，人物剪影与内部风景是绝对主体。整体仍然保持大面积留白和克制的版式。横构图 16:9，无 logo、无水印、无可读文字。",
    footprint: "一张竖版高级城市文旅海报，主题为【城市名】城市图鉴，旅行摄影与城市导览视觉风格，3:4 构图。第1张图片为人物实拍照，画面中心人物直接使用该人物，保持人物五官、发型、眼镜、服装、肤色和个人特征。人物自然融入城市街道或旅行地点中，呈现生活化旅行抓拍感，光影自然，材质细节清晰。第2张至最后一张图片为景区实拍原图，每张图片对应一个用户填写的地点名称。画面中为每个地点设置一张景区展示卡片，卡片照片直接使用对应参考图，完整呈现该地点的标志性景观。地点卡片按用户填写的地点顺序排列，每张卡片配对应地点名称，信息清晰可读。背景为【城市名】城市街景，自然 daylight、普通旅行摄影质感，天空淡蓝，光线明亮通透，画面干净现代。画面叠加精致的手机导航 APP 界面元素：人物脚下的定位箭头与路线指引虚线、半透明白色天气卡片、行程卡片、地标距离标注、小型线性图标，排版精致，像旅行攻略导航界面。顶部大标题写“【城市名】”，英文副标题写“【城市拼音】”。地点卡片名称使用用户填写的地点名，文字清晰可读、准确。整体色调固定为白、蓝、暖橙点缀，细节丰富，超高清。realistic city photography, authentic travel photo, travel app UI overlay, navigation interface, premium travel poster, natural daylight, no AI look, no digital painting, photojournalistic style",
  });
  const ASSET_BASE_URL = "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images-webp/";
  const assetUrl = (file) => `${ASSET_BASE_URL}${file.split("/").map(encodeURIComponent).join("/")}`;
  const EXAMPLES = Object.freeze({
    reframe: { input: assetUrl("素材/废片mock/废片.webp"), result: assetUrl("素材/废片mock/result.webp") },
    hero: {
      person: assetUrl("素材/主角mock/人物.webp"),
      places: ["风景1.webp", "风景2.webp", "风景3.webp"].map((file) => assetUrl(`素材/主角mock/${file}`)),
      result: assetUrl("素材/主角mock/result.webp"),
    },
    footprint: {
      person: assetUrl("素材/足迹图mock/人物-主形象.webp"),
      places: [["黄果树大瀑布", "景区-黄果树大瀑布.webp"], ["黔灵山公园", "景区-黔灵山公园.webp"], ["青云市集", "景区-青云市集.webp"], ["西江千户苗寨", "景区-西江千户苗寨.webp"]],
      result: assetUrl("素材/足迹图mock/result-海报-男生版6.webp"),
    },
  });
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
      if (element.classList.contains("button-surface")) return;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .12;
      const y = (event.clientY - rect.top - rect.height / 2) * .12;
      element.style.transform = `translate(${x}px, ${y}px)`;
    });
    element.addEventListener("mouseleave", () => { if (!element.classList.contains("button-surface")) element.style.transform = "translate(0, 0)"; });
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
      logo.src = "https://wuyoubucket.oss-cn-chengdu.aliyuncs.com/uploads/static-images-webp/logo-lotus.png";
      logo.alt = "旅画";
      homeLink.append(logo);
      brand.replaceChildren(homeLink);
    });
  }

  function addExampleButton(anchor, imagePath, input, onLoaded) {
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
        onLoaded?.(input.files);
      } catch (error) {
        const status = document.querySelector("#status, #result");
        if (status) status.textContent = error instanceof Error ? error.message : "示例图片正在准备中。";
      } finally {
        button.disabled = false;
      }
    });
    anchor.insertAdjacentElement("afterend", button);
  }

  async function fileFromUrl(imagePath) {
    const response = await fetch(imagePath);
    if (!response.ok) throw new Error("示例图片暂时无法读取。");
    const blob = await response.blob();
    return new File([blob], imagePath.split("/").pop(), { type: blob.type || "image/jpeg" });
  }

  function renderAlbum(container, filesOrUrls, label) {
    if (!container) return;
    container.replaceChildren(...Array.from(filesOrUrls || []).map((item, index) => {
      const image = document.createElement("img");
      image.src = typeof item === "string" ? item : URL.createObjectURL(item);
      image.alt = `${label}${index + 1}`;
      return image;
    }));
  }

  function renderLocationPreview(row, source) {
    let image = row.querySelector(".location-preview");
    if (!image) {
      image = document.createElement("img");
      image.className = "location-preview";
      image.alt = "地点预览";
      row.append(image);
    }
    image.src = typeof source === "string" ? source : URL.createObjectURL(source);
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

  function addDownloadLink(preview, imageUrl) {
    const figure = preview.closest("figure");
    if (!figure) return;
    let link = figure.querySelector(".generated-download");
    if (!link) {
      link = document.createElement("a");
      link.className = "generated-download";
      link.textContent = "下载图片";
      link.target = "_blank";
      link.rel = "noopener";
      figure.append(link);
    }
    link.href = imageUrl;
    link.download = "旅画生成图";
  }

  function attachGenerator(button, status, preview, getImages, getPrompt, aspectRatio, readyLabel, getExampleResult) {
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
      const exampleResult = getExampleResult?.();
      if (exampleResult) {
        window.setTimeout(() => {
          preview.src = exampleResult;
          preview.alt = readyLabel;
          addDownloadLink(preview, exampleResult);
          button.disabled = false;
          button.textContent = "再次生成";
          status.textContent = "示例画面已生成";
          preview.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60000);
        return;
      }
      try {
        await loadImageGenerator();
        if (!generator) {
          generator = window.GptImage2.create({ aspectRatio });
          generator.addEventListener("generated", (event) => {
            const imageUrl = event.detail.images[0];
            if (!imageUrl) {
              status.textContent = "图片链接正在准备中。";
              return;
            }
            preview.src = imageUrl;
            preview.alt = readyLabel;
            addDownloadLink(preview, imageUrl);
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
        generator.prompt = getPrompt();
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
    let usesExample = false;
    addExampleButton(pick?.parentElement || pick, EXAMPLES.reframe.input, input, () => { usesExample = true; });
    const button = document.querySelector("#generate");
    const status = document.querySelector("#result");
    const preview = document.querySelector("#preview");
    input.addEventListener("change", (event) => {
      if (event.isTrusted) usesExample = false;
      const file = input.files[0];
      if (!file) return;
      preview.src = URL.createObjectURL(file);
      preview.alt = "已上传的游客照预览";
    });
    if (button && status && preview) attachGenerator(button, status, preview, () => Array.from(input.files), () => PROMPTS.reframe, "9:16", "生成的旅画", () => usesExample ? EXAMPLES.reframe.result : "");
  }

  function enhanceHeroPage() {
    const peopleInput = document.querySelector("#peopleInput");
    const placeInput = document.querySelector("#placeInput");
    if (!peopleInput || !placeInput) return;
    let usesExample = false;
    const peopleAlbum = document.querySelector("#peopleAlbum");
    const placeAlbum = document.querySelector("#placeAlbum");
    const useExamples = document.createElement("button");
    useExamples.type = "button";
    useExamples.className = "example-upload";
    useExamples.textContent = "使用示例图片";
    placeInput.closest(".source")?.append(useExamples);
    useExamples.addEventListener("click", async () => {
      useExamples.disabled = true;
      try {
        const [person, ...places] = await Promise.all([EXAMPLES.hero.person, ...EXAMPLES.hero.places].map(fileFromUrl));
        const personTransfer = new DataTransfer();
        personTransfer.items.add(person);
        peopleInput.files = personTransfer.files;
        const placeTransfer = new DataTransfer();
        places.forEach((file) => placeTransfer.items.add(file));
        placeInput.files = placeTransfer.files;
        peopleInput.dispatchEvent(new Event("change", { bubbles: true }));
        placeInput.dispatchEvent(new Event("change", { bubbles: true }));
        usesExample = true;
      } catch (error) {
        const status = document.querySelector("#status");
        if (status) status.textContent = error instanceof Error ? error.message : "示例图片正在准备中。";
      } finally { useExamples.disabled = false; }
    });
    peopleInput.addEventListener("change", (event) => { if (event.isTrusted) usesExample = false; renderAlbum(peopleAlbum, peopleInput.files, "人物照片"); });
    placeInput.addEventListener("change", (event) => { if (event.isTrusted) usesExample = false; renderAlbum(placeAlbum, placeInput.files, "风景照片"); });
    const button = document.querySelector("#generate");
    const status = document.querySelector("#status");
    const preview = document.querySelector(".preview img");
    if (button && status && preview) attachGenerator(button, status, preview, () => [...peopleInput.files, ...placeInput.files], () => PROMPTS.hero.replace("【人物图数量】", String(peopleInput.files.length)), "16:9", "生成的主角画面", () => usesExample ? EXAMPLES.hero.result : "");
  }

  function enhanceFootprintPage() {
    const personInput = document.querySelector("#person-file");
    const locations = document.querySelector("#locations");
    const preview = document.querySelector(".preview img");
    if (!personInput || !locations || !preview) return;
    let usesExample = false;
    const personPreview = document.createElement("div");
    personPreview.className = "person-preview-stack";
    personInput.closest(".task")?.append(personPreview);
    personInput.addEventListener("change", (event) => { if (event.isTrusted) usesExample = false; renderAlbum(personPreview, personInput.files, "人物照片"); });
    addExampleButton(personInput.closest("label"), EXAMPLES.footprint.person, personInput, () => { usesExample = true; });
    const placeExamples = EXAMPLES.footprint.places;
    const addButton = document.querySelector("#add-location");
    const exampleButton = document.createElement("button");
    exampleButton.type = "button";
    exampleButton.className = "example-upload";
    exampleButton.textContent = "使用示例足迹";
    addButton?.insertAdjacentElement("afterend", exampleButton);
    exampleButton.addEventListener("click", async () => {
      exampleButton.disabled = true;
      try {
        const person = await fileFromUrl(EXAMPLES.footprint.person);
        const personTransfer = new DataTransfer();
        personTransfer.items.add(person);
        personInput.files = personTransfer.files;
        personInput.dispatchEvent(new Event("change", { bubbles: true }));
        locations.replaceChildren();
        const rows = placeExamples.map(([name]) => window.addFootprintLocation(name));
        await Promise.all(rows.map(async (row, index) => {
          const [, imagePath] = placeExamples[index];
          const file = await fileFromUrl(imagePath);
          const transfer = new DataTransfer();
          transfer.items.add(file);
          const input = row.querySelector('input[type="file"]');
          input.files = transfer.files;
          input.dispatchEvent(new Event("change", { bubbles: true }));
          renderLocationPreview(row, file);
        }));
        usesExample = true;
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : "示例足迹正在准备中。";
      } finally {
        exampleButton.disabled = false;
      }
    });
    locations.addEventListener("change", (event) => {
      const input = event.target;
      if (input instanceof HTMLInputElement && input.type === "file" && input.files[0]) {
        if (event.isTrusted) usesExample = false;
        renderLocationPreview(input.closest(".location"), input.files[0]);
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
    const getLocationRows = () => Array.from(locations.querySelectorAll(".location"));
    const getLocationNames = () => getLocationRows().map((row, index) => row.querySelector(".location-name")?.value.trim() || `地点${index + 1}`);
    const getLocationFiles = () => getLocationRows().flatMap((row) => Array.from(row.querySelector('input[type="file"]')?.files || []));
    const getFootprintPrompt = () => {
      const names = getLocationNames();
      const cityName = "贵州";
      return PROMPTS.footprint
        .replaceAll("【城市名】", cityName)
        .replaceAll("【城市拼音】", cityName.toUpperCase())
        .replace("每张卡片配对应地点名称，信息清晰可读。", `地点名称依次为：${names.join("、")}。每张卡片配对应地点名称，信息清晰可读。`);
    };
    attachGenerator(button, status, preview, () => [ ...personInput.files, ...getLocationFiles() ], getFootprintPrompt, "3:4", "生成的足迹海报", () => usesExample ? EXAMPLES.footprint.result : "");
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

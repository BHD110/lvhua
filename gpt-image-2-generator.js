(function () {
  const PRIMARY_API_BASE_URL = "https://www.maizitech.xyz/v1";
  const PRIMARY_API_KEY = "sk-dada04eb142e38ba3ed97d541e9e295c70af3eb7a064adf3";
  const FALLBACK_API_BASE_URL = "https://grsaiapi.com";
  const FALLBACK_API_KEY = "sk-3176dfb524134f288960f2517d15d7da";
  const POLL_INTERVAL_MS = 2000;
  const POLL_MAX_ATTEMPTS = 60;
  const REQUEST_TIMEOUT_MS = 20000;

  const ASPECT_RATIO_MAP = Object.freeze({
    auto: "auto", "1:1": "1024x1024", "16:9": "1672x941", "9:16": "941x1672",
    "4:3": "1443x1090", "3:4": "1090x1443", "3:2": "1536x1024", "2:3": "1024x1536",
    "5:4": "1408x1120", "4:5": "1120x1408", "21:9": "1920x832", "9:21": "832x1920",
    "1:2": "896x1792", "2:1": "1792x896", "3:1": "3:1", "1:3": "1:3",
  });

  const pause = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("参考图读取完成后即可再次提交。"));
      reader.readAsDataURL(file);
    });
  }

  async function toReferenceValue(image) {
    return typeof image === "string" ? image : readFile(image);
  }

  async function requestJson(url, apiKey, options) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...(options.headers || {}) },
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) return payload;
      throw new Error(payload.error?.message || payload.error || payload.detail || `接口状态码 ${response.status}`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw new Error("接口连接超过 20 秒，正在切换备用接口。");
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function normalizePrimaryTask(payload) {
    const value = Array.isArray(payload.data) ? payload.data[0] : payload.data || payload;
    const status = value.status || payload.status || "pending";
    return {
      taskId: value.task_id || value.id || payload.task_id || payload.id,
      status: ["completed", "succeeded"].includes(status) ? "succeeded" : ["failed", "violation", "cancelled", "canceled"].includes(status) ? "failed" : "running",
      images: value.result_urls || value.images || payload.result_urls || [],
      error: value.error_msg || value.error || payload.error_msg || payload.error,
    };
  }

  function normalizeFallbackTask(payload) {
    return { taskId: payload.id, status: payload.status || "failed", images: Array.isArray(payload.results) ? payload.results.map((item) => item.url).filter(Boolean) : [], error: payload.error };
  }

  async function pollPrimaryTask(taskId) {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
      await pause(POLL_INTERVAL_MS);
      const task = normalizePrimaryTask(await requestJson(`${PRIMARY_API_BASE_URL}/tasks/${encodeURIComponent(taskId)}`, PRIMARY_API_KEY, { method: "GET" }));
      if (task.status !== "running") return task;
    }
    return { status: "failed", images: [], error: "主接口任务仍在生成中，请稍后再次查看。" };
  }

  async function generateWithPrimary(prompt, images, aspectRatio) {
    const payload = await requestJson(`${PRIMARY_API_BASE_URL}/images/generations`, PRIMARY_API_KEY, {
      method: "POST",
      body: JSON.stringify({ model: "gpt-image-2", prompt, images, size: aspectRatio }),
    });
    let task = normalizePrimaryTask(payload);
    if (task.status === "running" && task.taskId) task = await pollPrimaryTask(task.taskId);
    if (task.status === "succeeded" && task.images.length) return task;
    throw new Error(task.error || "主接口任务正在处理中。");
  }

  async function pollFallbackTask(taskId) {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
      await pause(POLL_INTERVAL_MS);
      const task = normalizeFallbackTask(await requestJson(`${FALLBACK_API_BASE_URL}/v1/api/result?id=${encodeURIComponent(taskId)}`, FALLBACK_API_KEY, { method: "GET" }));
      if (task.status !== "running") return task;
    }
    return { status: "failed", images: [], error: "备用接口任务仍在生成中，请稍后再次查看。" };
  }

  async function generateWithFallback(prompt, images, aspectRatio) {
    const payload = await requestJson(`${FALLBACK_API_BASE_URL}/v1/api/generate`, FALLBACK_API_KEY, {
      method: "POST",
      body: JSON.stringify({ model: "gpt-image-2", prompt, images, aspectRatio: ASPECT_RATIO_MAP[aspectRatio] || aspectRatio, replyType: "json" }),
    });
    let task = normalizeFallbackTask(payload);
    if (task.status === "running" && task.taskId) task = await pollFallbackTask(task.taskId);
    if (task.status === "succeeded" && task.images.length) return task;
    throw new Error(task.error || "备用接口任务正在处理中。");
  }

  class GptImage2Generator extends HTMLElement {
    constructor() { super(); this.referenceImages = []; this.generatedImages = []; this.isGenerating = false; }

    connectedCallback() { if (this.dataset.ready) return; this.dataset.ready = "true"; this.render(); }

    get prompt() { return this.querySelector(".gpt-image-2-generator__prompt")?.value || this.getAttribute("prompt") || ""; }
    set prompt(value) { this.setAttribute("prompt", value || ""); const input = this.querySelector(".gpt-image-2-generator__prompt"); if (input) input.value = value || ""; }
    get aspectRatio() { return this.querySelector(".gpt-image-2-generator__ratio")?.value || this.getAttribute("aspect-ratio") || "1:1"; }
    set aspectRatio(value) { const nextValue = ASPECT_RATIO_MAP[value] ? value : "1:1"; this.setAttribute("aspect-ratio", nextValue); const input = this.querySelector(".gpt-image-2-generator__ratio"); if (input) input.value = nextValue; }

    setReferenceImages(images) { this.referenceImages = Array.from(images || []).slice(0, 9); this.updateReferenceHint(); }
    updateReferenceHint() { const hint = this.querySelector(".gpt-image-2-generator__hint"); if (hint) hint.textContent = this.referenceImages.length ? `已准备 ${this.referenceImages.length} 张参考图。` : "可以直接生成，也可以添加一张或多张参考图。"; }
    setStatus(message) { const status = this.querySelector(".gpt-image-2-generator__status"); if (status) status.textContent = window.amicroLoading ? window.amicroLoading(message) : message; }
    setGenerating(value) { this.isGenerating = value; const button = this.querySelector(".gpt-image-2-generator__button"); if (button) { button.disabled = value; button.textContent = value ? "图片生成中..." : this.getAttribute("button-label") || "生成图片"; } }

    renderResults(images) {
      const container = this.querySelector(".gpt-image-2-generator__results");
      if (container) container.replaceChildren(...images.map((url, index) => { const image = document.createElement("img"); image.className = "gpt-image-2-generator__result-image"; image.src = url; image.alt = `生成图片 ${index + 1}`; return image; }));
    }

    async generate() {
      if (this.isGenerating) return;
      const prompt = this.prompt.trim();
      if (prompt.length === 0) { this.setStatus("填写提示词后即可开始生成。"); return; }
      this.setGenerating(true);
      this.setStatus("正在通过主接口提交图片任务...");
      try {
        const images = await Promise.all(this.referenceImages.map(toReferenceValue));
        let task;
        try { task = await generateWithPrimary(prompt, images, this.aspectRatio); }
        catch (primaryError) { this.setStatus("主接口正在交接给备用接口..."); task = await generateWithFallback(prompt, images, this.aspectRatio); }
        this.generatedImages = task.images;
        this.renderResults(task.images);
        this.setStatus("图片已生成。");
        this.dispatchEvent(new CustomEvent("generated", { detail: { images: task.images } }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "图片任务已经收到，请稍后查看。";
        this.setStatus(message);
        this.dispatchEvent(new CustomEvent("generationerror", { detail: { message } }));
      } finally { this.setGenerating(false); }
    }

    render() {
      const ratio = ASPECT_RATIO_MAP[this.getAttribute("aspect-ratio")] ? this.getAttribute("aspect-ratio") : "1:1";
      const options = Object.keys(ASPECT_RATIO_MAP).map((value) => `<option value="${value}" ${value === ratio ? "selected" : ""}>${value}</option>`).join("");
      this.innerHTML = `<section class="gpt-image-2-generator"><label class="gpt-image-2-generator__field"><span class="gpt-image-2-generator__field-title">参考图</span><input class="gpt-image-2-generator__upload" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><p class="gpt-image-2-generator__hint"></p><label class="gpt-image-2-generator__field"><span class="gpt-image-2-generator__field-title">提示词</span><textarea class="gpt-image-2-generator__prompt" rows="4" placeholder="描述想要生成的画面"></textarea></label><label class="gpt-image-2-generator__field"><span class="gpt-image-2-generator__field-title">画面比例</span><select class="gpt-image-2-generator__ratio">${options}</select></label><button class="gpt-image-2-generator__button" type="button">${this.getAttribute("button-label") || "生成图片"}</button><p class="gpt-image-2-generator__status" aria-live="polite"></p><div class="gpt-image-2-generator__results" aria-label="生成结果"></div></section>`;
      this.prompt = this.getAttribute("prompt") || "";
      this.updateReferenceHint();
      this.querySelector(".gpt-image-2-generator__upload").addEventListener("change", (event) => this.setReferenceImages(event.target.files));
      this.querySelector(".gpt-image-2-generator__button").addEventListener("click", () => this.generate());
    }
  }

  window.GptImage2 = Object.freeze({ aspectRatios: ASPECT_RATIO_MAP, create(options) { const element = document.createElement("gpt-image-2-generator"); if (options?.prompt) element.prompt = options.prompt; if (options?.aspectRatio) element.aspectRatio = options.aspectRatio; if (options?.referenceImages) element.setReferenceImages(options.referenceImages); return element; } });
  customElements.define("gpt-image-2-generator", GptImage2Generator);
})();

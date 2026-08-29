(function () {
  const API_BASE_URL = "https://grsai.dakka.com.cn";
  const API_KEY = "sk-3176dfb524134f288960f2517d15d7da";
  const POLL_INTERVAL_MS = 1500;
  const POLL_MAX_ATTEMPTS = 40;

  const ASPECT_RATIO_MAP = Object.freeze({
    auto: "auto",
    "1:1": "1024x1024",
    "16:9": "1672x941",
    "9:16": "941x1672",
    "4:3": "1443x1090",
    "3:4": "1090x1443",
    "3:2": "1536x1024",
    "2:3": "1024x1536",
    "5:4": "1408x1120",
    "4:5": "1120x1408",
    "21:9": "1920x832",
    "9:21": "832x1920",
    "1:2": "896x1792",
    "2:1": "1792x896",
  });

  function pause(duration) {
    return new Promise((resolve) => window.setTimeout(resolve, duration));
  }

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

  async function readResponse(response) {
    const payload = await response.json().catch(() => ({}));
    return {
      taskId: payload.id,
      status: payload.status || "failed",
      images: Array.isArray(payload.results) ? payload.results.map((item) => item.url).filter(Boolean) : [],
      error: payload.error,
    };
  }

  class GptImage2Generator extends HTMLElement {
    constructor() {
      super();
      this.referenceImages = [];
      this.generatedImages = [];
      this.isGenerating = false;
    }

    connectedCallback() {
      if (this.dataset.ready) return;
      this.dataset.ready = "true";
      this.render();
    }

    get prompt() {
      return this.querySelector(".gpt-image-2-generator__prompt")?.value || this.getAttribute("prompt") || "";
    }

    set prompt(value) {
      this.setAttribute("prompt", value || "");
      const input = this.querySelector(".gpt-image-2-generator__prompt");
      if (input) input.value = value || "";
    }

    get aspectRatio() {
      return this.querySelector(".gpt-image-2-generator__ratio")?.value || this.getAttribute("aspect-ratio") || "1:1";
    }

    set aspectRatio(value) {
      const nextValue = ASPECT_RATIO_MAP[value] ? value : "1:1";
      this.setAttribute("aspect-ratio", nextValue);
      const input = this.querySelector(".gpt-image-2-generator__ratio");
      if (input) input.value = nextValue;
    }

    setReferenceImages(images) {
      this.referenceImages = Array.from(images || []);
      this.updateReferenceHint();
    }

    updateReferenceHint() {
      const hint = this.querySelector(".gpt-image-2-generator__hint");
      if (hint) {
        hint.textContent = this.referenceImages.length
          ? `已准备 ${this.referenceImages.length} 张参考图。`
          : "可以直接生成，也可以添加一张或多张参考图。";
      }
    }

    setStatus(message) {
      const status = this.querySelector(".gpt-image-2-generator__status");
      if (status) status.textContent = message;
    }

    setGenerating(value) {
      this.isGenerating = value;
      const button = this.querySelector(".gpt-image-2-generator__button");
      if (button) {
        button.disabled = value;
        button.textContent = value ? "图片生成中..." : this.getAttribute("button-label") || "生成图片";
      }
    }

    renderResults(images) {
      const container = this.querySelector(".gpt-image-2-generator__results");
      if (container) {
        container.replaceChildren(...images.map((url, index) => {
          const image = document.createElement("img");
          image.className = "gpt-image-2-generator__result-image";
          image.src = url;
          image.alt = `生成图片 ${index + 1}`;
          return image;
        }));
      }
    }

    async request(path, options) {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      const task = await readResponse(response);
      if (response.ok) return task;
      throw new Error(task.error || "图片服务已经返回任务信息，请检查后再次提交。");
    }

    async pollTask(taskId) {
      for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
        await pause(POLL_INTERVAL_MS);
        const task = await this.request(`/v1/api/result?id=${encodeURIComponent(taskId)}`, { method: "GET" });
        if (task.status !== "running") return task;
      }

      return { status: "running", images: [], error: "任务仍在生成中，稍后可以再次查看结果。" };
    }

    async generate() {
      if (this.isGenerating) return;

      const prompt = this.prompt.trim();
      if (prompt.length === 0) {
        this.setStatus("填写提示词后即可开始生成。");
        return;
      }

      this.setGenerating(true);
      this.setStatus("正在提交图片任务...");

      try {
        const images = await Promise.all(this.referenceImages.map(toReferenceValue));
        let task = await this.request("/v1/api/generate", {
          method: "POST",
          body: JSON.stringify({
            model: "gpt-image-2",
            prompt,
            images,
            aspectRatio: ASPECT_RATIO_MAP[this.aspectRatio] || ASPECT_RATIO_MAP["1:1"],
            replyType: "json",
          }),
        });

        if (task.status === "running" && task.taskId) {
          this.setStatus("图片正在生成...");
          task = await this.pollTask(task.taskId);
        }

        if (task.status === "succeeded" && task.images.length) {
          this.generatedImages = task.images;
          this.renderResults(task.images);
          this.setStatus("图片已生成。");
          this.dispatchEvent(new CustomEvent("generated", { detail: { images: task.images } }));
          return;
        }

        throw new Error(task.error || "图片任务正在处理中，可以稍后继续查看。");
      } catch (error) {
        const message = error instanceof Error ? error.message : "图片任务已经收到，请稍后查看。";
        this.setStatus(message);
        this.dispatchEvent(new CustomEvent("generationerror", { detail: { message } }));
      } finally {
        this.setGenerating(false);
      }
    }

    render() {
      const ratio = ASPECT_RATIO_MAP[this.getAttribute("aspect-ratio")] ? this.getAttribute("aspect-ratio") : "1:1";
      const options = Object.keys(ASPECT_RATIO_MAP)
        .map((value) => `<option value="${value}" ${value === ratio ? "selected" : ""}>${value}</option>`)
        .join("");

      this.innerHTML = `
        <section class="gpt-image-2-generator">
          <label class="gpt-image-2-generator__field">
            <span class="gpt-image-2-generator__field-title">参考图</span>
            <input class="gpt-image-2-generator__upload" type="file" accept="image/jpeg,image/png,image/webp" multiple>
          </label>
          <p class="gpt-image-2-generator__hint"></p>
          <label class="gpt-image-2-generator__field">
            <span class="gpt-image-2-generator__field-title">提示词</span>
            <textarea class="gpt-image-2-generator__prompt" rows="4" placeholder="描述想要生成的画面"></textarea>
          </label>
          <label class="gpt-image-2-generator__field">
            <span class="gpt-image-2-generator__field-title">画面比例</span>
            <select class="gpt-image-2-generator__ratio">${options}</select>
          </label>
          <button class="gpt-image-2-generator__button" type="button">${this.getAttribute("button-label") || "生成图片"}</button>
          <p class="gpt-image-2-generator__status" aria-live="polite"></p>
          <div class="gpt-image-2-generator__results" aria-label="生成结果"></div>
        </section>`;

      this.prompt = this.getAttribute("prompt") || "";
      this.updateReferenceHint();
      this.querySelector(".gpt-image-2-generator__upload").addEventListener("change", (event) => {
        this.setReferenceImages(event.target.files);
      });
      this.querySelector(".gpt-image-2-generator__button").addEventListener("click", () => this.generate());
    }
  }

  window.GptImage2 = Object.freeze({
    aspectRatios: ASPECT_RATIO_MAP,
    create(options) {
      const element = document.createElement("gpt-image-2-generator");
      if (options?.prompt) element.prompt = options.prompt;
      if (options?.aspectRatio) element.aspectRatio = options.aspectRatio;
      if (options?.referenceImages) element.setReferenceImages(options.referenceImages);
      return element;
    },
  });

  customElements.define("gpt-image-2-generator", GptImage2Generator);
})();

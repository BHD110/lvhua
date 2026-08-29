const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const apiBaseUrl = "https://www.maizitech.xyz/v1";
const apiKey = fs.readFileSync(path.join(__dirname, "生图key2.txt"), "utf8").trim();
const referenceImagePath = path.join(__dirname, "素材", "风格色彩参考.png");
const statusPath = path.join(__dirname, "新生图验证状态.json");
const outputPath = path.join(__dirname, "新API-生图验证结果.png");
const requestPath = path.join(__dirname, ".maizi-image-request.json");
const responsePath = path.join(__dirname, ".maizi-image-response.json");

const pause = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
const writeStatus = (status) => fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), "utf8");

function request(pathname, method, body) {
  if (body) fs.writeFileSync(requestPath, JSON.stringify(body), "utf8");
  const args = ["-sS", "--connect-timeout", "30", "--max-time", "180", "-o", responsePath, "-w", "%{http_code}", "-X", method, `${apiBaseUrl}${pathname}`, "-H", `Authorization: Bearer ${apiKey}`, "-H", "Content-Type: application/json"];
  if (body) args.push("--data-binary", `@${requestPath}`);
  const result = spawnSync("curl.exe", args, { encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr.trim() || "接口请求通道需要再次连接。");
  const payload = JSON.parse(fs.readFileSync(responsePath, "utf8"));
  if (result.stdout.trim().startsWith("2")) return payload;
  throw new Error(payload.error?.message || payload.error || payload.detail || `接口状态码 ${result.stdout.trim()}`);
}

function download(url) {
  const result = spawnSync("curl.exe", ["-sS", "--connect-timeout", "30", "--max-time", "180", "-o", outputPath, "-w", "%{http_code}", url], { encoding: "utf8", windowsHide: true });
  if (result.status !== 0 || !result.stdout.trim().startsWith("2")) throw new Error(`图片下载状态码 ${result.stdout.trim() || result.stderr.trim()}`);
}

async function main() {
  writeStatus({ stage: "submitting", model: "gpt-image-2", size: "9:16" });
  const base64 = fs.readFileSync(referenceImagePath).toString("base64");
  const created = request("/images/generations", "POST", {
    model: "gpt-image-2",
    prompt: "参考图片的暖白纸张、酒红文字和杂志排版风格，生成一张竖版旅行故事海报。画面包含柔和晨光中的山间步道、远处湖泊和一位背着小包的旅行者，留出清晰的标题区域，版面干净，细节丰富。",
    images: [`data:image/jpeg;base64,${base64}`],
    size: "9:16",
  });
  const taskId = created.data?.[0]?.task_id;
  if (!taskId) throw new Error("接口没有返回任务编号。");

  for (let attempt = 0; attempt < 60; attempt += 1) {
    writeStatus({ stage: "polling", taskId, attempt: attempt + 1 });
    await pause(2000);
    const task = request(`/tasks/${encodeURIComponent(taskId)}`, "GET");
    if (task.status === "completed") {
      const imageUrl = task.result_urls?.[0];
      if (!imageUrl) throw new Error("任务完成后没有图片链接。");
      download(imageUrl);
      writeStatus({ stage: "succeeded", taskId, imageUrl, outputPath });
      return;
    }
    if (["failed", "violation", "cancelled", "canceled"].includes(task.status)) throw new Error(task.error_msg || task.error || task.status);
  }

  throw new Error("图片任务仍在生成中。");
}

main().catch((error) => {
  writeStatus({ stage: "failed", error: error.message });
  process.exitCode = 1;
}).finally(() => {
  for (const filePath of [requestPath, responsePath]) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

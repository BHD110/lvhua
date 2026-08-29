const fs = require("fs");
const path = require("path");

const apiBaseUrl = "https://grsaiapi.com";
const apiKey = fs.readFileSync(path.join(__dirname, "生图key.txt"), "utf8").trim();
const referenceImagePath = "D:/xwechat_files/wxid_kjdqynimpcc222_5d96/temp/RWTemp/2026-08/0f8783cb4f9f1fdfd532f43f99b21785.jpg";
const statusPath = path.join(__dirname, "生图验证状态.json");
const outputPath = path.join(__dirname, "gpt-image-2-验证结果.png");

function writeStatus(status) {
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), "utf8");
}

function pause(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function request(pathname, options) {
  const response = await fetch(`${apiBaseUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(180000),
  });
  const payload = await response.json().catch(() => ({}));
  const task = {
    taskId: payload.id,
    status: payload.status || "failed",
    images: Array.isArray(payload.results) ? payload.results.map((item) => item.url).filter(Boolean) : [],
    error: payload.error,
  };

  if (response.ok) return task;
  throw new Error(task.error || `接口状态码 ${response.status}`);
}

async function getCompletedTask(task) {
  for (let attempt = 0; task.status === "running" && task.taskId && attempt < 40; attempt += 1) {
    writeStatus({ stage: "polling", attempt: attempt + 1, taskId: task.taskId, status: task.status });
    await pause(1500);
    task = await request(`/v1/api/result?id=${encodeURIComponent(task.taskId)}`, { method: "GET" });
  }
  return task;
}

async function main() {
  writeStatus({ stage: "submitting", aspectRatio: "9:16", resolution: "941x1672" });
  const referenceImage = fs.readFileSync(referenceImagePath).toString("base64");
  let task = await request("/v1/api/generate", {
    method: "POST",
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt: "以参考图中的人物为主角，生成一张竖版电影感户外人像写真。保留人物的五官、黑色长发、深色连衣裙、粉色条纹蝴蝶结衬衫、手持手机和蓝色耳机盒；以树林和柔和自然光为背景，画面干净，人物细节清晰。",
      images: [`data:image/jpeg;base64,${referenceImage}`],
      aspectRatio: "941x1672",
      replyType: "json",
    }),
  });

  task = await getCompletedTask(task);
  if (task.status !== "succeeded" || task.images.length === 0) {
    throw new Error(task.error || "图片任务仍在处理。");
  }

  const imageResponse = await fetch(task.images[0], { signal: AbortSignal.timeout(180000) });
  if (!imageResponse.ok) throw new Error(`图片下载状态码 ${imageResponse.status}`);
  fs.writeFileSync(outputPath, Buffer.from(await imageResponse.arrayBuffer()));
  writeStatus({ stage: "succeeded", taskId: task.taskId, imageUrl: task.images[0], outputPath });
}

main().catch((error) => {
  writeStatus({ stage: "failed", error: error.message });
  process.exitCode = 1;
});

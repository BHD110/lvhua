"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";

const EXAMPLE_IMAGE = "/assets/mock/废片mock/废片.jpg";
const EXAMPLE_RESULT = "/assets/mock/废片mock/result.jpg";
const EXAMPLE_WAIT_MS = 60_000;

export default function ReframePage() {
  const [preview, setPreview] = useState("/assets/废片图.png");
  const [name, setName] = useState("当前预览：示例照片");
  const [message, setMessage] = useState("");
  const [usingExample, setUsingExample] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setName(`已选择：${file.name}`);
    setUsingExample(false);
    setMessage("");
    setResult("");
  }

  async function useExample() {
    const response = await fetch(EXAMPLE_IMAGE);
    const file = new File([await response.blob()], "废片.jpg", { type: "image/jpeg" });
    setPreview(URL.createObjectURL(file));
    setName(`已选择：${file.name}`);
    setUsingExample(true);
    setMessage("示例图片已上传，可以开始生成。");
    setResult("");
  }

  function generate() {
    if (isGenerating) return;
    if (!usingExample) {
      setMessage("图片已准备好，生成结果会在这里展示。");
      return;
    }
    setIsGenerating(true);
    setMessage("正在生成旅画，预计约 1 分钟完成。");
    window.setTimeout(() => {
      setResult(EXAMPLE_RESULT);
      setMessage("旅画已生成。");
      setIsGenerating(false);
    }, EXAMPLE_WAIT_MS);
  }

  return <main className="tool-page reframe-page"><header className="tool-header"><Link href="/">旅画</Link><span>组件生成</span></header><section className="reframe-tool"><figure className="reframe-preview"><img src={preview} alt="照片预览" /></figure><div className="tool-copy"><p className="tool-kicker">02</p><h1>让旅行照片<span>重新发光</span></h1><p>上传一张照片，为这段旅途准备新的画面。</p><label className="upload-control"><span>选择图片</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} /><small>{name}</small></label><button className="example-button" type="button" onClick={useExample}>使用示例图片</button><button className="primary-button" disabled={isGenerating} onClick={generate}>{isGenerating ? "正在生成" : "生成旅画"}</button><p className="tool-status" aria-live="polite">{message}</p>{result && <img className="generated-result generated-result-portrait" src={result} alt="生成的旅画" />}</div></section></main>;
}

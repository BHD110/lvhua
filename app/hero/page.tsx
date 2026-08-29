"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";

const MOCK_ROOT = "/assets/mock/主角mock";
const EXAMPLE_WAIT_MS = 60_000;

function Upload({ label, exampleSrc, exampleName, onSelect, onExample }: { label: string; exampleSrc: string; exampleName: string; onSelect: (value: string) => void; onExample: () => void }) {
  const [name, setName] = useState("");
  async function handleExample() {
    const response = await fetch(exampleSrc);
    const file = new File([await response.blob()], exampleName, { type: "image/jpeg" });
    setName(file.name);
    onSelect(URL.createObjectURL(file));
    onExample();
  }
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setName(file.name);
    onSelect(URL.createObjectURL(file));
  }
  return <div className="upload-actions"><label className="upload-control"><span>{label}</span><input type="file" accept="image/*" onChange={handleChange} />{name && <small>{name}</small>}</label><button className="example-button" type="button" onClick={handleExample}>使用示例图片</button></div>;
}

export default function HeroPage() {
  const [person, setPerson] = useState("/assets/主角页面/人物图1.jpg");
  const [place, setPlace] = useState("/assets/主角页面/风景图1.jpg");
  const [hasExamplePerson, setHasExamplePerson] = useState(false);
  const [hasExamplePlace, setHasExamplePlace] = useState(false);
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  function markExample(type: "person" | "place") { if (type === "person") setHasExamplePerson(true); else setHasExamplePlace(true); setMessage("示例图片已上传，可以开始生成。"); setResult(""); }
  function generate() {
    if (isGenerating) return;
    if (!(hasExamplePerson && hasExamplePlace)) { setMessage("人物和风景图片已准备好，生成结果会在这里展示。"); return; }
    setIsGenerating(true);
    setMessage("正在生成主角画面，预计约 1 分钟完成。");
    window.setTimeout(() => { setResult(`${MOCK_ROOT}/result.png`); setMessage("主角画面已生成。"); setIsGenerating(false); }, EXAMPLE_WAIT_MS);
  }
  return <main className="tool-page"><header className="tool-header"><Link href="/">旅画</Link><span>主角生成</span></header><section className="hero-tool"><div className="tool-copy"><p className="tool-kicker">01</p><h1>拼出你的<span>主角画面</span></h1><p>选择人物照片和风景照片，准备一张属于这段旅途的画面。</p></div><figure className="wide-preview"><img src="/assets/主角页面/预览图.jpg" alt="主角生成预览" /></figure></section><section className="source-pair" aria-label="图片选择"><div className="source-panel"><h2>人物照片</h2><img src={person} alt="人物照片预览" /><Upload label="上传人物照片" exampleSrc={`${MOCK_ROOT}/0a4593507222e4c958f7023b7ce4a12b.jpg`} exampleName="人物示例.jpg" onSelect={(value) => { setPerson(value); setHasExamplePerson(false); setResult(""); }} onExample={() => markExample("person")} /></div><span className="plus" aria-hidden="true">+</span><div className="source-panel"><h2>风景照片</h2><img src={place} alt="风景照片预览" /><Upload label="上传风景照片" exampleSrc={`${MOCK_ROOT}/35b1a913f54ff26da8b11b162ae3c025.jpg`} exampleName="风景示例.jpg" onSelect={(value) => { setPlace(value); setHasExamplePlace(false); setResult(""); }} onExample={() => markExample("place")} /></div></section><button className="primary-button" disabled={isGenerating} onClick={generate}>{isGenerating ? "正在生成" : "生成主角画面"}</button><p className="tool-status" aria-live="polite">{message}</p>{result && <img className="generated-result" src={result} alt="生成的主角画面" />}</main>;
}

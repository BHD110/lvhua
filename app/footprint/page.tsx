"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";

const MOCK_ROOT = "/assets/mock/足迹图mock";
const EXAMPLE_PLACES = ["景区-黄果树大瀑布.jpg", "景区-黔灵山公园.jpg", "景区-青云市集.jpg", "景区-西江千户苗寨.jpg"];
const EXAMPLE_WAIT_MS = 60_000;

export default function FootprintPage() {
  const [places, setPlaces] = useState(["选择定位 1", "选择定位 2"]);
  const [personName, setPersonName] = useState("选择一张人物照片");
  const [personPreview, setPersonPreview] = useState("");
  const [hasExamplePlaces, setHasExamplePlaces] = useState(false);
  const [hasExamplePerson, setHasExamplePerson] = useState(false);
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  function addPlace() { setPlaces((current) => [...current, `选择定位 ${current.length + 1}`]); }
  function choosePerson(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) { setPersonName(`已选择：${file.name}`); setPersonPreview(URL.createObjectURL(file)); setHasExamplePerson(false); setResult(""); } }
  async function usePlaceExamples() { await Promise.all(EXAMPLE_PLACES.map((name) => fetch(`${MOCK_ROOT}/${name}`))); setPlaces(EXAMPLE_PLACES.map((name) => name.replace("景区-", ""))); setHasExamplePlaces(true); setResult(""); setMessage("4 张景区示例图片已上传，可以开始生成。"); }
  async function usePersonExample() { const response = await fetch(`${MOCK_ROOT}/人物-主形象.jpg`); const file = new File([await response.blob()], "人物-主形象.jpg", { type: "image/jpeg" }); setPersonName(`已选择：${file.name}`); setPersonPreview(URL.createObjectURL(file)); setHasExamplePerson(true); setResult(""); setMessage("人物示例图片已上传，可以开始生成。"); }
  function generate() { if (isGenerating) return; if (!(hasExamplePlaces && hasExamplePerson)) { setMessage("足迹和人物图片已准备好，生成结果会在这里展示。"); return; } setIsGenerating(true); setMessage("正在生成足迹卡片，预计约 1 分钟完成。"); window.setTimeout(() => { setResult(`${MOCK_ROOT}/result-海报-男生版6.jpg`); setMessage("足迹卡片已生成。"); setIsGenerating(false); }, EXAMPLE_WAIT_MS); }
  return <main className="tool-page footprint-page"><header className="tool-header"><Link href="/">旅画</Link><span>卡片页面</span></header><section className="footprint-tool"><figure className="footprint-preview"><img src="/assets/足迹图.jpg" alt="足迹卡片预览" /></figure><div className="tool-copy"><p className="tool-kicker">03</p><h1>生成<span>我的足迹</span></h1><div className="place-list"><h2>足迹上传</h2><p>添加想要记录的地点与照片</p>{places.map((place) => <div className="place-row" key={place}>{place}<label>上传照片<input type="file" accept="image/*" /></label></div>)}<button className="secondary-button" onClick={addPlace}>添加定位</button><button className="example-button" type="button" onClick={usePlaceExamples}>使用示例图片</button></div><div className="upload-actions"><label className="upload-control"><span>人物上传</span><input type="file" accept="image/*" onChange={choosePerson} /><small>{personName}</small></label><button className="example-button" type="button" onClick={usePersonExample}>使用示例图片</button></div>{personPreview && <img className="person-preview" src={personPreview} alt="人物照片预览" />}<button className="primary-button" disabled={isGenerating} onClick={generate}>{isGenerating ? "正在生成" : "生成足迹卡片"}</button><p className="tool-status" aria-live="polite">{message}</p>{result && <img className="generated-result generated-result-portrait" src={result} alt="生成的足迹卡片" />}</div></section></main>;
}

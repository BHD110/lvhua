"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";

export default function ReframePage() {
  const [preview, setPreview] = useState("/assets/废片图.png");
  const [name, setName] = useState("当前预览：示例照片");
  const [message, setMessage] = useState("");
  function chooseFile(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) { setPreview(URL.createObjectURL(file)); setName(`已选择：${file.name}`); setMessage(""); } }
  return <main className="tool-page reframe-page"><header className="tool-header"><Link href="/">旅画</Link><span>组件生成</span></header><section className="reframe-tool"><figure className="reframe-preview"><img src={preview} alt="照片预览" /></figure><div className="tool-copy"><p className="tool-kicker">02</p><h1>让旅行照片<span>重新发光</span></h1><p>上传一张照片，为这段旅途准备新的画面。</p><label className="upload-control"><span>选择图片</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} /><small>{name}</small></label><button className="primary-button" onClick={() => setMessage("旅画正在整理这段旅途的色彩与记忆。")}>生成旅画</button><p className="tool-status" aria-live="polite">{message}</p></div></section></main>;
}

"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";

function Upload({ label, onSelect }: { label: string; onSelect: (value: string) => void }) {
  const [name, setName] = useState("");
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setName(file.name);
    onSelect(URL.createObjectURL(file));
  }
  return <label className="upload-control"><span>{label}</span><input type="file" accept="image/*" onChange={handleChange} />{name && <small>{name}</small>}</label>;
}

export default function HeroPage() {
  const [person, setPerson] = useState("/assets/主角页面/人物图1.jpg");
  const [place, setPlace] = useState("/assets/主角页面/风景图1.jpg");
  const [message, setMessage] = useState("");
  return <main className="tool-page"><header className="tool-header"><Link href="/">旅画</Link><span>主角生成</span></header><section className="hero-tool"><div className="tool-copy"><p className="tool-kicker">01</p><h1>拼出你的<span>主角画面</span></h1><p>选择人物照片和风景照片，准备一张属于这段旅途的画面。</p></div><figure className="wide-preview"><img src="/assets/主角页面/预览图.jpg" alt="主角生成预览" /></figure></section><section className="source-pair" aria-label="图片选择"><div className="source-panel"><h2>人物照片</h2><img src={person} alt="人物照片预览" /><Upload label="上传人物照片" onSelect={setPerson} /></div><span className="plus" aria-hidden="true">+</span><div className="source-panel"><h2>风景照片</h2><img src={place} alt="风景照片预览" /><Upload label="上传风景照片" onSelect={setPlace} /></div></section><button className="primary-button" onClick={() => setMessage("画面已经准备好，可以继续调整照片。")}>生成主角画面</button><p className="tool-status" aria-live="polite">{message}</p></main>;
}

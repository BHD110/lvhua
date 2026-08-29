"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";

export default function FootprintPage() {
  const [places, setPlaces] = useState(["选择定位 1", "选择定位 2"]);
  const [personName, setPersonName] = useState("选择一张人物照片");
  const [message, setMessage] = useState("");
  function addPlace() { setPlaces((current) => [...current, `选择定位 ${current.length + 1}`]); }
  function choosePerson(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) setPersonName(`已选择：${file.name}`); }
  return <main className="tool-page footprint-page"><header className="tool-header"><Link href="/">旅画</Link><span>卡片页面</span></header><section className="footprint-tool"><figure className="footprint-preview"><img src="/assets/足迹图.jpg" alt="足迹卡片预览" /></figure><div className="tool-copy"><p className="tool-kicker">03</p><h1>生成<span>我的足迹</span></h1><div className="place-list"><h2>足迹上传</h2><p>添加想要记录的地点与照片</p>{places.map((place) => <div className="place-row" key={place}>{place}<label>上传照片<input type="file" accept="image/*" /></label></div>)}<button className="secondary-button" onClick={addPlace}>添加定位</button></div><label className="upload-control"><span>人物上传</span><input type="file" accept="image/*" onChange={choosePerson} /><small>{personName}</small></label><button className="primary-button" onClick={() => setMessage("足迹卡片已经准备完成。")}>生成足迹卡片</button><p className="tool-status" aria-live="polite">{message}</p></div></section></main>;
}

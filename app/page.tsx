import Link from "next/link";

const scenes = [
  {
    id: "hero",
    className: "scene scene-hero",
    imageClassName: "hero-image",
    src: "/images/hero.jpg",
    alt: "旅画主角预览",
    title: "来时是游客，走时是主角",
    index: "01",
    href: "/hero",
    action: "生成主角画面",
  },
  {
    id: "reframe",
    className: "scene scene-reframe",
    imageClassName: "reframe-image",
    src: "/images/reframe.png",
    alt: "旅游废片转化预览",
    title: "人人都能把旅游废片变大片",
    index: "02",
    href: "/reframe",
    action: "生成旅画",
  },
  {
    id: "footprint",
    className: "scene scene-footprint",
    imageClassName: "footprint-image",
    src: "/images/footprint.jpg",
    alt: "旅行足迹卡片预览",
    title: "看得见，结果可以带走",
    index: "03",
    href: "/footprint",
    action: "生成足迹卡片",
  },
];

export default function Home() {
  return (
    <main>
      <header className="brand-header">
        <p className="brand">旅画</p>
        <span className="brand-rule" aria-hidden="true" />
      </header>

      <div className="gallery">
        {scenes.map((scene) => (
          <section className={scene.className} key={scene.id} aria-labelledby={`${scene.id}-title`}>
            <div className="scene-number" aria-hidden="true">{scene.index}</div>
            <div className="image-frame">
              <img className={scene.imageClassName} src={scene.src} alt={scene.alt} />
            </div>
            <h1 id={`${scene.id}-title`}>{scene.title}</h1>
            <Link className="generate-link" href={scene.href}>
              {scene.action}
            </Link>
          </section>
        ))}
      </div>
    </main>
  );
}

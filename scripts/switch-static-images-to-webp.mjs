import { readFile, writeFile } from 'node:fs/promises';

const endpoint = process.env.ALIYUN_OSS_ENDPOINT.replace(/^https?:\/\//, '').replace(/\/$/, '');
const base = `https://${process.env.ALIYUN_OSS_BUCKET}.${endpoint}`;
const prefix = (process.env.ALIYUN_OSS_PREFIX ?? 'uploads/').replace(/^\/+|\/+$/g, '');
const files = [
  '素材/足迹图.jpg', '素材/主角图.jpg', '素材/废片图.png', '素材/logo.png',
  '素材/主角页面/预览图.jpg', '素材/主角页面/人物图1.jpg', '素材/主角页面/人物图2.jpg',
  '素材/主角页面/风景图1.jpg', '素材/主角页面/风景图2.jpg', '素材/主角页面/风景图3.jpg',
  '素材/废片mock/废片.jpg', '素材/废片mock/result.jpg',
  '素材/主角mock/人物.jpg', '素材/主角mock/风景1.jpg', '素材/主角mock/风景2.jpg', '素材/主角mock/风景3.jpg', '素材/主角mock/result.png',
  '素材/足迹图mock/人物-主形象.jpg', '素材/足迹图mock/景区-黄果树大瀑布.jpg',
  '素材/足迹图mock/景区-黔灵山公园.jpg', '素材/足迹图mock/景区-青云市集.jpg',
  '素材/足迹图mock/景区-西江千户苗寨.jpg', '素材/足迹图mock/result-海报-男生版6.jpg',
];
const url = (directory, path) => `${base}/${[prefix, directory, path].filter(Boolean).join('/').split('/').map(encodeURIComponent).join('/')}`;
const targets = ['index.html', 'footprint.html', 'hero.html', 'reframe.html', 'image-generator-demo.html', 'interactions.js'];

for (const target of targets) {
  let content = await readFile(target, 'utf8');
  for (const file of files) {
    const webp = file.replace(/\.[^.]+$/, '.webp');
    content = content.split(url('static-images', file)).join(url('static-images-webp', webp));
  }
  await writeFile(target, content, 'utf8');
}

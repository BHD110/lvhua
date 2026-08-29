import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const files = [
  '素材/足迹图.jpg', '素材/主角图.jpg', '素材/废片图.png', '素材/logo.png',
  '素材/主角页面/预览图.jpg', '素材/主角页面/人物图1.jpg', '素材/主角页面/人物图2.jpg',
  '素材/主角页面/风景图1.jpg', '素材/主角页面/风景图2.jpg', '素材/主角页面/风景图3.jpg',
  '素材/废片mock/废片.jpg', '素材/主角mock/人物.jpg', '素材/主角mock/风景1.jpg',
  '素材/足迹图mock/人物-主形象.jpg', '素材/足迹图mock/景区-黄果树大瀑布.jpg',
  '素材/足迹图mock/景区-黔灵山公园.jpg', '素材/足迹图mock/景区-青云市集.jpg',
  '素材/足迹图mock/景区-西江千户苗寨.jpg',
];

function convert(source, target) {
  return new Promise((resolvePromise, reject) => {
    const process = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', source, '-vf', "scale='min(1920,iw)':-2:force_original_aspect_ratio=decrease", '-c:v', 'libwebp', '-quality', '78', '-compression_level', '6', target], { stdio: 'inherit' });
    process.on('error', reject);
    process.on('close', (code) => code === 0 ? resolvePromise() : reject(new Error(`图片压缩失败: ${source}`)));
  });
}

for (const file of files) {
  const webp = file.replace(/\.[^.]+$/, '.webp');
  const target = resolve('compressed-assets/static-images', webp);
  await mkdir(dirname(target), { recursive: true });
  await convert(resolve(file), target);
  console.log(`已压缩: ${file}`);
}

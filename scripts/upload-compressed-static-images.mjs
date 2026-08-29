import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import https from 'node:https';
import { resolve } from 'node:path';

const files = [
  '素材/足迹图.jpg', '素材/主角图.jpg', '素材/废片图.png', '素材/logo.png',
  '素材/主角页面/预览图.jpg', '素材/主角页面/人物图1.jpg', '素材/主角页面/人物图2.jpg',
  '素材/主角页面/风景图1.jpg', '素材/主角页面/风景图2.jpg', '素材/主角页面/风景图3.jpg',
  '素材/废片mock/废片.jpg', '素材/主角mock/人物.jpg', '素材/主角mock/风景1.jpg',
  '素材/足迹图mock/人物-主形象.jpg', '素材/足迹图mock/景区-黄果树大瀑布.jpg',
  '素材/足迹图mock/景区-黔灵山公园.jpg', '素材/足迹图mock/景区-青云市集.jpg',
  '素材/足迹图mock/景区-西江千户苗寨.jpg',
];

const bucket = process.env.ALIYUN_OSS_BUCKET;
const endpoint = process.env.ALIYUN_OSS_ENDPOINT.replace(/^https?:\/\//, '').replace(/\/$/, '');
const prefix = (process.env.ALIYUN_OSS_PREFIX ?? 'uploads/').replace(/^\/+|\/+$/g, '');

function put(key, body) {
  const date = new Date().toUTCString();
  const type = 'image/webp';
  const stringToSign = `PUT\n\n${type}\n${date}\n/${bucket}/${key}`;
  const signature = createHmac('sha1', process.env.ALIYUN_ACCESS_KEY_SECRET).update(stringToSign).digest('base64');
  return new Promise((resolvePromise, reject) => {
    const request = https.request({
      hostname: `${bucket}.${endpoint}`,
      path: `/${key.split('/').map(encodeURIComponent).join('/')}`,
      method: 'PUT',
      headers: { Date: date, 'Content-Type': type, 'Content-Length': body.length, Authorization: `OSS ${process.env.ALIYUN_ACCESS_KEY_ID}:${signature}` },
    }, (response) => {
      response.resume();
      response.on('end', () => response.statusCode === 200 ? resolvePromise() : reject(new Error(`上传失败: ${response.statusCode}`)));
    });
    request.on('error', reject);
    request.end(body);
  });
}

for (const file of files) {
  const webp = file.replace(/\.[^.]+$/, '.webp');
  const key = [prefix, 'static-images-webp', webp].filter(Boolean).join('/');
  await put(key, await readFile(resolve('compressed-assets/static-images', webp)));
  console.log(`已上传: ${webp}`);
}

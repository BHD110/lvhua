# Repository Guidelines

## Project Structure

This is a static Chinese travel-image generator. It has five pages:

- `index.html`: home page. The three "生成" buttons link to `hero.html`, `reframe.html`, and `footprint.html`.
- `hero.html`: character image page. It provides person and landscape upload buttons, example-image buttons, preview zoom, and "生成主角画面".
- `reframe.html`: discarded-photo page. It provides image selection, an example-image button, preview, and "生成旅画".
- `footprint.html`: footprint page. It provides person upload, a location dialog, editable location-name inputs, image upload buttons, "使用示例足迹", and "生成足迹海报".
- `image-generator-demo.html`: standalone GPT Image 2 component example.

Shared interaction behavior lives in `interactions.js` and `interactions.css`. `gpt-image-2-generator.js` handles image task submission, polling, and result display; its matching CSS is in `gpt-image-2-generator.css`.

## Assets And Examples

Primary assets live under `素材/`: `logo.png`, home previews, `主角页面/`, and three example-image folders. Browser-delivered mock copies are in `public/assets/mock/`. Keep filenames descriptive and preserve the Chinese folder names because page scripts reference them directly.

## Local Development

Start the static server with `start-lan-preview.cmd`, then open `http://127.0.0.1:8080/index.html`. Alternatively run `py -3 -m http.server 8080 --bind 127.0.0.1` from the repository root. There is no build step, package manager, or automated test suite. Check changed pages in a browser, including example upload, dialog layout, navigation, and generated result display.

## Coding Style

Use UTF-8 HTML with `lang="zh-CN"`. Existing HTML is compact; make focused edits instead of reformatting whole files. Use two-space indentation in shared JavaScript, camelCase for JavaScript identifiers, kebab-case for CSS classes, and Chinese labels that match the product language. Reuse `window.amicroLoading`, existing CSS variables, and the shared interaction helpers.

## Security And Git

Keep `生图key.txt`, `生图key2.txt`, and `.env` local; never stage them. Commit messages follow concise Conventional Commit prefixes, for example `feat: add footprint examples` or `fix: align example button`. For a UI change, include the affected page and a brief verification note in the pull request.

// The share card (public/og.png, 1200×630): the first screen drawn still, in
// the site's own face and colours, with the still head lit as StaticHead
// lights it. Rendered with Playwright, which the site itself does not
// depend on (npm i -D playwright, once, with its Chromium):
//
//   node scripts/render-og.mjs public
//
// writes public/og.png (and og@2x.png beside it, to look at; not shipped).
// Run it again when the first screen's words, face or head change; the
// card's text is written here, not read from the site.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [outDir = 'public'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const font = fs.readFileSync(path.join(ROOT, 'src/app/fonts/InterVariable-latin.woff2')).toString('base64');
const head = fs.readFileSync(path.join(ROOT, 'public/head/head.webp')).toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900;font-style:normal}
html,body{margin:0}
body{width:1200px;height:630px;background:#f7f7f5;font-family:Inter,'SF Pro',-apple-system,system-ui,sans-serif;color:#08080a;-webkit-font-smoothing:antialiased;position:relative;overflow:hidden}
.title{position:absolute;top:36px;left:0;right:0;text-align:center;font-size:40px;line-height:1.32;font-weight:400;color:#08080a}
.chev{display:inline-block;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.72);box-shadow:inset 0 0 0 1.1px rgba(255,255,255,.9),0 0 0 1px rgba(0,0,0,.08),0 2px 6px rgba(0,0,0,.08);vertical-align:middle;margin-left:16px;position:relative;top:-3px}
.chev svg{position:absolute;left:8px;top:8px}
.head{position:absolute;left:50%;top:50%;width:640px;height:640px;transform:translate(-50%,-52%);filter:brightness(0.8) contrast(0.9) saturate(1.35)}
.tag{position:absolute;left:0;right:0;bottom:40px;text-align:center;font-size:40px;line-height:1.32;font-weight:400;color:#08080a}
</style></head><body>
<div class="title">Hey! I’m Timur<span class="chev"><svg viewBox="0 0 12 12" width="24" height="24" style="transform:scaleY(-1)"><path d="M2.5 7.6 6 4.1l3.5 3.5" fill="none" stroke="#1c1c1e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
<img class="head" src="data:image/webp;base64,${head}">
<div class="tag">senior product designer in Bangkok<br>who builds in code</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'og.png'), type: 'png' });
// A 2x beside it, to look at
const page2 = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page2.setContent(html, { waitUntil: 'load' });
await page2.evaluate(() => document.fonts.ready);
await page2.waitForTimeout(300);
await page2.screenshot({ path: path.join(outDir, 'og@2x.png'), type: 'png' });
await browser.close();
console.log(`${path.join(outDir, 'og.png')} written`);

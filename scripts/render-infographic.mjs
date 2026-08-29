#!/usr/bin/env node
// daily/*/infographic.json を 1080×1350 PNG にレンダリングする。
// 使い方: node scripts/render-infographic.mjs [--out dist/assets/infographics] [--date YYYY-MM-DD]
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const WIDTH = 1080;
const HEIGHT = 1350;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dailyRoot = join(root, "daily");
const template = readFileSync(join(root, "site", "infographic-template.html"), "utf8");

const argv = process.argv;
const outIdx = argv.indexOf("--out");
const outDir = outIdx > -1 ? argv[outIdx + 1] : join(root, "dist", "assets", "infographics");
const dateIdx = argv.indexOf("--date");
const targets = dateIdx > -1
  ? [argv[dateIdx + 1]]
  : readdirSync(dailyRoot).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();

function pngSize(buf) {
  // PNGのIHDRチャンク(先頭16バイト目以降)から幅・高さを読む
  if (buf.length < 24 || buf.readUInt32BE(12) !== 0x49484452) throw new Error("PNGではありません");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });

let failed = false;
for (const date of targets) {
  try {
    const data = JSON.parse(readFileSync(join(dailyRoot, date, "infographic.json"), "utf8"));
    const html = template.replace("/*__DATA__*/ null", JSON.stringify(data));
    await page.setContent(html, { waitUntil: "networkidle" });
    const buf = await page.screenshot({ type: "png" });
    const { width, height } = pngSize(buf);
    if (width !== WIDTH || height !== HEIGHT) {
      throw new Error(`寸法が不正です: ${width}×${height}(期待: ${WIDTH}×${HEIGHT})`);
    }
    writeFileSync(join(outDir, `${date}.png`), buf);
    console.log(`✓ ${date}.png (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.error(`✗ ${date}: ${e.message}`);
    failed = true;
  }
}

await browser.close();
process.exit(failed ? 1 : 0);

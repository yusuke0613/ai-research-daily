#!/usr/bin/env node
// daily/ 配下の成果物を検証する。依存ライブラリなし(Routine環境でもそのまま動く)。
// 使い方: node scripts/validate.mjs [--date YYYY-MM-DD]
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dailyRoot = join(root, "daily");

const THEMES = ["indigo", "teal", "sunset"];
const REQUIRED_HEADINGS = ["## 今日の3行", "## 一次情報ピックアップ", "## SNSの温度感", "## 今日の基礎"];

const errors = [];
const err = (date, msg) => errors.push(`[${date}] ${msg}`);

function checkLen(date, label, value, max) {
  if (typeof value !== "string" || value.trim() === "") {
    err(date, `${label} が空です`);
  } else if ([...value].length > max) {
    err(date, `${label} が${max}文字を超えています(${[...value].length}文字): "${value}"`);
  }
}

function validateDay(date) {
  const dir = join(dailyRoot, date);
  const files = { summary: "summary.md", caption: "caption.md", infographic: "infographic.json" };
  for (const f of Object.values(files)) {
    if (!existsSync(join(dir, f))) err(date, `${f} がありません`);
  }
  if (errors.length) return;

  // summary.md: 固定構造の見出しがあるか
  const summary = readFileSync(join(dir, files.summary), "utf8");
  for (const h of REQUIRED_HEADINGS) {
    if (!summary.includes(h)) err(date, `summary.md に見出し "${h}" がありません`);
  }

  // caption.md: Instagram制約
  const caption = readFileSync(join(dir, files.caption), "utf8");
  if ([...caption].length > 2200) err(date, `caption.md が2200文字を超えています(${[...caption].length}文字)`);
  const hashtags = caption.match(/(^|[\s　])#[^\s#　]+/g) || [];
  if (hashtags.length > 30) err(date, `ハッシュタグが30個を超えています(${hashtags.length}個)`);

  // infographic.json: スキーマ
  let info;
  try {
    info = JSON.parse(readFileSync(join(dir, files.infographic), "utf8"));
  } catch (e) {
    err(date, `infographic.json がJSONとして不正です: ${e.message}`);
    return;
  }
  if (info.date !== date) err(date, `infographic.json の date (${info.date}) がディレクトリ名と一致しません`);
  checkLen(date, "title", info.title, 20);
  if (!Array.isArray(info.top3) || info.top3.length !== 3) {
    err(date, `top3 は3件必須です(現在 ${Array.isArray(info.top3) ? info.top3.length : 0}件)`);
  } else {
    info.top3.forEach((item, i) => {
      checkLen(date, `top3[${i}].headline`, item?.headline, 18);
      checkLen(date, `top3[${i}].oneliner`, item?.oneliner, 45);
    });
  }
  checkLen(date, "basicTopic.title", info.basicTopic?.title, 24);
  checkLen(date, "basicTopic.keyPoint", info.basicTopic?.keyPoint, 60);
  if (info.theme && !THEMES.includes(info.theme)) {
    err(date, `theme は ${THEMES.join(" / ")} のいずれかにしてください(現在: ${info.theme})`);
  }
}

const dateArgIdx = process.argv.indexOf("--date");
const targets = dateArgIdx > -1
  ? [process.argv[dateArgIdx + 1]]
  : readdirSync(dailyRoot).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();

if (targets.length === 0 || !targets[0]) {
  console.error("検証対象の daily ディレクトリがありません");
  process.exit(1);
}

for (const date of targets) validateDay(date);

if (errors.length) {
  console.error(`✗ 検証エラー ${errors.length}件:`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(`✓ 検証OK: ${targets.length}日分 (${targets[0]}${targets.length > 1 ? ` 〜 ${targets.at(-1)}` : ""})`);

#!/usr/bin/env node
// daily/ 配下のMarkdown+JSONから静的ダッシュボード(dist/)を生成する。
// 使い方: node site/build.mjs
import { readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

// 単一改行を<br>にする(「何が起きた/なぜ重要/影響」の行構造を保つため)
marked.use({ breaks: true });

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dailyRoot = join(root, "daily");
const dist = join(root, "dist");
const layout = readFileSync(join(root, "site", "templates", "layout.html"), "utf8");

const days = readdirSync(dailyRoot)
  .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
  .sort()
  .reverse()
  .map((date) => {
    const dir = join(dailyRoot, date);
    const summary = readFileSync(join(dir, "summary.md"), "utf8");
    let info = null;
    try {
      info = JSON.parse(readFileSync(join(dir, "infographic.json"), "utf8"));
    } catch { /* infographicが無くてもページは出す */ }
    return { date, summary, info };
  });

if (days.length === 0) {
  console.error("daily/ に日付ディレクトリがありません");
  process.exit(1);
}

const generated = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

function page({ title, rel, content }) {
  return layout
    .replaceAll("{{title}}", title)
    .replaceAll("{{rel}}", rel)
    .replace("{{content}}", content)
    .replace("{{generated}}", generated);
}

// summary.md の「## 今日の基礎」セクションを抜き出す(基礎学習の蓄積ページ用)
function extractBasicSection(summary) {
  const sections = summary.split(/\n(?=## )/);
  const basic = sections.find((s) => s.startsWith("## 今日の基礎"));
  return basic ? basic.replace(/^## 今日の基礎\s*/, "") : null;
}

function dailyArticle(day, rel) {
  // 見出し行(# YYYY-MM-DD ...)はページ側でタイトル表示するので除去
  const body = day.summary.replace(/^# .*\n/, "");
  const img = `<img class="infographic" src="${rel}assets/infographics/${day.date}.png" alt="${day.date} インフォグラフィック" onerror="this.style.display='none'">`;
  return `<h1>${day.date} のブリーフ</h1>
<p class="meta">${day.info?.title ?? ""}</p>
${img}
${marked.parse(body)}`;
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "daily"), { recursive: true });
cpSync(join(root, "site", "templates", "style.css"), join(dist, "style.css"));

// 1. index.html = 最新号
writeFileSync(join(dist, "index.html"), page({
  title: `${days[0].date} 最新ブリーフ`,
  rel: "",
  content: dailyArticle(days[0], ""),
}));

// 2. 各日ページ
for (const day of days) {
  writeFileSync(join(dist, "daily", `${day.date}.html`), page({
    title: `${day.date} ブリーフ`,
    rel: "../",
    content: dailyArticle(day, "../"),
  }));
}

// 3. アーカイブ一覧
const archiveItems = days.map((d) => `  <li>
    <a href="daily/${d.date}.html">${d.date}</a>
    <div class="sub">${d.info?.title ?? ""}</div>
  </li>`).join("\n");
writeFileSync(join(dist, "archive.html"), page({
  title: "アーカイブ",
  rel: "",
  content: `<h1>アーカイブ</h1>\n<p class="meta">全${days.length}日分</p>\n<ul class="card-list">\n${archiveItems}\n</ul>`,
}));

// 4. 基礎学習の蓄積ページ(新しい順)
const basicEntries = days
  .map((d) => ({ date: d.date, section: extractBasicSection(d.summary) }))
  .filter((e) => e.section)
  .map((e) => `<div class="basic-entry">
  <div class="date-label"><a href="daily/${e.date}.html">${e.date}</a></div>
  ${marked.parse(e.section)}
</div>`)
  .join("\n");
writeFileSync(join(dist, "basics.html"), page({
  title: "基礎学習",
  rel: "",
  content: `<h1>基礎学習の記録</h1>
<p class="meta">日次ブリーフ「今日の基礎」の蓄積。AIエージェント・RAG・LLM・コーディングエージェントの4トラックを1日1トピックずつ。</p>
${basicEntries}`,
}));

// 5. .nojekyll(Pagesでの余計な処理を無効化)
writeFileSync(join(dist, ".nojekyll"), "");

console.log(`✓ サイト生成完了: ${days.length}日分 → dist/`);

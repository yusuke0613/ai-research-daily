#!/usr/bin/env node
// Phase 2用: Instagram Graph API への投稿スクリプト(現在はワークフローから呼ばれない)。
//
// 前提(docs/instagram-setup.md 参照):
//   - Instagramプロアカウント + 連携済みFacebookページ + Meta開発者アプリ
//   - instagram_business_content_publish 権限付きの長期アクセストークン
//   - GitHub Actions Secrets: IG_ACCESS_TOKEN, IG_USER_ID
//
// 使い方: node scripts/post-instagram.mjs --image <公開PNGのURL> --caption-file daily/YYYY-MM-DD/caption.md
import { readFileSync } from "node:fs";

const API = "https://graph.facebook.com/v23.0";

const argv = process.argv;
const arg = (name) => {
  const i = argv.indexOf(name);
  return i > -1 ? argv[i + 1] : undefined;
};

const imageUrl = arg("--image");
const captionFile = arg("--caption-file");
const token = process.env.IG_ACCESS_TOKEN;
const igUserId = process.env.IG_USER_ID;

if (!imageUrl || !captionFile) {
  console.error("使い方: node scripts/post-instagram.mjs --image <URL> --caption-file <path>");
  process.exit(1);
}
if (!token || !igUserId) {
  console.error("環境変数 IG_ACCESS_TOKEN / IG_USER_ID が未設定です(GitHub Actions Secretsに設定してください)");
  process.exit(1);
}

const caption = readFileSync(captionFile, "utf8").trim();

async function post(path, params) {
  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, access_token: token }),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`Graph APIエラー (${path}): ${JSON.stringify(json.error ?? json)}`);
  }
  return json;
}

// 1. メディアコンテナ作成 → 2. 公開 の2段階
const container = await post(`${igUserId}/media`, { image_url: imageUrl, caption });
console.log(`コンテナ作成: ${container.id}`);

// コンテナの処理完了を少し待つ(画像取得に時間がかかる場合がある)
await new Promise((r) => setTimeout(r, 10_000));

const published = await post(`${igUserId}/media_publish`, { creation_id: container.id });
console.log(`✓ 投稿完了: media_id=${published.id}`);

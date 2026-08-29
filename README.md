# AI Research Daily

毎朝6時(JST)に、AIエージェント / RAG / Claude Code / Codex 周辺の最新一次情報を自動収集・要約し、
ダッシュボードとインフォグラフィックを生成するパイプライン。

## アーキテクチャ

```
Claude Code Routine(毎朝06:00 JST / Anthropicクラウドで実行)
  ├─ 一次情報収集(Anthropic/OpenAI/Google公式、GitHub Releases、arXiv)
  ├─ SNS調査(Hacker News / Reddit / Zenn / Qiita / はてブ / X)
  ├─ data/state/seen.json で既読の重複排除
  ├─ daily/YYYY-MM-DD/{summary.md, caption.md, infographic.json} を生成
  └─ mainにpush
        ↓ pushトリガー
GitHub Actions(.github/workflows/daily-build.yml)
  ├─ validate: スキーマ・文字数制約の検証
  ├─ build:    静的ダッシュボード生成(最新号/アーカイブ/基礎学習)
  ├─ render:   Playwrightで1080×1350のインフォグラフィックPNG生成
  └─ deploy:   GitHub Pagesへ公開
        ↓ Phase 2(docs/instagram-setup.md 完了後に有効化)
Instagram Graph API 自動投稿
```

役割分担の設計思想:
- **Routine = 頭脳**(リサーチ・執筆・コミット)。シークレットは持たない。
- **Actions = 工場**(検証・レンダリング・デプロイ・投稿)。シークレットはここだけに置く。
- **状態はすべてリポジトリ内**(`data/state/`)。Routineは毎回クリーン環境で動くため。

## ディレクトリ

| パス | 役割 |
|---|---|
| `routine/PROMPT.md` | Routineの実行手順書(Routine本体は「これを読んで実行」とだけ設定) |
| `curriculum/topics.yml` | 基礎学習60トピック(LLM/RAG/エージェント/コーディングエージェントの4トラック) |
| `data/state/` | 既読URL・カリキュラム進捗(Routineが毎日更新) |
| `daily/YYYY-MM-DD/` | 日次成果物(summary / caption / infographic.json) |
| `site/` | ダッシュボード生成(`build.mjs`)とインフォグラフィックテンプレート |
| `scripts/` | 検証・PNG生成・Instagram投稿(Phase 2) |

## ローカルでの動作確認

```bash
npm install
npx playwright install chromium
npm run all   # validate → build → render(dist/ に出力)
```

## 運用メモ

- Routineの登録: claude.ai/code/routines で `routine/PROMPT.md` を読ませる設定。環境のNetwork accessは「Full」にする(Webリサーチのため)。
- Routineが落ちた日: ダッシュボードは前日のまま。翌日の実行で自動回復する(必要なら手動でone-off実行)。
- Instagram連携の手順: [docs/instagram-setup.md](docs/instagram-setup.md)

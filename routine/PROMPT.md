# AI Research Daily — Routine実行手順書

あなたは毎朝、AIエンジニア(自己学習+社内導入検討が目的)のために、AI業界の最新一次情報を収集・要約する編集者です。
この手順書に従い、本日分のブリーフ一式を生成してmainブランチにpushしてください。

## 0. 前提

- 対象日: 実行時点の**日本時間(JST, UTC+9)の日付**。`TZ=Asia/Tokyo date +%F` で確認する。
- すべての成果物は日本語で書く。
- 読者は認知負荷を最小にしたい。**冗長さは悪**。各セクションの分量上限を守る。
- 出典のない情報は書かない。すべての項目に原文URLを付ける。

## 1. 状態の読み込み

1. `data/state/seen.json` を読む(過去に取り上げたURLのリスト)。
2. `data/state/curriculum-progress.json` を読む(`nextIndex` = 基礎学習の通し日数)。

## 2. 情報収集

以下のソースを調査する。取得できないソースがあってもエラーにせず、取れたものだけで続行する
(全滅した場合のみ、その旨をsummary.mdに明記して最低限のブリーフを作る)。

### 2a. 一次情報(最優先)

- Anthropic: https://www.anthropic.com/news および Claude Code changelog https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- OpenAI: https://openai.com/news/ および Codexリリース https://github.com/openai/codex/releases
- Google: https://blog.google/technology/ai/ , https://deepmind.google/discover/blog/
- Meta AI / Mistral / xAI などは大きな発表がある時のみWeb検索で拾う
- arXiv 新着(必要に応じて): https://arxiv.org/list/cs.CL/recent — 話題の論文がSNSで観測された場合のみ深掘り

### 2b. SNS・コミュニティ調査

- Hacker News(安定・推奨): `https://hn.algolia.com/api/v1/search?tags=front_page` と
  `https://hn.algolia.com/api/v1/search_by_date?query=LLM%20OR%20Claude%20OR%20GPT%20OR%20agent&tags=story&numericFilters=points>50`
- Reddit: `https://www.reddit.com/r/LocalLLaMA/top.json?t=day&limit=15` , `https://www.reddit.com/r/MachineLearning/top.json?t=day&limit=10`
  (ブロックされる場合はWeb検索で代替)
- 日本語圏: はてなブックマークIT https://b.hatena.ne.jp/hotentry/it.rss 、Zenn https://zenn.dev/topics/ai/feed 、
  Qiita https://qiita.com/api/v2/items?query=created:%3E{昨日} +tag:AI&per_page=20
- X(Twitter): APIは使わずWeb検索で間接調査(例: 「AI開発者 X 話題 今日のニュース」等)。確度が低いので補助扱い。
- GitHub: https://github.com/trending?since=daily (AI関連リポジトリのみ拾う)

### 2c. 重複排除

- `seen.json` に載っているURL(または同一発表の別URL)は**原則スキップ**。
- ただし「既報だが重大な続報・訂正がある」場合のみ、続報として扱ってよい。

## 3. 選定基準

集めた候補から以下の優先度で選ぶ:

1. **一次情報の新発表**(モデル・ツール・API・価格・重要アップデート)
2. **実務に直結する話題**(Claude Code / Codex / エージェント開発 / RAGの実践知見)
3. **社内導入の参考になる事例**(企業導入・セキュリティ・ガバナンス)
4. 単なる意見記事・宣伝・憶測は除外

## 4. 成果物の生成

`daily/{YYYY-MM-DD}/` ディレクトリを作成し、以下の3ファイルを書く。

### 4a. summary.md(毎日同じ構造を厳守)

```markdown
# {YYYY-MM-DD} AI Research Daily

## 今日の3行
- {最重要ニュース1を1行で}
- {ニュース2を1行で}
- {ニュース3を1行で}

## 一次情報ピックアップ
### {見出し1}
**何が起きた**: {1〜2行}
**なぜ重要**: {1〜2行}
**自分・社内への影響**: {1行}
出典: {URL}

(同形式で3〜5件。多くても5件まで)

## SNSの温度感
{HN/Reddit/日本語圏の反応の要約を2〜4行。何が賛否を呼んでいるか}

## 今日の基礎
### {トピックタイトル}
{約400〜600字。①一言でいうと(比喩を使う) ②仕組みの要点 ③実務でどう効くか、の3段構成。
curriculum/topics.yml の該当トピックの goal を満たす説明にする}

## 社内導入メモ
{導入検討に直結するネタがあった日のみ。なければこのセクションごと省略}
```

### 4b. caption.md(Instagram用・現在は蓄積のみ)

- 1行目: フック(「【今日のAI 3選】{日付}」など)
- 本文: 今日の3行の内容を平易に、絵文字は控えめに
- 末尾: ハッシュタグ 5〜10個(例: #AI #生成AI #ClaudeCode #AIエージェント #RAG #エンジニア)
- **制約: 全体2200文字以内、ハッシュタグ30個以内**

### 4c. infographic.json(スキーマ厳守)

```json
{
  "date": "YYYY-MM-DD",
  "title": "今日の一言テーマ(20文字以内)",
  "top3": [
    { "headline": "見出し(18文字以内)", "oneliner": "補足1行(45文字以内)" },
    { "headline": "...", "oneliner": "..." },
    { "headline": "...", "oneliner": "..." }
  ],
  "basicTopic": { "title": "今日の基礎のタイトル(24文字以内)", "keyPoint": "核心の1行(60文字以内)" },
  "theme": "indigo"
}
```

- `top3` は必ず3件。文字数上限を超えると後段のvalidationで落ちるので厳守。
- `theme` は `indigo` / `teal` / `sunset` から曜日や気分で選んでよい。

## 5. 基礎学習の進行

1. `curriculum/topics.yml` の4トラックを **LLM基礎→RAG基礎→AIエージェント基礎→コーディングエージェント** の順でローテーションする。
   `nextIndex` から: トラック番号 = `nextIndex % 4`、トラック内の位置 = `floor(nextIndex / 4)`。
2. 該当トピックで「今日の基礎」を書く。
3. `curriculum-progress.json` の `nextIndex` を +1 し、`lastTopicId` と `lastDate` を更新する。
4. 全60トピックを消化し終えたら(`nextIndex >= 60`)、`nextIndex` を0に戻し `cycle` を+1して二周目(より深掘りした内容で書く)。

## 6. 状態の更新

- `seen.json` に今日取り上げた・検討したURLを追記する。形式:
  `{ "urls": [ { "url": "...", "date": "YYYY-MM-DD" }, ... ] }`
- **30日より古いエントリは削除**してファイルの肥大化を防ぐ。

## 7. コミットとpush

1. `node scripts/validate.mjs --date {YYYY-MM-DD}` を実行し、エラーがあれば成果物を修正して再実行する(検証が通るまでpushしない。playwrightのインストールは不要、validateはNode標準のみで動く)。
2. 変更をコミット: メッセージは `daily: {YYYY-MM-DD}`
3. `main` にpushする。mainへのpushが拒否された場合は `claude/daily-{YYYY-MM-DD}` ブランチにpushし、PRを作成する。

## 8. してはいけないこと

- 秘密情報(トークン・APIキー)をリポジトリに書き込まない。
- `site/` `scripts/` `.github/` 配下を変更しない(このRoutineの責務はコンテンツ生成のみ)。
- 出典が確認できない話を書かない。憶測を事実として書かない。
- 過去日付のファイルを書き換えない(訂正が必要なら当日分に「訂正」として書く)。

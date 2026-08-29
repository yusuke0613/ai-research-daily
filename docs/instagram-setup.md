# Instagram自動投稿のセットアップ手順(Phase 2)

パイプライン本体は完成済みで、このドキュメントの手順を終えれば投稿ステップを有効化できる。
所要: Meta側の設定に1〜2時間+(他人のアカウントにも使う場合のみ)アプリ審査2〜4週間。
**自分のアカウントにだけ投稿するなら審査は不要**(開発モードのまま、自分がアプリの管理者/テスターであれば投稿できる)。

## 1. Metaアカウント側の準備

1. **Instagramをプロアカウント化**: Instagramアプリ → 設定 → アカウントの種類 → 「ビジネス」または「クリエイター」に切り替え(無料)。
2. **Facebookページを作成し、Instagramと連携**: Meta Business Suite (business.facebook.com) でページ作成 → 設定 → リンク済みアカウント → Instagramを接続。
3. **Meta開発者アカウントとアプリ作成**: https://developers.facebook.com/ → My Apps → Create App → 種類は「ビジネス」。
4. アプリに **Instagram Graph API** 製品を追加。

## 2. アクセストークンの取得

1. Graph API Explorer (https://developers.facebook.com/tools/explorer/) で自分のアプリを選択。
2. 権限を追加: `instagram_basic`, `instagram_business_content_publish`, `pages_show_list`, `business_management`
3. User Access Token を取得 → **長期トークン(60日有効)に交換**:
   ```
   GET https://graph.facebook.com/v23.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={アプリID}
     &client_secret={アプリシークレット}
     &fb_exchange_token={短期トークン}
   ```
4. **InstagramビジネスアカウントIDを取得**:
   ```
   GET https://graph.facebook.com/v23.0/me/accounts        → ページIDを取得
   GET https://graph.facebook.com/v23.0/{ページID}?fields=instagram_business_account
   ```
   返ってきた `instagram_business_account.id` が `IG_USER_ID`。

## 3. GitHub Secretsの設定

リポジトリの Settings → Secrets and variables → Actions で以下を登録:

| Secret名 | 値 |
|---|---|
| `IG_ACCESS_TOKEN` | 手順2の長期トークン |
| `IG_USER_ID` | InstagramビジネスアカウントID |

**トークンをリポジトリのファイルやRoutine環境変数に書かないこと**(Routineの環境変数は秘匿されない)。

## 4. ワークフローの有効化

`.github/workflows/daily-build.yml` 末尾のコメントアウトされた `instagram:` ジョブを有効化し、
`USERNAME` を自分のGitHubユーザー名に置き換える。

## 5. トークンの自動リフレッシュ(推奨)

長期トークンは60日で失効する。50日ごとに更新するワークフローを追加する:

```yaml
# .github/workflows/refresh-ig-token.yml(概要)
# schedule: cron '0 0 */50 * *' 相当は書けないため毎月1日実行にして
# 手順2の fb_exchange_token 交換APIを叩き、ghコマンドでSecretを更新する。
# Secretの更新には権限付きPAT(GH_PAT)が別途必要。
```

失効するとActionsの投稿ステップが失敗して通知が来るので、まずは手動更新(50日ごとにカレンダー登録)でも運用可能。

## 6. 制約・注意

- 投稿画像は**公開URL上に存在する必要がある** → 本パイプラインではGitHub Pages上のPNG URLを使用(条件を満たしている)。
- APIでの投稿はローリング24時間で回数制限あり(通常は1日数十件、本用途の1日1件は問題なし)。
- 縦長画像は1080×1350(アスペクト比4:5)がフィード投稿の最大縦長。本パイプラインの出力はこの仕様に合わせてある。

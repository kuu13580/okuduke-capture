# 奥付キャプチャー (okuduke-capture)

同人誌売買時の奥付スキャン＆リスト化ツール (Webアプリケーション)。
端末に写真を保存することなく、カメラから奥付（タイトル・サークル名・発行日等）を読み取り、リスト化してスプレッドシート用TSVコピーやCSVダウンロードが可能です。

- **本番URL**: [https://okuduke.kuu13580.com](https://okuduke.kuu13580.com)

## 技術スタック

- **フロントエンド / UI**: [Lit](https://lit.dev/) (Light DOM運用)
- **スタイリング**: [Sashimi UI v2](https://github.com/yuto-hasegawa/sashimi-ui)
- **BFF / バックエンド**: [Cloudflare Workers](https://workers.cloudflare.com/) (Static Assets + [Hono](https://hono.dev/))
  - レートリミット: Cloudflare Rate Limiting (60回/分/IP・連続スキャンを阻害しない安全設定)
- **AI 解析**: Google Gemini API (`gemini-3.1-flash-lite`) ※サーバー側でAPIキーを安全に中継
- **計測**: Google Analytics 4 (GA4) ※本番ホストのみ・匿名利用統計
- **ツールチェーン**: [Vite+](https://viteplus.dev/) (`vite-plus` / `vp`)
  - バンドラ: Rolldown / Vite
  - Linter & Formatter: Oxlint / Oxfmt
  - テスト: Vitest
- **CI**: GitHub Actions

## ローカル開発

### 1. 環境変数の設定

Gemini API キーを設定します（ローカル実行用）。

```bash
cp worker/.dev.vars.example .dev.vars
# .dev.vars 内の GEMINI_API_KEY に自身のキーを設定
```

### 2. 開発サーバーの起動

フロントエンド（Vite）と BFF（Wrangler）を起動します。

```bash
# ターミナル1: BFF (ポート 8787)
pnpm run dev:worker

# ターミナル2: フロントエンド (ポート 4000)
pnpm run dev
```

### 3. テスト・検証コマンド

```bash
# 型チェック・リント・フォーマット検証
pnpm run check

# 自動フォーマット・修正
pnpm exec vp check --fix

# 単体テスト実行
pnpm run test

# クライアントビルド
pnpm run build

# 本番デプロイ
pnpm run deploy
```

## デプロイ設定

- 設定ファイル: `wrangler.jsonc`
- カスタムドメイン: `okuduke.kuu13580.com`
- 本番APIキー設定: `pnpm exec wrangler secret put GEMINI_API_KEY`

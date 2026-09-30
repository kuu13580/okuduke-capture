# 奥付キャプチャー (okuduke-capture)

同人誌売買時の奥付スキャン＆リスト化ツール (Webアプリケーション)。
端末に写真を保存することなく、カメラから奥付（タイトル・サークル名・発行日等）を読み取り、リスト化してスプレッドシート用TSVコピーやCSVダウンロードが可能です。

## 技術スタック

- **フレームワーク / UI**: [Lit](https://lit.dev/) (Light DOM運用)
- **スタイリング**: [Sashimi UI v2](https://github.com/yuto-hasegawa/sashimi-ui) (クラスレスCSS)
- **ツールチェーン**: [Vite+](https://viteplus.dev/) (`vite-plus` / `vp`)
  - バンドラ: Rolldown / Vite
  - Linter & Formatter: Oxlint / Oxfmt
  - テスト: Vitest
- **CI/CD**: GitHub Actions
- **ホスティング**: Cloudflare Pages

## 開発コマンド

```bash
# 開発サーバー起動
pnpm run dev

# 型チェック・リント・フォーマット検証
pnpm run check

# 自動フォーマット・修正
pnpm exec vp check --fix

# 単体テスト実行
pnpm run test

# 本番ビルド (dist/ に出力)
pnpm run build
```

## Cloudflare Pages デプロイ設定

- **ビルドコマンド**: `pnpm run build`
- **出力ディレクトリ**: `dist`

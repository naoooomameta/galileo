# ガリレオ — 理系の大学受験専門塾 公式サイト

文系の大学受験専門塾「プラトン」(plato-humanities.com) の理系版。

## プロジェクト構造

```
galileo-site/
├── index.html              # トップページ（LP型・全セクション含む）
├── css/
│   └── style.css           # 共通CSS（トップから分離予定）
├── img/
│   └── galileo-logo.png    # ロゴ（背景透過済み）
├── pages/
│   ├── mainichi-kadai.html       # 毎日課題システム詳細
│   ├── daigaku-juken-junbi.html  # 大学受験準備コース詳細
│   ├── goukaku-senryaku.html     # 合格戦略プログラム詳細
│   ├── goukaku-senryaku-support.html  # 合格戦略サポート詳細
│   ├── voices.html               # 合格者の声 一覧
│   └── news.html                 # お知らせ一覧
└── CLAUDE.md               # Claude Code用の指示書
```

## デザインシステム: Emerald Gold

| 役割 | カラー | 用途 |
|------|--------|------|
| Primary | `#0E4A38` | 見出し・ロゴ・ダーク帯・メインテキスト |
| Primary Light | `#14614A` | ホバー・アクセントライン・サブ要素 |
| Primary Dark | `#0A3228` | トップバー・フッター・お問い合わせ背景 |
| Gold (CTA) | `#C49A3C` | CTAボタン・キャッチコピー・セクションラベル |
| Gold Light | `#D4A843` | ホバー状態・差し色 |
| Green Pale | `#EDF5F0` | カード背景・ハイライト領域 |
| Green Mist | `#c0d8c8` | ボーダー・区切り線 |
| BG | `#F4F9F6` | ページ背景 |
| BG Alt | `#E6EDE8` | セクション交互背景 |
| BG Dark | `#0A3228` | ダークセクション背景 |

## フォント
- 本文: Noto Sans JP (400, 500, 600, 700, 800, 900)
- 見出し: Noto Serif JP (400, 700)

## ベースサイト（文系版プラトン）
https://plato-humanities.com/
- 構造・レイアウト・フォントはプラトンと完全同一
- コンテンツ・科目・大学・フィロソフィーのみ理系に変換

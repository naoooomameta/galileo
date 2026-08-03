# 広告LP（teacher-sano.com/thank-galileo）予約ウィジェット エラー表示改善パッチ

## 背景

LPの予約ウィジェットは、空き枠APIがJSON以外（Googleログインページ等）を返したとき、
エラーHTMLの生テキストをそのまま画面に表示してしまう。

> APIがJSONを返しませんでした：&lt;!DOCTYPE html&gt;&lt;html lang="ja"&gt;…

見込み客（広告流入ユーザー）にこの表示が出るとコンバージョンを直接損なうため、
ユーザー向けの文言に差し替え、技術情報はコンソールログに退避する。

## 修正箇所（STUDIOのカスタムコード内を検索して置換）

### 1. JSONパース失敗時の表示

**検索:**

```js
empty.textContent = 'APIがJSONを返しませんでした：' + text.slice(0,200);return;}
```

**置換:**

```js
console.error('予約API異常応答:', text.slice(0,300));
empty.textContent = '現在、空き枠を取得できません。お手数ですが、時間をおいて再度お読み込みください。';return;}
```

### 2. 通信エラー時の表示

**検索:**

```js
empty.textContent='Fetch失敗：' + String(err);});}
```

**置換:**

```js
console.error('予約API通信エラー:', err);
empty.textContent='通信エラーが発生しました。お手数ですが、時間をおいて再度お試しください。';});}
```

## 補足

- 同じウィジェットコードはプラトン公式サイト（`Plato_official/index.html`）にも存在するため、
  同一の置換を適用するとよい。
- ガリレオ公式サイト（このリポジトリの `index.html`）は元からユーザー向け文言のみを
  表示する実装のため対応不要。
- 根本の再発検知は `docs/health-check-gas.gs`（1時間ごとの死活監視＋メール通知）で行う。

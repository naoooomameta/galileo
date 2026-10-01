#!/usr/bin/env node
// note.com の RSS を取得し、最新記事を data/note-feed.json に書き出す。
// GitHub Actions（.github/workflows/note-feed.yml）から定期実行される。
//
// 使い方:
//   NOTE_USER=<noteのユーザーID> node scripts/fetch-note-feed.mjs
//   （https://note.com/XXXX の XXXX 部分が NOTE_USER）
//   NOTE_RSS_URL を指定した場合はそのURLを直接読む（テスト用・マガジン用）。
//
// 出力（data/note-feed.json）:
//   { source, updatedAt, items:[{ title, url, date, dateLabel, publishedAt, thumbnail, excerpt }] }
//   items は公開日の新しい順・最大 MAX_ITEMS 件。記事に変化が無ければファイルは書き換えない。

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../data/note-feed.json', import.meta.url));
const MAX_ITEMS = 3;
const EXCERPT_LEN = 80;

const user = (process.env.NOTE_USER || '').trim();
const rssUrl = (process.env.NOTE_RSS_URL || '').trim() || (user ? `https://note.com/${user}/rss` : '');
const source = (process.env.NOTE_PROFILE_URL || '').trim() || (user ? `https://note.com/${user}` : '');

if (!rssUrl) {
  console.log('NOTE_USER が未設定のため何もしません（.github/workflows/note-feed.yml の NOTE_USER を設定してください）。');
  process.exit(0);
}

// --- 最小限のXML読み取り（依存パッケージなし） ---
const cp = (n) => (n > 0 && n <= 0x10ffff) ? String.fromCodePoint(n) : ''; // 範囲外の文字参照で落ちない
const decode = (s) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => cp(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => cp(parseInt(h, 16)))
  .replace(/&amp;/g, '&');

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]).trim() : '';
};

// <media:thumbnail>URL</media:thumbnail> と <media:thumbnail url="..."/> の両形式に対応
const thumbnail = (xml) => {
  const m = xml.match(/<media:thumbnail\b([^>]*)>([^<]*)/);
  if (!m) return '';
  const attr = m[1].match(/\burl="([^"]+)"/);
  return decode(attr ? attr[1] : m[2]).trim();
};

const fmtJst = (d) => {
  const parts = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const g = (t) => parts.find((p) => p.type === t).value;
  return { iso: `${g('year')}-${g('month')}-${g('day')}`, label: `${g('year')}.${g('month')}.${g('day')}` };
};

// --- 取得 ---
const res = await fetch(rssUrl, {
  headers: {
    'user-agent': 'galileo-sciences.com note-feed (+https://galileo-sciences.com)',
    'accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
  },
  signal: AbortSignal.timeout(20000),
});
if (!res.ok) {
  console.error(`RSSの取得に失敗しました: HTTP ${res.status} ${rssUrl}`);
  process.exit(1);
}
const xml = await res.text();

const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)]
  .map((m) => m[1])
  .map((x) => {
    // 本文（description）内のHTMLを title/link と取り違えないよう、本文を除いた部分からメタ情報を読む
    const meta = x.replace(/<description(?:\s[^>]*)?>[\s\S]*?<\/description>/, '');
    const title = tag(meta, 'title');
    const url = tag(meta, 'link') || tag(meta, 'guid');
    const d = new Date(tag(meta, 'pubDate'));
    if (!title || !url || Number.isNaN(d.getTime())) return null;
    const f = fmtJst(d);
    const excerpt = Array.from(tag(x, 'description').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).slice(0, EXCERPT_LEN).join('');
    return { title, url, date: f.iso, dateLabel: f.label, publishedAt: d.toISOString(), thumbnail: thumbnail(meta), excerpt };
  })
  .filter(Boolean)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  .slice(0, MAX_ITEMS);

if (!items.length) {
  console.error('RSSから記事を読み取れませんでした（形式が変わった可能性があります）。既存のJSONはそのまま残します。');
  process.exit(1);
}

// --- 変化がある時だけ書き出す（無駄なコミットを避ける） ---
let prev = null;
try { prev = JSON.parse(await readFile(OUT, 'utf8')); } catch { /* 初回など */ }
if (prev && prev.source === source && JSON.stringify(prev.items) === JSON.stringify(items)) {
  console.log(`変更なし（最新: ${items[0].dateLabel} ${items[0].title}）`);
  process.exit(0);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ source, updatedAt: new Date().toISOString(), items }, null, 2) + '\n');
console.log(`更新しました: ${items.length}件（最新: ${items[0].dateLabel} ${items[0].title}）`);

/* =====================================================================
   診断サンクスページ 連絡先登録（action=shindanLead）追記パッチ
   ---------------------------------------------------------------------
   対象ページ: /pages/lpquestionnaire/thanks.html の連絡先フォーム
              （お名前・メールアドレス・電話番号）

   ★重要★
   このパッチは thanks.html が送信する GAS エンドポイント
     https://script.google.com/macros/s/AKfycbwSZT1v2M1P86Vsvox_kC3FIl6IfYRthA_4IfEL18vdmt8FoMqJ3dkUV2N7FpOosy6dxw/exec
   のスクリプト（= LP の診断回答 action=shindan を受けているプロジェクト）に反映してください。

   対象プロジェクト（確認済み）:
     名称: ガリレオLP受信GAS
     編集URL: https://script.google.com/d/1mr89xGp224pv2zXX-9--Jz5XyItK_zPiXbR1mptzhBiTxEq8FCm3d6Q8/edit
     ※ 診断回答スプレッドシート
        「ガリレオ：【タブname変更禁止】LPアンケート診断_回答データ」
        (1FSV7hyX8lr9WD6hDV6gQJ9IjS4Z8w_M7mF1hrlB8KL0) に紐づくコンテナバインドのスクリプト。
        スプレッドシートの「拡張機能 → Apps Script」からも開けます。
     編集するファイル: コード.gs（register_v2.gs は生徒自動登録用なので触らないこと）
     ※ SHEET_ID / SHINDAN_SHEET_ID / NOTIFY_EMAIL / BRAND_NAME / SITE_URL は定義済みのため、
        下記コードはそのまま貼り付けられます。
   反映前は doPost がどの分岐にも入らず、フォーム送信が記録されません
   （no-cors 送信のため、画面上は成功表示になります）。

   手順:
   (1) 既存の doPost 内、`} else if (params.action === 'shindan') { ... }`
       の直後に【ブロック1】を貼り付ける。
   (2) ファイル末尾に【ブロック2】の4関数を貼り付ける。
   (3) 必ず「デプロイ → デプロイを管理 → 編集 → 新しいバージョン → デプロイ」。
       ※ 保存だけ／同一バージョンのままでは本番に反映されません（URLは不変）。
   (4) 反映後、thanks.html のフォームからテスト送信し、
       スプレッドシートの「無料診断_連絡先」タブに行が増えることを確認する。

   ※ docs/booking_calendar_gas.gs には反映済みです。
     同じスクリプトを使っている場合は、そのファイルの内容をそのまま貼り付けても構いません。
   ===================================================================== */


/* 【ブロック1】doPost の action 分岐に追加（shindan の直後に置く） */
//    } else if (params.action === 'shindan') {
//      saveShindanToSheet(params);
//      sendShindanNotification(params);
//    ↓↓↓ ここから追加 ↓↓↓
//    } else if (params.action === 'shindanLead') {
//      saveShindanLeadToSheet(params);
//      sendShindanLeadNotification(params);
//      sendShindanLeadThankYou(params);
//    ↑↑↑ ここまで追加 ↑↑↑
//    }


/* 【ブロック2】ファイル末尾に貼り付ける4関数 */

// ===== 診断後サンクスページの連絡先登録（診断用スプレッドシートの別タブに記録） =====
var SHINDAN_LEAD_SHEET_NAME = '無料診断_連絡先';

function saveShindanLeadToSheet(params) {
  if (!SHINDAN_LEAD_SHEET_ID_OR_DEFAULT()) return;
  var ss = SpreadsheetApp.openById(SHINDAN_LEAD_SHEET_ID_OR_DEFAULT());
  var sheet = ss.getSheetByName(SHINDAN_LEAD_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHINDAN_LEAD_SHEET_NAME); // 無ければ別タブを自動作成
    sheet.appendRow([
      'タイムスタンプ', '送信元', 'お名前', 'メールアドレス', '電話番号',
      '学年', '希望科目', '1日の学習時間', '課題量'
    ]);
  }
  // 電話番号の先頭の0が消えないよう、E列を「書式なしテキスト」に固定する
  sheet.getRange(2, 5, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  sheet.appendRow([
    new Date(),
    params.source || 'lpquestionnaire-thanks',
    params.name || '',
    params.email || '',
    params.tel || '',
    params.grade || '',
    params.subjects || '',
    params.studyTime || '',
    params.volume || ''
  ]);
  // appendRow で数値化された場合に備え、電話番号だけ文字列で入れ直す
  sheet.getRange(sheet.getLastRow(), 5).setValue(params.tel || '');
}

// 連絡先は診断回答と同じスプレッドシートの別タブに記録する
function SHINDAN_LEAD_SHEET_ID_OR_DEFAULT() {
  return SHINDAN_SHEET_ID || SHEET_ID;
}

function sendShindanLeadNotification(params) {
  if (!NOTIFY_EMAIL) return;
  var subject = '【' + BRAND_NAME + '】無料診断の連絡先登録 - ' + (params.name || '名前未入力');
  var body = [
    '===========================',
    BRAND_NAME + ' 無料診断 連絡先登録',
    '===========================',
    '',
    '■ お名前: ' + (params.name || ''),
    '■ メールアドレス: ' + (params.email || ''),
    '■ 電話番号: ' + (params.tel || ''),
    '',
    '【診断内容】',
    '■ 学年: ' + (params.grade || ''),
    '■ 希望科目: ' + (params.subjects || ''),
    '■ 1日の学習時間: ' + (params.studyTime || ''),
    '■ 課題量: ' + (params.volume || ''),
    '■ 送信元: ' + (params.source || ''),
    '',
    '---',
    '送信日時: ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  ].join('\n');
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function sendShindanLeadThankYou(params) {
  if (!params.email) return;
  var userName = params.name || 'お客様';
  var subject = '【' + BRAND_NAME + '】毎日課題ロードマップのお申し込みありがとうございます';
  var body = [
    userName + ' 様',
    '',
    'この度は' + BRAND_NAME + 'の「毎日課題ロードマップ（無料）」にお申し込みいただき、誠にありがとうございます。',
    '',
    'ご回答いただいた内容をもとに、塾長がお子様専用の毎日課題ロードマップを作成し、2日以内にこちらのメールアドレス宛にお届けします。',
    '',
    '━━━━━━━━━━━━━━━━━',
    '■ 学年: ' + (params.grade || ''),
    '■ 希望科目: ' + (params.subjects || ''),
    '■ 1日の学習時間: ' + (params.studyTime || ''),
    '■ 課題量: ' + (params.volume || ''),
    '━━━━━━━━━━━━━━━━━',
    '',
    'ご不明な点がございましたら、本メールにご返信ください。',
    '',
    '━━━━━━━━━━━━━━━━━',
    '理系の大学受験専門塾 ' + BRAND_NAME,
    'メール: galileogalilei.sciences@gmail.com',
    '公式サイト: ' + SITE_URL,
    '━━━━━━━━━━━━━━━━━',
    '',
    '※ 本メールは自動送信です。'
  ].join('\n');
  MailApp.sendEmail(params.email, subject, body);
}

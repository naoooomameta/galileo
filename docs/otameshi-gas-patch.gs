/* =====================================================================
   お試しコース申込（action=otameshi）追記パッチ
   ---------------------------------------------------------------------
   既存GASに otameshi 分岐が無い場合、以下を反映してください。

   手順:
   (1) 既存の doPost 内、`} else if (params.action === 'shindan') { ... }`
       の直後に【ブロック1】を貼り付ける。
   (2) ファイル末尾に【ブロック2】の3関数を貼り付ける。
   (3) 必ず「デプロイ → デプロイを管理 → 編集 → 新しいバージョン → デプロイ」。
       ※ 保存だけ／同一バージョンのままでは本番に反映されません（URLは不変）。
   ===================================================================== */


/* 【ブロック1】doPost の action 分岐に追加（shindan の直後に置く） */
//    } else if (params.action === 'shindan') {
//      saveShindanToSheet(params);
//      sendShindanNotification(params);
//    ↓↓↓ ここから追加 ↓↓↓
//    } else if (params.action === 'otameshi') {
//      saveOtameshiToSheet(params);
//      sendOtameshiNotification(params);
//      sendOtameshiThankYou(params);
//    ↑↑↑ ここまで追加 ↑↑↑
//    }


/* 【ブロック2】ファイル末尾に貼り付ける3関数 */

// ===== お試しコース申込（予約と同じ SHEET_ID の別タブ「お試しコース申込」に記録） =====
var OTAMESHI_SHEET_NAME = 'お試しコース申込';

function saveOtameshiToSheet(params) {
  if (!SHEET_ID) return;
  var ss = SpreadsheetApp.openById(SHEET_ID); // 予約と同じスプレッドシート
  var sheet = ss.getSheetByName(OTAMESHI_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(OTAMESHI_SHEET_NAME); // 無ければ別タブを自動作成
    sheet.appendRow([
      'タイムスタンプ', '送信元', 'お名前', 'フリガナ', 'メールアドレス',
      '電話番号', '学年', '志望大学', '体験希望科目', 'ご相談内容'
    ]);
  }
  sheet.appendRow([
    new Date(),
    params.source || 'galileo-otameshi',
    params.name || '',
    params.kana || '',
    params.email || '',
    params.tel || '',
    params.grade || '',
    params.univ || '',
    params.subject || '',
    params.message || ''
  ]);
}

function sendOtameshiNotification(params) {
  if (!NOTIFY_EMAIL) return;
  var subject = '【' + BRAND_NAME + '】お試しコース新規申込 - ' + (params.name || '名前未入力');
  var body = [
    '===========================',
    BRAND_NAME + ' お試しコース 新規申込',
    '===========================',
    '',
    '■ お名前: ' + (params.name || ''),
    '■ フリガナ: ' + (params.kana || ''),
    '■ メールアドレス: ' + (params.email || ''),
    '■ 電話番号: ' + (params.tel || ''),
    '■ 学年: ' + (params.grade || ''),
    '■ 志望大学: ' + (params.univ || ''),
    '■ 体験希望科目: ' + (params.subject || ''),
    '■ ご相談内容:',
    (params.message || ''),
    '',
    '---',
    '送信日時: ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  ].join('\n');
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function sendOtameshiThankYou(params) {
  if (!params.email) return;
  var userName = params.name || 'お客様';
  var subject = '【' + BRAND_NAME + '】お試しコースのお申し込みありがとうございます';
  var body = [
    userName + ' 様',
    '',
    'この度は' + BRAND_NAME + 'の「お試しコース」にお申し込みいただき、誠にありがとうございます。',
    '',
    '以下の内容で承りました。担当より2〜3営業日以内に、日程調整のご連絡を差し上げます。',
    '',
    '━━━━━━━━━━━━━━━━━',
    '■ お試しコース（税込 ¥3,980 / 1人1回限り）',
    '■ 学年: ' + (params.grade || ''),
    '■ 志望大学: ' + (params.univ || ''),
    '■ 体験希望科目: ' + (params.subject || ''),
    '━━━━━━━━━━━━━━━━━',
    '',
    '※ 追加費用は一切発生しません。自動継続もありません。',
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

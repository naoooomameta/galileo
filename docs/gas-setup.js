/**
 * ガリレオ問い合わせフォーム用 Google Apps Script
 *
 * 【設定手順】
 * 1. スプレッドシート（1P-3gqZ7HZwj9keBlBtmNsF8J6qcPx_XBggnJIIzTk3s）を開く
 * 2. メニュー「拡張機能」→「Apps Script」を開く
 * 3. 以下のコードを貼り付けて保存
 * 4. 「デプロイ」→「新しいデプロイ」
 *    - 種類: ウェブアプリ
 *    - アクセスできるユーザー: 全員
 * 5. 表示されたURLをコピー
 * 6. index.html の GAS_URL = '' にそのURLを貼り付ける
 *
 * 【通知メール設定】
 * NOTIFY_EMAIL を受信したいメールアドレスに変更してください
 */

// ===== 設定 =====
var SHEET_NAME = 'お問い合わせ';  // シート名（なければ自動作成）
var NOTIFY_EMAIL = 'your-email@example.com';  // 通知先メールアドレス

// ===== メイン処理 =====
function doPost(e) {
  try {
    var params = e.parameter;

    if (params.action === 'contact') {
      saveToSheet(params);
      sendNotification(params);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// スプレッドシートに記録
function saveToSheet(params) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  // シートがなければ作成
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'タイムスタンプ', '送信元', 'お名前', 'フリガナ', 'メールアドレス',
      '電話番号', '学年', '志望大学', 'お悩み・ご相談内容'
    ]);
  }

  sheet.appendRow([
    new Date(),
    params.source || '',
    params.name || '',
    params.kana || '',
    params.email || '',
    params.tel || '',
    params.grade || '',
    params.univ || '',
    params.message || ''
  ]);
}

// メール通知
function sendNotification(params) {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL === 'your-email@example.com') return;

  var subject = '【ガリレオ】新規お問い合わせ - ' + (params.name || '名前未入力');
  var body = [
    '===========================',
    'ガリレオ 新規お問い合わせ',
    '===========================',
    '',
    '■ お名前: ' + (params.name || ''),
    '■ フリガナ: ' + (params.kana || ''),
    '■ メールアドレス: ' + (params.email || ''),
    '■ 電話番号: ' + (params.tel || ''),
    '■ 学年: ' + (params.grade || ''),
    '■ 志望大学: ' + (params.univ || ''),
    '■ お悩み・ご相談内容:',
    (params.message || ''),
    '',
    '---',
    '送信日時: ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  ].join('\n');

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

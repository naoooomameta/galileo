/**
 * ガリレオ 予約カレンダー統合API（Google Apps Script）
 *
 * 【機能】
 * - GET:  Googleカレンダーの空き枠一覧を返す
 * - POST action=contact: 問い合わせ受付（スプレッドシート記録＋通知メール）
 * - POST action=booking: 予約確定（カレンダー登録＋確認メール＋スプレッドシート記録）
 *
 * 【設定手順】
 * 1. スプレッドシートを開く → メニュー「拡張機能」→「Apps Script」
 * 2. 以下のコードを貼り付けて保存
 * 3. 「デプロイ」→「新しいデプロイ」
 *    - 種類: ウェブアプリ
 *    - 実行するユーザー: 自分
 *    - アクセスできるユーザー: 全員
 * 4. 表示されたURLをコピー
 * 5. index.html の BOOKING_GAS_URL にそのURLを貼り付ける
 *
 * 【注意】
 * - 初回デプロイ時にGoogleカレンダーとGmailへのアクセス許可が求められます
 * - CALENDAR_ID は予約用カレンダーのIDに変更してください
 */

// ===== 設定 =====
var CALENDAR_ID = 'galileogalilei.sciences@gmail.com';
var SHEET_ID = '1itXiW1nHXN9Dp2loqx1izUOP_rWpe0hzTafMlJXWmN4';
var NOTIFY_EMAIL = 'galileogalilei.sciences@gmail.com';
var SLOT_DURATION_MIN = 60;                         // 1枠の長さ（分）
var START_HOUR = 10;                                // 予約受付開始時刻
var END_HOUR = 22;                                  // 予約受付終了時刻
var DAYS_AHEAD_DEFAULT = 14;                        // 何日先まで表示するか
var BRAND_NAME = 'ガリレオ';
var SITE_URL = '';                                  // ← サイトURL（メール署名用）

// ===== GET: 空き枠一覧を返す =====
function doGet(e) {
  try {
    var params = e.parameter || {};
    var limit = parseInt(params.limit) || 4;
    var daysAhead = parseInt(params.days) || DAYS_AHEAD_DEFAULT;

    var slots = getAvailableSlots(daysAhead, limit);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', slots: slots }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== POST: 問い合わせ or 予約 =====
function doPost(e) {
  try {
    var params = e.parameter;

    if (params.action === 'contact') {
      // 問い合わせ受付
      saveContactToSheet(params);
      sendContactNotification(params);

    } else if (params.action === 'booking') {
      // 予約確定
      createCalendarEvent(params);
      saveBookingToSheet(params);
      sendBookingConfirmation(params);
      sendBookingNotificationToAdmin(params);
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

// ===== 空き枠取得ロジック =====
function getAvailableSlots(daysAhead, limit) {
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) throw new Error('カレンダーが見つかりません: ' + CALENDAR_ID);

  var now = new Date();
  var slots = [];

  // 翌日から検索開始（当日は除外）
  var startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(0, 0, 0, 0);

  var endDate = new Date(now);
  endDate.setDate(endDate.getDate() + daysAhead);
  endDate.setHours(23, 59, 59, 999);

  // 期間内の既存予定を取得
  var events = cal.getEvents(startDate, endDate);

  // 日ごとにループ
  for (var d = new Date(startDate); d <= endDate && slots.length < limit; d.setDate(d.getDate() + 1)) {
    // 各日のSTART_HOUR〜END_HOURの枠をチェック
    for (var h = START_HOUR; h < END_HOUR && slots.length < limit; h++) {
      var slotStart = new Date(d);
      slotStart.setHours(h, 0, 0, 0);

      var slotEnd = new Date(d);
      slotEnd.setHours(h, SLOT_DURATION_MIN, 0, 0);

      // 過去の枠はスキップ
      if (slotStart <= now) continue;

      // 既存予定と重なるかチェック
      var isOccupied = events.some(function(ev) {
        return ev.getStartTime() < slotEnd && ev.getEndTime() > slotStart;
      });

      if (!isOccupied) {
        slots.push({
          date: Utilities.formatDate(slotStart, 'Asia/Tokyo', 'yyyy-MM-dd'),
          time: Utilities.formatDate(slotStart, 'Asia/Tokyo', 'HH:mm'),
          dayOfWeek: getDayOfWeekJa(slotStart),
          displayDate: Utilities.formatDate(slotStart, 'Asia/Tokyo', 'M月d日'),
          displayTime: Utilities.formatDate(slotStart, 'Asia/Tokyo', 'HH:mm') + '〜' +
                       Utilities.formatDate(slotEnd, 'Asia/Tokyo', 'HH:mm'),
          iso: slotStart.toISOString()
        });
      }
    }
  }

  return slots;
}

// 曜日を日本語で返す
function getDayOfWeekJa(date) {
  var days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}

// ===== カレンダーにイベント作成 =====
function createCalendarEvent(params) {
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) throw new Error('カレンダーが見つかりません');

  var startTime = new Date(params.slot_iso);
  var endTime = new Date(startTime.getTime() + SLOT_DURATION_MIN * 60 * 1000);

  var title = '【' + BRAND_NAME + '無料相談】' + (params.name || '名前未入力');

  var description = [
    '■ お名前: ' + (params.name || ''),
    '■ メール: ' + (params.email || ''),
    '■ 電話番号: ' + (params.tel || ''),
    '■ 学年: ' + (params.grade || ''),
    '■ 相談形式: ' + (params.format || ''),
    '■ 相談内容: ' + (params.concerns || ''),
    '■ 伝言: ' + (params.note || '')
  ].join('\n');

  cal.createEvent(title, startTime, endTime, {
    description: description,
    guests: params.email || ''
  });
}

// ===== スプレッドシート記録 =====
function getOrCreateSheet(sheetName, headers) {
  if (!SHEET_ID) return null;
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
  }
  return sheet;
}

function saveContactToSheet(params) {
  var sheet = getOrCreateSheet('お問い合わせ', [
    'タイムスタンプ', '送信元', 'お名前', 'フリガナ', 'メールアドレス',
    '電話番号', '学年', '志望大学', 'お悩み・ご相談内容'
  ]);
  if (!sheet) return;

  sheet.appendRow([
    new Date(),
    params.source || 'galileo',
    params.name || '',
    params.kana || '',
    params.email || '',
    params.tel || '',
    params.grade || '',
    params.univ || '',
    params.message || ''
  ]);
}

function saveBookingToSheet(params) {
  var sheet = getOrCreateSheet('予約一覧', [
    'タイムスタンプ', '予約日時', 'お名前', 'メールアドレス', '電話番号',
    '学年', '相談形式', '相談内容', '伝言'
  ]);
  if (!sheet) return;

  sheet.appendRow([
    new Date(),
    params.slot_display || '',
    params.name || '',
    params.email || '',
    params.tel || '',
    params.grade || '',
    params.format || '',
    params.concerns || '',
    params.note || ''
  ]);
}

// ===== メール送信 =====
function sendContactNotification(params) {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL === 'your-galileo@gmail.com') return;

  var subject = '【' + BRAND_NAME + '】新規お問い合わせ - ' + (params.name || '名前未入力');
  var body = [
    '===========================',
    BRAND_NAME + ' 新規お問い合わせ',
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

function sendBookingConfirmation(params) {
  // 保護者（申込者）宛の確認メール
  if (!params.email) return;

  var subject = '【' + BRAND_NAME + '】無料相談のご予約を承りました';
  var body = [
    (params.name || '') + ' 様',
    '',
    'この度は' + BRAND_NAME + 'へのご相談予約ありがとうございます。',
    '下記の日程にて無料相談を承りました。',
    '',
    '━━━━━━━━━━━━━━━━━',
    '■ 予約日時: ' + (params.slot_display || ''),
    '■ 相談形式: ' + (params.format || ''),
    '━━━━━━━━━━━━━━━━━',
    '',
    '当日はお子様の学習状況や志望校について、',
    'お気軽にご相談ください。',
    '',
    '※ オンラインの場合、ZoomのURLを前日までにメールでお送りします。',
    '※ ご都合が悪くなった場合は、お早めにご連絡ください。',
    '',
    '━━━━━━━━━━━━━━━━━',
    BRAND_NAME + ' — 理系の大学受験専門オンライン塾',
    SITE_URL ? SITE_URL : '',
    '━━━━━━━━━━━━━━━━━'
  ].join('\n');

  MailApp.sendEmail(params.email, subject, body);
}

function sendBookingNotificationToAdmin(params) {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL === 'your-galileo@gmail.com') return;

  var subject = '【' + BRAND_NAME + '】新規予約 - ' + (params.name || '名前未入力') + ' ' + (params.slot_display || '');
  var body = [
    '===========================',
    BRAND_NAME + ' 新規予約',
    '===========================',
    '',
    '■ 予約日時: ' + (params.slot_display || ''),
    '■ お名前: ' + (params.name || ''),
    '■ メール: ' + (params.email || ''),
    '■ 電話番号: ' + (params.tel || ''),
    '■ 学年: ' + (params.grade || ''),
    '■ 相談形式: ' + (params.format || ''),
    '■ 相談内容: ' + (params.concerns || ''),
    '■ 伝言: ' + (params.note || ''),
    '',
    '---',
    '送信日時: ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  ].join('\n');

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

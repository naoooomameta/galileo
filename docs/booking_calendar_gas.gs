/**
 * ガリレオ 予約カレンダー統合API（Google Apps Script）
 *
 * 【機能】
 * - GET:  Googleカレンダーの空き枠一覧を返す
 * - POST action=contact: 問い合わせ受付（スプレッドシート記録＋通知メール＋自動返信メール）
 * - POST action=booking: 予約確定（カレンダー登録＋確認メール＋スプレッドシート記録）
 * - POST action=shindan: 無料合格診断の回答記録（診断用スプレッドシートに記録＋通知メール）
 * - POST action=otameshi: お試しコース申込（同じシートの別タブ「お試しコース申込」に記録＋通知メール＋自動返信メール）
 */

// ===== 設定 =====
var CALENDAR_ID = 'galileogalilei.sciences@gmail.com';
var SHEET_ID = '1itXiW1nHXN9Dp2loqx1izUOP_rWpe0hzTafMlJXWmN4';
var SHINDAN_SHEET_ID = '1FSV7hyX8lr9WD6hDV6gQJ9IjS4Z8w_M7mF1hrlB8KL0'; // 無料合格診断の回答記録先
var NOTIFY_EMAIL = 'galileogalilei.sciences@gmail.com';
var SLOT_DURATION_MIN = 60;
var START_HOUR = 10;
var END_HOUR = 22;
var DAYS_AHEAD_DEFAULT = 14;
var BRAND_NAME = 'ガリレオ';
var SITE_URL = 'https://galileo-sciences.com/';

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
      saveContactToSheet(params);
      sendContactNotification(params);
      sendThankYouToUser(params);
    } else if (params.action === 'booking') {
      createCalendarEvent(params);
      saveBookingToSheet(params);
      sendBookingConfirmation(params);
      sendBookingNotificationToAdmin(params);
    } else if (params.action === 'shindan') {
      saveShindanToSheet(params);
      sendShindanNotification(params);
    } else if (params.action === 'otameshi') {
      saveOtameshiToSheet(params);
      sendOtameshiNotification(params);
      sendOtameshiThankYou(params);
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
  var startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(0, 0, 0, 0);
  var endDate = new Date(now);
  endDate.setDate(endDate.getDate() + daysAhead);
  endDate.setHours(23, 59, 59, 999);
  var events = cal.getEvents(startDate, endDate);
  for (var d = new Date(startDate); d <= endDate && slots.length < limit; d.setDate(d.getDate() + 1)) {
    for (var h = START_HOUR; h < END_HOUR && slots.length < limit; h++) {
      var slotStart = new Date(d);
      slotStart.setHours(h, 0, 0, 0);
      var slotEnd = new Date(d);
      slotEnd.setHours(h, SLOT_DURATION_MIN, 0, 0);
      if (slotStart <= now) continue;
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
  var title = '【' + BRAND_NAME + '学習相談会】' + (params.name || '名前未入力');
  var description = [
    '■ お名前: ' + (params.name || ''),
    '■ メール: ' + (params.email || ''),
    '■ 電話番号: ' + (params.tel || ''),
    '■ 相談形式: ' + (params.format || ''),
    '■ 相談内容: ' + (params.concerns || ''),
    '■ 伝言: ' + (params.note || '')
  ].join('\n');
  cal.createEvent(title, startTime, endTime, {
    description: description,
    guests: params.email || ''
  });
}

// ===== スプレッドシート記録（統合シート） =====
var SHEET_NAME = '公式サイト_予約一覧';

function getOrCreateSheet() {
  if (!SHEET_ID) return null;
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'タイムスタンプ', '種別', '送信元', 'お名前', 'フリガナ', 'メールアドレス',
      '電話番号', '学年', '志望大学', '予約日時', '相談形式', '相談内容', '伝言'
    ]);
  }
  return sheet;
}

function saveContactToSheet(params) {
  var sheet = getOrCreateSheet();
  if (!sheet) return;
  sheet.appendRow([
    new Date(),
    'お問い合わせ',
    params.source || 'galileo',
    params.name || '',
    params.kana || '',
    params.email || '',
    params.tel || '',
    params.grade || '',
    params.univ || '',
    '',
    '',
    params.message || '',
    ''
  ]);
}

function saveBookingToSheet(params) {
  var sheet = getOrCreateSheet();
  if (!sheet) return;
  sheet.appendRow([
    new Date(),
    '予約',
    'galileo',
    params.name || '',
    '',
    params.email || '',
    params.tel || '',
    '',
    '',
    params.slot_display || '',
    params.format || '',
    params.concerns || '',
    params.note || ''
  ]);
}

// ===== 無料合格診断の回答記録 =====
var SHINDAN_SHEET_NAME = '無料診断';

function saveShindanToSheet(params) {
  if (!SHINDAN_SHEET_ID) return;
  var ss = SpreadsheetApp.openById(SHINDAN_SHEET_ID);
  var sheet = ss.getSheetByName(SHINDAN_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHINDAN_SHEET_NAME);
    sheet.appendRow([
      'タイムスタンプ', '送信元', '学年', '希望科目', '1日の学習時間', '課題量'
    ]);
  }
  sheet.appendRow([
    new Date(),
    params.source || 'galileo',
    params.grade || '',
    params.subjects || '',
    params.studyTime || '',
    params.volume || ''
  ]);
}

function sendShindanNotification(params) {
  if (!NOTIFY_EMAIL) return;
  var subject = '【' + BRAND_NAME + '】無料合格診断の新規回答';
  var body = [
    '===========================',
    BRAND_NAME + ' 無料合格診断 新規回答',
    '===========================',
    '',
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

// ===== お試しコース申込（同じSHEET_IDの別タブに記録） =====
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

// ===== お試しコース申込: 管理者への通知メール =====
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

// ===== お試しコース申込: 申込者への自動返信メール =====
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

// ===== 管理者への通知メール =====
function sendContactNotification(params) {
  if (!NOTIFY_EMAIL) return;
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

// ===== 問い合わせ者への自動返信メール（サンクスメール） =====
function sendThankYouToUser(params) {
  if (!params.email) return;
  var userName = params.name || 'お客様';
  var subject = '【' + BRAND_NAME + '】（完全無料）体験学習会付き／合格最短ルート診断 学習相談会へのお申し込みありがとうございます';
  var body = [
    userName + ' 様',
    '',
    'この度は（完全無料）体験学習会付き／合格最短ルート診断 学習相談会にお申し込みいただき、誠にありがとうございます。',
    '',
    '保護者さま・お子さま・講師の三位一体で、合格に近づく。理系の大学受験専門塾 ガリレオです。',
    '',
    'あらためまして、お電話、またはメールにてご予約日のご連絡をさせていただきます。',
    '',
    '--------------------------------------',
    '',
    'メールでのご予約確定をご希望される方は、下記予約フォームから日程調整のご登録をいただく形で、お願いいたします。',
    '⇒ https://timerex.net/s/Galileo-sciences/ae0b6b46',
    '',
    '--------------------------------------',
    '',
    '',
    '【当塾について】',
    '--------------------------------------',
    '以下URLより、当塾のサービス全体の概要資料をご覧いただけます。',
    '',
    '■ 公式サイト',
    '⇒ https://galileo-sciences.com',
    '',
    '■ 当塾の『指導システム』について',
    '⇒ https://drive.google.com/file/d/1MA1SnBpEmFA_k-jmvbHop3bvCmG7ATY3/view?usp=sharing',
    '',
    '■ 当塾の『毎日課題』について',
    '⇒ https://drive.google.com/file/d/1gYTN22vds6HQdScLIvDtWJl8vjnW96Ia/view?usp=sharing',
    '',
    '',
    'ガリレオではオンラインでの学習相談会（完全無料）を推奨しております。',
    '',
    '親御さま・お子さまのご状況を伺ったうえで、',
    '',
    '・毎日の学習をどのように支えるのか',
    '・学習を継続的にサポートする仕組み',
    '・志望校合格までの具体的な道筋',
    '',
    'について、画面を共有しながらわかりやすくご説明いたします。',
    '',
    'まだご予約がお済みでない方は、下記URLよりご都合の良い日時をご指定ください。',
    '',
    '（※すでにご予約済みの方は、当日お話できることを楽しみにしております。）',
    '',
    '◆ オンライン（ご面談）予約フォーム',
    '⇒ https://timerex.net/s/Galileo-sciences/ae0b6b46',
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    'ご不明な点がございましたら、下記までお気軽にご連絡ください。',
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '理系の大学受験専門塾 ガリレオ',
    '代表 佐野 翼',
    'メール: galileogalilei.sciences@gmail.com',
    'Instagram: https://www.instagram.com/galileo_sciences/',
    '公式サイト: https://galileo-sciences.com',
    '━━━━━━━━━━━━━━━━━━━━',
    '',
    '※ 本メールは自動送信です。',
    'ご連絡は上記メールアドレス宛にお願いいたします。'
  ].join('\n');
  MailApp.sendEmail(params.email, subject, body);
}

// ===== 予約確定時の確認メール =====
function sendBookingConfirmation(params) {
  if (!params.email) return;
  var subject = '【' + BRAND_NAME + '】学習相談会のご予約を承りました';
  var body = [
    (params.name || '') + ' 様',
    '',
    'この度は' + BRAND_NAME + 'へのお問い合わせありがとうございます。',
    '下記の日程にて学習相談会を承りました。',
    '',
    '━━━━━━━━━━━━━━━━━',
    '■ 予約日時: ' + (params.slot_display || ''),
    '■ 相談形式: ' + (params.format || ''),
    '━━━━━━━━━━━━━━━━━',
    '',
    '当日はお子様の学習状況や志望校について、',
    'お気軽にご相談ください。',
    '',
    '※ オンラインの場合、Google MeetのURLを前日までにメールでお送りします。',
    '※ ご都合が悪くなった場合は、お早めにご連絡ください。',
    '',
    '━━━━━━━━━━━━━━━━━',
    '理系の大学受験専門塾 ' + BRAND_NAME,
    SITE_URL ? SITE_URL : '',
    '━━━━━━━━━━━━━━━━━'
  ].join('\n');
  MailApp.sendEmail(params.email, subject, body);
}

// ===== 管理者への予約通知 =====
function sendBookingNotificationToAdmin(params) {
  if (!NOTIFY_EMAIL) return;
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
    '■ 相談形式: ' + (params.format || ''),
    '■ 相談内容: ' + (params.concerns || ''),
    '■ 伝言: ' + (params.note || ''),
    '',
    '---',
    '送信日時: ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  ].join('\n');
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

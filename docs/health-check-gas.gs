/**
 * 予約API 死活監視スクリプト（Google Apps Script）
 *
 * 【目的】
 * 予約GAS（空き枠API）がJSON以外（ログインページ・エラーページ等）を
 * 返す状態になったら、管理者へメールで自動通知する。
 * 「気づいたら何日も予約できなかった」を防ぐための監視。
 *
 * 【セットアップ手順】
 * 1. https://script.google.com/ で「新しいプロジェクト」を作成
 *    （既存の予約GASプロジェクトに追加してもよいが、監視対象が死んでいても
 *      監視だけは動くよう、別プロジェクトを推奨）
 * 2. このファイルの内容をまるごと貼り付けて保存
 * 3. MONITOR_TARGETS のURL・ALERT_EMAIL を確認（LPのGAS URLが別なら追記）
 * 4. エディタ上部で関数 setupHealthCheckTrigger を選んで「実行」
 *    → 初回は権限承認が出るので許可する
 *    → これで1時間ごとの自動チェックが有効になる
 * 5. 動作確認: 関数 checkApiHealth を手動実行し、実行ログにOKが並べば完了
 *
 * 【通知の仕様】
 * - 異常を検知した瞬間に1通（同じ異常が続いても連投しない）
 * - 復旧した瞬間に1通
 */

// ===== 設定 =====
var MONITOR_TARGETS = [
  {
    name: 'ガリレオ公式サイト 予約API',
    url: 'https://script.google.com/macros/s/AKfycbzleIs1DqaybK2orps2tQwLCDimHb_7_5CQ0AV4IMD1gN3kVtjOUuD-2EA2-tCGDCo/exec?limit=1'
  },
  {
    name: 'プラトン公式サイト 予約API',
    url: 'https://script.google.com/macros/s/AKfycbwrX64y_igArlYnE7JUS42uCswPldC9FlR8teSMAKqOzKRdUexdfexE_uX8ftNj8_tj/exec?limit=1'
  }
  // 広告LP（teacher-sano.com/thank-galileo）のGASが上記と別URLの場合はここに追加:
  // , { name: 'ガリレオ広告LP 予約API', url: 'https://script.google.com/macros/s/XXXX/exec?limit=1' }
];

var ALERT_EMAIL = 'galileogalilei.sciences@gmail.com';

// ===== メイン: 1時間ごとにトリガーから呼ばれる =====
function checkApiHealth() {
  var props = PropertiesService.getScriptProperties();

  MONITOR_TARGETS.forEach(function (target) {
    var result = checkOneTarget_(target);
    var stateKey = 'hc_state_' + target.name;
    var prevState = props.getProperty(stateKey) || 'ok';

    if (!result.ok && prevState === 'ok') {
      // 正常 → 異常: アラート送信
      props.setProperty(stateKey, 'ng');
      MailApp.sendEmail(
        ALERT_EMAIL,
        '【要対応】予約APIが異常応答: ' + target.name,
        '予約APIの死活監視で異常を検知しました。\n\n' +
        '■ 対象: ' + target.name + '\n' +
        '■ URL: ' + target.url + '\n' +
        '■ 検知内容: ' + result.detail + '\n\n' +
        '【よくある原因と対処】\n' +
        '1. デプロイの「アクセスできるユーザー」が「全員」になっていない\n' +
        '   → Apps Script > デプロイ > デプロイを管理 > 鉛筆マーク >\n' +
        '     アクセスできるユーザー「全員」で新しいバージョンをデプロイ\n' +
        '2. デプロイがアーカイブ/削除された → 復元 or 再デプロイしてURLを差し替え\n' +
        '3. Googleの一時障害・クォータ超過 → 時間をおいて自然回復を確認\n\n' +
        '復旧すると自動で復旧通知が届きます。'
      );
    } else if (result.ok && prevState === 'ng') {
      // 異常 → 復旧: 復旧通知
      props.setProperty(stateKey, 'ok');
      MailApp.sendEmail(
        ALERT_EMAIL,
        '【復旧】予約APIが正常に戻りました: ' + target.name,
        '予約APIが正常応答（JSON）に戻ったことを確認しました。\n\n' +
        '■ 対象: ' + target.name + '\n' +
        '■ URL: ' + target.url
      );
    }

    Logger.log('[%s] %s %s', target.name, result.ok ? 'OK' : 'NG', result.detail || '');
  });
}

// ===== 1件チェック =====
function checkOneTarget_(target) {
  var text, code;
  try {
    var sep = target.url.indexOf('?') >= 0 ? '&' : '?';
    var res = UrlFetchApp.fetch(target.url + sep + '_hc=' + new Date().getTime(), {
      muteHttpExceptions: true,
      followRedirects: true
    });
    code = res.getResponseCode();
    text = res.getContentText();
  } catch (e) {
    return { ok: false, detail: '通信エラー: ' + String(e).slice(0, 200) };
  }

  if (code !== 200) {
    return { ok: false, detail: 'HTTP ' + code + ': ' + String(text).slice(0, 200) };
  }

  var data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    // ログインページ等のHTMLが返っている状態（今回起きたエラーと同じ）
    return { ok: false, detail: 'JSONではない応答（ログインページ/エラーページの可能性）: ' + String(text).slice(0, 200) };
  }

  // ガリレオ形式 {result:'success', slots:[...]} / プラトン形式 {slots:[...]} の両方を許容
  if (data && (data.result === 'success' || Array.isArray(data.slots))) {
    return { ok: true };
  }
  return { ok: false, detail: 'JSONだが内容が異常: ' + String(text).slice(0, 200) };
}

// ===== 初回のみ実行: 1時間ごとのトリガーを設置 =====
function setupHealthCheckTrigger() {
  // 二重登録を防ぐため既存の同名トリガーを削除
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'checkApiHealth') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('checkApiHealth').timeBased().everyHours(1).create();
  Logger.log('1時間ごとの死活監視トリガーを設置しました');
}

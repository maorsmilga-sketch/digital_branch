/**
 * Google Apps Script — "הסניף הדיגטלי" join-form handler
 *
 * HOW TO DEPLOY:
 *  1. Open your Google Apps Script project
 *  2. Replace the existing code with the contents of this file
 *  3. Click Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy
 *  4. Accept the permissions prompt (Gmail + Drive access required)
 *  5. If the deployment URL changes, update SHEETS_WEB_APP_URL in join.html
 */

/** Email address that receives the signed PDF — change here as needed */
var RECIPIENT_EMAIL = "maorsmilga@gmail.com";

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(e.postData.contents);

    saveToSheet(data);
    logMessage("INFO", "Sheet saved: " + data.firstName + " " + data.lastName);

    var result = buildPdf(data);
    var pdfBlob = result.pdf;
    var sigBlob = result.sigBlob;
    logMessage("INFO", "PDF built: " + data.firstName + " " + data.lastName);

    var subject = "הסניף הדיגיטלי - הצטרפות - " + data.firstName + " " + data.lastName;
    var fileName = "הצטרפות-" + data.firstName + "-" + data.lastName + ".pdf";

    var emailHtml = '<div dir="rtl" style="font-family:Arial,sans-serif;">'
      + '<h2>טופס הצטרפות חדש</h2>'
      + '<p><strong>שם:</strong> ' + escHtml(data.firstName) + ' ' + escHtml(data.lastName) + '</p>'
      + '<p><strong>טלפון:</strong> ' + escHtml(data.phone) + '</p>'
      + '<p><strong>כינוי:</strong> ' + escHtml(data.nickname) + '</p>'
      + '<p><strong>תאריך:</strong> ' + escHtml(data.createdAt) + '</p>'
      + '<hr/>'
      + '<p><strong>חתימה דיגיטלית:</strong></p>'
      + (sigBlob ? '<img src="cid:signature" style="max-width:300px;"/>' : '<p>(ללא חתימה)</p>')
      + '<hr/>'
      + '<p style="color:#888;font-size:12px;">ה-PDF המלא עם התקנון מצורף למייל זה.</p>'
      + '</div>';

    var inlineImages = {};
    if (sigBlob) {
      inlineImages.signature = sigBlob;
    }

    MailApp.sendEmail({
      to: RECIPIENT_EMAIL,
      subject: subject,
      body: "טופס הצטרפות חדש מ-" + data.firstName + " " + data.lastName,
      htmlBody: emailHtml,
      inlineImages: inlineImages,
      attachments: [pdfBlob.setName(fileName)]
    });
    logMessage("INFO", "Email sent: " + data.firstName + " " + data.lastName);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    logMessage("ERROR", err.message + "\n" + err.stack);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  var quotaText;
  try {
    quotaText = MailApp.getRemainingDailyQuota();
  } catch (e) {
    quotaText = "לא ניתן לבדוק — יש לאשר הרשאות Gmail בעורך הסקריפט";
  }
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;padding:40px;direction:rtl;text-align:center;">'
    + '<h2>הסניף הדיגטלי — Apps Script</h2>'
    + '<p style="color:green;font-size:18px;">&#10003; הסקריפט פעיל ומוכן</p>'
    + '<p style="color:#666;">מכסת מיילים יומית שנותרה: ' + quotaText + '</p>'
    + '</div>'
  );
}

// ---------------------------------------------------------------------------
// Logging — writes to a "Logs" tab in the spreadsheet
// ---------------------------------------------------------------------------

function logMessage(level, message) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName("Logs");
    if (!logSheet) {
      logSheet = ss.insertSheet("Logs");
      logSheet.appendRow(["Timestamp", "Level", "Message"]);
      logSheet.setFrozenRows(1);
    }
    logSheet.appendRow([new Date().toISOString(), level, message]);
  } catch (ignored) {}
}

// ---------------------------------------------------------------------------
// Save form data to the first sheet
// ---------------------------------------------------------------------------

function saveToSheet(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  sheet.appendRow([
    data.firstName,
    data.lastName,
    data.phone,
    data.nickname,
    data.termsApprovedText,
    data.termsApprovedAt,
    data.createdAt,
    data.ipAddress,
    data.locationText,
    data.latitude,
    data.longitude,
    data.deviceInfo,
    data.timezone
  ]);
}

// ---------------------------------------------------------------------------
// Build a PDF with the terms + signer details + signature image
// ---------------------------------------------------------------------------

function buildPdf(data) {
  var sigImageTag = "";

  if (data.signatureBase64) {
    sigImageTag = '<div class="sig-image">'
      + '<p style="color:#666;font-size:12px;">חתימה דיגיטלית:</p>'
      + '<img src="' + data.signatureBase64 + '" alt="חתימה" style="max-width:300px;height:auto;border:1px solid #ccc;border-radius:6px;padding:8px;background:#fff;"/>'
      + '</div>';
  }

  var html = '<!DOCTYPE html>'
    + '<html dir="rtl" lang="he"><head><meta charset="UTF-8"/>'
    + '<style>'
    + 'body{font-family:Arial,sans-serif;direction:rtl;color:#1a1a1a;padding:40px;line-height:1.8;}'
    + 'h1{text-align:center;color:#111;font-size:22px;margin-bottom:4px;}'
    + '.subtitle{text-align:center;color:#666;font-size:13px;margin-bottom:30px;}'
    + 'h2{font-size:15px;color:#222;margin:18px 0 6px;}'
    + 'p{font-size:13px;color:#333;margin:4px 0;}'
    + '.divider{border:none;border-top:1px solid #ddd;margin:24px 0;}'
    + '.sig-block{margin-top:30px;border:1px solid #ddd;border-radius:8px;padding:20px;background:#fafafa;}'
    + '.sig-block h3{font-size:15px;margin-bottom:12px;color:#222;}'
    + '.sig-block p{margin:4px 0;}'
    + '.sig-image{margin-top:12px;text-align:center;}'
    + '.footer-note{text-align:center;font-size:11px;color:#999;margin-top:30px;}'
    + '</style></head><body>'
    + '<h1>הסניף הדיגטלי</h1>'
    + '<p class="subtitle">קהילת פוקר לשחקנים שחושבים קדימה</p>'
    + '<h1 style="font-size:18px;">תקנון ותנאי שימוש</h1>'
    + (data.termsHtml || '')
    + '<hr class="divider"/>'
    + '<div class="sig-block">'
    + '<h3>פרטי החותם/ת:</h3>'
    + '<p><strong>שם פרטי:</strong> ' + escHtml(data.firstName) + '</p>'
    + '<p><strong>שם משפחה:</strong> ' + escHtml(data.lastName) + '</p>'
    + '<p><strong>טלפון:</strong> ' + escHtml(data.phone) + '</p>'
    + '<p><strong>כינוי:</strong> ' + escHtml(data.nickname) + '</p>'
    + '<p><strong>תאריך:</strong> ' + escHtml(data.createdAt) + '</p>'
    + sigImageTag
    + '</div>'
    + '<p class="footer-note">מסמך זה הופק באופן אוטומטי על ידי מערכת הסניף הדיגטלי</p>'
    + '</body></html>';

  var pdfBlob = HtmlService.createHtmlOutput(html).getAs('application/pdf');
  return { pdf: pdfBlob, tempFile: null, sigBlob: getSigBlob(data) };
}

function getSigBlob(data) {
  if (!data.signatureBase64) return null;
  var base64Data = data.signatureBase64.replace(/^data:image\/\w+;base64,/, "");
  return Utilities.newBlob(Utilities.base64Decode(base64Data), "image/png", "signature.png");
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Run this function ONCE from the editor to grant all required permissions.
// Select "testAuth" from the function dropdown at the top, then click Run.
// ---------------------------------------------------------------------------

function testAuth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("Spreadsheet OK: " + ss.getName());

  var quota = MailApp.getRemainingDailyQuota();
  Logger.log("MailApp OK — daily quota remaining: " + quota);

  var tempFile = DriveApp.createFile("hasnif-test.txt", "test", "text/plain");
  Logger.log("DriveApp OK — created temp file: " + tempFile.getId());
  tempFile.setTrashed(true);
  Logger.log("Temp file deleted.");

  Logger.log("All permissions granted successfully!");
}

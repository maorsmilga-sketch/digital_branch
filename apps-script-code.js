/**
 * Google Apps Script — "הסניף הדיגטלי" join-form handler
 *
 * HOW TO DEPLOY:
 *  1. Open your Google Apps Script project
 *  2. Replace the existing code with the contents of this file
 *  3. Click Deploy > New deployment
 *  4. If the deployment URL changes, update SHEETS_WEB_APP_URL in join.html
 */

/** Email address that receives the signed PDF — change here as needed */
const RECIPIENT_EMAIL = "maorsmilga@gmail.com";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);

    saveToSheet(data);

    const pdf = buildPdf(data);

    const subject = "הסניף הדיגיטלי - הצטרפות - " + data.firstName + " " + data.lastName;
    const fileName = "הצטרפות-" + data.firstName + "-" + data.lastName + ".pdf";

    MailApp.sendEmail({
      to: RECIPIENT_EMAIL,
      subject: subject,
      body: "טופס הצטרפות חדש מ-" + data.firstName + " " + data.lastName,
      attachments: [pdf.setName(fileName)]
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

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

function buildPdf(data) {
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
    + '.sig-image img{max-width:300px;height:auto;border:1px solid #ccc;border-radius:6px;padding:8px;background:#fff;}'
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
    + '<div class="sig-image">'
    + '<p style="color:#666;font-size:12px;">חתימה דיגיטלית:</p>'
    + '<img src="' + data.signatureBase64 + '" alt="חתימה"/>'
    + '</div>'
    + '</div>'
    + '<p class="footer-note">מסמך זה הופק באופן אוטומטי על ידי מערכת הסניף הדיגטלי</p>'
    + '</body></html>';

  return HtmlService.createHtmlOutput(html).getAs('application/pdf');
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


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
    + '<div class="intro">'
    + '<p>ברוכים הבאים לאתר "הסניף הדיגטלי" (להלן: "האתר").</p>'
    + '<p>השימוש באתר, בתכניו, בטפסים שבו ובשירותים המוצעים במסגרתו כפוף לתנאים המפורטים בתקנון זה.</p>'
    + '<p>כל גולש, משתמש, נרשם או חבר קהילה באתר מצהיר כי קרא את התקנון, הבין אותו, ומסכים להוראותיו.</p>'
    + '</div>'
    + '<hr class="divider"/>'
    + getTermsSectionsHtml()
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

function getTermsSectionsHtml() {
  return ''
    + '<h2>1. הגדרות</h2>'
    + '<p>1.1. "האתר" – אתר "הסניף הדיגטלי", לרבות כל עמוד, תוכן, שירות, טופס, מערכת וערוץ תקשורת המשויך אליו.</p>'
    + '<p>1.2. "מפעילי האתר" – בעלי האתר, מנהליו, עובדיו, נציגיו, ספקיו, או מי מטעמם.</p>'
    + '<p>1.3. "המשתמש" – כל אדם העושה שימוש באתר, בין אם נרשם אליו ובין אם לאו.</p>'
    + '<p>1.4. "התוכן" – כל מידע, מאמר, מדריך, שיעור, סרטון, טיפ, קובץ, עיצוב, טקסט, תמונה, סימן מסחר או חומר אחר המופיע באתר.</p>'
    + '<p>1.5. "הקהילה" – מסגרת קהילתית סגורה או פתוחה, לפי שיקול דעת מפעילי האתר, המיועדת ללמידה, שיח, שיתוף ידע ותוכן בתחום הפוקר.</p>'

    + '<h2>2. מטרת האתר</h2>'
    + '<p>2.1. האתר נועד לשמש כפלטפורמה לתוכן, לימוד, העשרה וקהילה בתחום הפוקר.</p>'
    + '<p>2.2. האתר עשוי לכלול מאמרים, סרטוני הדרכה, טיפים, חומרי לימוד, הסברים אסטרטגיים, תכנים קהילתיים, טפסי הצטרפות, ועדכונים שונים.</p>'
    + '<p>2.3. התכנים באתר נועדו למטרות מידע, פנאי, למידה והעשרה בלבד.</p>'
    + '<p>2.4. אין לראות בתוכן באתר כהבטחה לתוצאה כלשהי, כהמלצה אישית, או כייעוץ מקצועי, משפטי, פיננסי או אחר.</p>'

    + '<h2>3. כשירות לשימוש באתר</h2>'
    + '<p>3.1. השימוש באתר מיועד לבגירים בלבד, מעל גיל 18.</p>'
    + '<p>3.2. משתמש המבצע הרשמה, מילוי טופס או פנייה דרך האתר מצהיר כי הוא בגיר וכשיר לבצע פעולות משפטיות מחייבות.</p>'
    + '<p>3.3. מפעילי האתר רשאים לדרוש, בכל עת ולפי שיקול דעתם, פרטים נוספים לצורך אימות זהות או מניעת שימוש בלתי ראוי.</p>'

    + '<h2>4. הרשמה ומסירת פרטים</h2>'
    + '<p>4.1. חלק מהשירותים באתר עשויים לדרוש מסירת פרטים, לרבות שם פרטי, שם משפחה, מספר טלפון וכינוי באפליקציה או במערכת רלוונטית.</p>'
    + '<p>4.2. המשתמש מתחייב למסור פרטים נכונים, מדויקים ומעודכנים.</p>'
    + '<p>4.3. חל איסור לבצע הרשמה בשם כוזב, עבור אדם אחר ללא הרשאתו, או תוך התחזות.</p>'
    + '<p>4.4. מפעילי האתר יהיו רשאים שלא לאשר הרשמה, להשעות משתמש או למחוק רישום, לפי שיקול דעתם הבלעדי.</p>'

    + '<h2>5. אופי השירות והתוכן</h2>'
    + '<p>5.1. האתר מספק תוכן לימודי וקהילתי בלבד.</p>'
    + '<p>5.2. כל תוכן באתר ניתן כפי שהוא (AS IS), לצורכי מידע והעשרה בלבד.</p>'
    + '<p>5.3. מפעילי האתר אינם מתחייבים לדיוק, שלמות או התאמה אישית של התוכן.</p>'
    + '<p>5.4. כל הסתמכות על התוכן היא באחריות המשתמש בלבד.</p>'

    + '<h2>6. שימוש מותר באתר</h2>'
    + '<p>6.1. שימוש אישי, סביר וחוקי בלבד.</p>'
    + '<p>6.2. אין להעתיק, להפיץ, לשכפל או לעשות שימוש מסחרי בתוכן ללא אישור.</p>'
    + '<p>6.3. אין לפגוע באתר, במשתמשים אחרים או במפעילים.</p>'

    + '<h2>7. כללי קהילה</h2>'
    + '<p>7.1. יש להתנהל בכבוד ובהגינות.</p>'
    + '<p>7.2. אין לפרסם תוכן פוגעני, מטעה או בלתי חוקי.</p>'
    + '<p>7.3. מפעילי האתר רשאים להסיר תוכן או לחסום משתמשים.</p>'

    + '<h2>8. היעדר אחריות לתוצאות</h2>'
    + '<p>8.1. אין התחייבות להצלחה או תוצאות כלשהן.</p>'
    + '<p>8.2. כל פעולה של המשתמש היא באחריותו בלבד.</p>'
    + '<p>8.3. מפעילי האתר לא יישאו באחריות לנזקים מכל סוג.</p>'

    + '<h2>9. צדדים שלישיים</h2>'
    + '<p>9.1. ייתכנו קישורים ותכנים חיצוניים.</p>'
    + '<p>9.2. האחריות על השימוש בהם היא של המשתמש בלבד.</p>'

    + '<h2>10. קניין רוחני</h2>'
    + '<p>כל הזכויות באתר שייכות למפעילי האתר ואין לעשות שימוש ללא אישור.</p>'

    + '<h2>11. פרטיות</h2>'
    + '<p>11.1. המידע שנמסר ישמש לתפעול האתר והקהילה.</p>'
    + '<p>11.2. תישמר סבירות בהגנה על מידע אך אין הבטחה מוחלטת.</p>'
    + '<p>11.3. המשתמש מאשר קבלת הודעות הקשורות לפעילות האתר.</p>'

    + '<h2>12. זמינות ושינויים</h2>'
    + '<p>12.1. אין התחייבות לזמינות מלאה.</p>'
    + '<p>12.2. האתר והתנאים עשויים להשתנות בכל עת.</p>'

    + '<h2>13. הגבלת אחריות</h2>'
    + '<p>השימוש באתר הוא באחריות המשתמש בלבד, ללא אחריות לנזקים ישירים או עקיפים.</p>'

    + '<h2>14. שיפוי</h2>'
    + '<p>המשתמש מתחייב לשפות את מפעילי האתר בגין כל נזק שייגרם עקב הפרת התקנון.</p>'

    + '<h2>15. חסימת גישה</h2>'
    + '<p>מפעילי האתר רשאים לחסום משתמש לפי שיקול דעתם.</p>'

    + '<h2>16. דין וסמכות שיפוט</h2>'
    + '<p>על התקנון יחולו דיני מדינת ישראל בלבד.</p>'
    + '<p>סמכות השיפוט הבלעדית תהיה לבתי המשפט המוסמכים במחוז חיפה.</p>'

    + '<h2>17. יצירת קשר</h2>'
    + '<p>ניתן ליצור קשר דרך פרטי ההתקשרות באתר.</p>';
}

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

module.exports = async function (req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { emailTo, name, taxYear, score, refundMin, refundMax, probability, reasons, documents } = req.body;

  if (!emailTo) {
    return res.status(400).json({ error: 'Missing recipient email' });
  }

  const GMAIL_USER = process.env.GMAIL_USER || 'contact.ez.security@gmail.com';
  const GMAIL_PASS = process.env.GMAIL_PASS; // App password from Vercel env

  if (!GMAIL_PASS) {
    return res.status(500).json({ error: 'Server configuration error: GMAIL_PASS is not set in environment variables.' });
  }

  // Map year to PDF file
  const FORM_135_FILES = {
    2020: 'Service_Pages_Income_tax_annual-report-2020_135 - 2020.pdf',
    2021: 'Service_Pages_Income_tax_annual-report-2021_135 - 2021.pdf',
    2022: 'Service_Pages_Income_tax_annual-report-2022_annual-singular-report-2022_135-2022.pdf',
    2023: 'Service_Pages_Income_tax_annual-report-2023_135-2023.pdf',
    2024: 'Service_Pages_Income_tax_annual-report-2024_135-2024.pdf',
    2025: 'Service_Pages_Income_tax_annual-report-2026_itc135-2025.pdf'
  };

  const formFilename = FORM_135_FILES[taxYear] || FORM_135_FILES[2025];
  const filePath = path.join(process.cwd(), 'All Attachments', formFilename);

  let attachments = [];
  try {
    if (fs.existsSync(filePath)) {
      attachments.push({
        filename: `טופס 135 - שנת ${taxYear}.pdf`,
        path: filePath
      });
    } else {
      console.warn('Attachment file not found at:', filePath);
    }
  } catch (err) {
    console.error('Failed to resolve attachment file:', err);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"EZ Tax" <${GMAIL_USER}>`,
    to: emailTo,
    subject: `💰 תוצאות בדיקת הזכאות שלך + הטפסים המוכנים להגשה לשנת ${taxYear}`,
    html: `
      <div style="direction: rtl; text-align: right; font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">בדיקת הזכאות שלך ב-EZ Tax הושלמה!</h2>
        <p>שלום <strong>${name}</strong>,</p>
        <p>אנו שמחים לעדכן כי בדיקת הזכאות שלך הושלמה בהצלחה. על פי הנתונים שהזנת, סכום החזר המס המשוער שלך עבור שנת המס <strong>${taxYear}</strong> עומד על כ-<strong>₪${refundMin} – ₪${refundMax}</strong> בסיכוי <strong>${probability}</strong> (ציון זכאות: ${score}/100).</p>
        
        <p style="background: #eff6ff; padding: 12px; border-right: 4px solid #2563eb; border-radius: 4px;">
          <strong>📎 מצורף למייל זה טופס 135 הרשמי לשנת ${taxYear}.</strong><br>
          אנא מלאו אותו, חתמו עליו והחזירו אלינו במייל חוזר או בוואטסאפ לצורך הגשת הדו"ח.
        </p>

        <h3>📋 מסמכים נוספים שיש לצרף לתיק:</h3>
        <p style="white-space: pre-wrap;">${documents.replace(/\n/g, '<br>')}</p>

        <h3>💡 למה מגיע לך החזר?</h3>
        <p style="white-space: pre-wrap;">${reasons.replace(/\n/g, '<br>')}</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.85em; color: #666; text-align: center;">צוות EZ Tax | <a href="mailto:contact.ez.security@gmail.com">contact.ez.security@gmail.com</a></p>
      </div>
    `,
    attachments
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: error.message });
  }
};

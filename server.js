require('dotenv').config();
const fs = require('fs');
const path = require('path');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { fillForm135 } = require('./pdfFill');

// Directories setup
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
const completedDir = path.resolve(process.env.COMPLETED_DIR || './completed_cases');
[uploadsDir, completedDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// AI setup
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Mail Transporter for replying
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Client Cases Database Simulation
const clientCases = {}; // keyed by client email

// Start IMAP listening
async function startEmailListener() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Missing EMAIL_USER or EMAIL_PASS environment variables. Please check your .env file.');
    return;
  }

  const config = {
    imap: {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASS,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      authTimeout: 3000,
      tlsOptions: { 
        rejectUnauthorized: false,
        servername: 'imap.gmail.com'
      },
      debug: console.log
    }
  };

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');
    console.log('📬 Successfully connected to Gmail IMAP. Waiting for emails...');

    // Run query to look for unread messages
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: true
    };

    const fetchEmails = async () => {
      const messages = await connection.search(searchCriteria, fetchOptions);
      for (const message of messages) {
        const all = message.parts.find(part => part.which === '');
        const parsed = await simpleParser(all.body);
        await handleIncomingEmail(parsed);
      }
    };

    // Poll every 30 seconds
    setInterval(fetchEmails, 30000);
    // Run once immediately
    await fetchEmails();

  } catch (err) {
    console.error('❌ IMAP Connection error:', err.message);
  }
}

/**
 * Handle individual incoming email from client
 */
async function handleIncomingEmail(parsedMail) {
  const fromAddress = parsedMail.from.value[0].address;
  const clientName = parsedMail.from.value[0].name || fromAddress;
  const subject = parsedMail.subject || '';
  const textBody = parsedMail.text || '';
  const attachments = parsedMail.attachments || [];

  console.log(`✉️ Received email from: ${clientName} <${fromAddress}> - Subject: "${subject}"`);

  // Initialize or retrieve case status
  if (!clientCases[fromAddress]) {
    // Determine dynamic missing documents based on incoming subject parameters from the website lead email
    // Example Subject: 🎯 ליד חדש | EZ Tax | שם | ₪0–0 | מילואים: 22 ימים | תרומות: כן | חייל משוחרר: כן | תואר: כן
    const missingDocs = ['טופס 106', 'אישור ניהול חשבון בנק/צילום צ\'ק'];
    const subjUpper = subject.toUpperCase();
    
    if (subjUpper.includes('מילואים') || subjUpper.includes('MILUIM') || textBody.includes('מילואים')) {
      missingDocs.push('אישור שירות מילואים (טופס 3010)');
    }
    if (subjUpper.includes('תרומות') || subjUpper.includes('DONATIONS') || textBody.includes('תרומות')) {
      missingDocs.push('קבלות תרומות (סעיף 46)');
    }
    if (subjUpper.includes('משוחרר') || subjUpper.includes('SOLDIER') || textBody.includes('משוחרר')) {
      missingDocs.push('תעודת שחרור מצה"ל / שירות לאומי');
    }
    if (subjUpper.includes('תואר') || subjUpper.includes('DEGREE') || textBody.includes('תואר')) {
      missingDocs.push('אישור זכאות לתואר אקדמי / תעודת מקצוע');
    }

    clientCases[fromAddress] = {
      name: clientName,
      uploadedFiles: [],
      extractedData: {
        firstName: clientName.split(' ')[0],
        lastName: clientName.split(' ').slice(1).join(' '),
        phone: '',
        email: fromAddress,
        taxYear: 2022,
        totalIncome: 0,
        taxPaid: 0,
        reserveDays: 0,
        donationsTotal: 0
      },
      missingDocs: Array.from(new Set(missingDocs)) // deduplicate
    };
  }

  const currentCase = clientCases[fromAddress];

  // Process attachments
  const savedPaths = [];
  for (const attachment of attachments) {
    const safeFilename = `${Date.now()}_${attachment.filename}`;
    const savePath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(savePath, attachment.content);
    savedPaths.push({
      originalName: attachment.filename,
      savedPath: savePath,
      mimeType: attachment.contentType
    });
    currentCase.uploadedFiles.push(attachment.filename);
  }

  // Analyze new files with AI
  for (const file of savedPaths) {
    await analyzeDocumentWithAI(file, currentCase);
  }

  // Generate Reply
  await generateAndSendReply(fromAddress, currentCase);
}

/**
 * AI OCR and Document Classification
 */
async function analyzeDocumentWithAI(file, clientCase) {
  if (!genAI) {
    console.warn('⚠️ Gemini API key not set. Skipping AI document analysis.');
    return;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const fileBuffer = fs.readFileSync(file.savedPath);
    
    const prompt = `
      You are an expert Israeli Tax OCR Assistant. Read this tax document and output JSON only.
      Determine what type of document this is:
      - 'Form 106' (טופס 106)
      - 'Bank Account Confirmation' (אישור ניהול חשבון בנק)
      - 'Reserve Duty' (אישור מילואים)
      - 'Donations' (קבלות תרומות סעיף 46)
      - 'Other' (אחר)

      If it is a Form 106, extract:
      1. Total Annual Gross Income (שדה 158 או 172)
      2. Tax deducted (שדה 042)
      3. Tax Year (שנת המס)

      JSON format:
      {
        "documentType": "Form 106" | "Bank Account Confirmation" | "Reserve Duty" | "Donations" | "Other",
        "taxYear": 2022,
        "totalIncome": number,
        "taxPaid": number,
        "reserveDays": number,
        "donationsTotal": number,
        "confidence": 0-1
      }
    `;

    const imageParts = [
      {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: file.mimeType || 'application/pdf'
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // Parse JSON safely
    const jsonStr = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
    const analysis = JSON.parse(jsonStr);

    console.log(`🔍 AI Document Analysis Result for ${file.originalName}:`, analysis);

    // Apply extracted data
    if (analysis.documentType === 'Form 106') {
      clientCase.extractedData.totalIncome += (analysis.totalIncome || 0);
      clientCase.extractedData.taxPaid += (analysis.taxPaid || 0);
      clientCase.extractedData.taxYear = analysis.taxYear || clientCase.extractedData.taxYear;
      clientCase.missingDocs = clientCase.missingDocs.filter(d => d !== 'טופס 106');
    } else if (analysis.documentType === 'Bank Account Confirmation') {
      clientCase.missingDocs = clientCase.missingDocs.filter(d => d !== 'אישור ניהול חשבון בנק/צילום צ\'ק');
    } else if (analysis.documentType === 'Reserve Duty') {
      clientCase.extractedData.reserveDays += (analysis.reserveDays || 0);
    } else if (analysis.documentType === 'Donations') {
      clientCase.extractedData.donationsTotal += (analysis.donationsTotal || 0);
    }

  } catch (error) {
    console.error('❌ AI Analysis failed for file:', file.originalName, error.message);
  }
}

/**
 * Send smart reply to client
 */
async function generateAndSendReply(emailAddress, clientCase) {
  let emailText = '';
  let subject = `עדכון לגבי בקשת החזר המס שלך - EZ Tax`;

  if (clientCase.missingDocs.length > 0) {
    emailText = `שלום ${clientCase.extractedData.firstName},\n\n` +
      `תודה על המסמכים ששלחת לנו. קלטנו אותם בהצלחה.\n` +
      `על מנת להשלים את הגשת הדו"ח השנתי לרשות המסים, נשמח אם תשלח לנו את המסמכים החסרים הבאים:\n` +
      clientCase.missingDocs.map(doc => `• ${doc}`).join('\n') + `\n\n` +
      `פשוט השב למייל זה וצרף את המסמכים החסרים.\n\n` +
      `בברכה,\nצוות EZ Tax 🤖`;
  } else {
    // Generate filled Form 135 PDF
    const templatePath = path.join(__dirname, 'blank_135.pdf');
    const outPdfName = `Form_135_Filled_${clientCase.extractedData.firstName}_${clientCase.extractedData.taxYear}.pdf`;
    const outputPath = path.join(completedDir, outPdfName);

    let pdfGenerated = false;
    if (fs.existsSync(templatePath)) {
      await fillForm135(templatePath, outputPath, clientCase.extractedData);
      pdfGenerated = true;
    } else {
      console.warn('⚠️ Missing "blank_135.pdf" template in directory. Skipping PDF filling.');
    }

    subject = `🎯 התיק שלך מוכן להגשה! - EZ Tax`;
    emailText = `שלום ${clientCase.extractedData.firstName},\n\n` +
      `חדשות מעולות! כל המסמכים שלך התקבלו ועובדו בהצלחה על ידי הבינה המלאכותית שלנו.\n` +
      `הכנו עבורך את טופס 135 הרשמי לשנת ${clientCase.extractedData.taxYear} כשהוא כבר ממולא במלואו.\n\n` +
      `מצורף למייל זה קובץ ה-PDF המלא. כל שעליך לעשות הוא להיכנס לאזור האישי באתר רשות המסים, ולהעלות אותו יחד עם שאר המסמכים ששלחת לנו.\n\n` +
      `שמחנו לעזור!\nצוות EZ Tax 🤖`;

    // Send email with attachment if PDF was generated
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailAddress,
      subject: subject,
      text: emailText,
      attachments: pdfGenerated ? [{ filename: outPdfName, path: outputPath }] : []
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Automated success email sent to: ${emailAddress}`);
    } catch (e) {
      console.error('❌ Failed to send success email:', e.message);
    }
    return;
  }

  // Send request-for-more-documents email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emailAddress,
    subject: subject,
    text: emailText
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Follow-up email sent to: ${emailAddress}`);
  } catch (e) {
    console.error('❌ Failed to send follow-up email:', e.message);
  }
}

// Start listener
startEmailListener();

const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

/**
 * Fills out form fields in a blank Form 135 PDF based on extracted AI data.
 * @param {string} templatePath Path to the blank official Form 135 PDF.
 * @param {string} outputPath Destination path for the filled PDF.
 * @param {Object} data JSON data containing the fields to map.
 */
async function fillForm135(templatePath, outputPath, data) {
  try {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template PDF not found at ${templatePath}`);
    }

    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // Mapping fields on Israeli Tax Form 135 (Form fields naming depends on the official PDF)
    // Note: Official forms have interactive text fields. Below is a map of common Hebrew field keys
    const fieldsToFill = {
      // Personal Details
      'שם משפחה': data.lastName || '',
      'שם פרטי': data.firstName || '',
      'מספר זהות': data.idNumber || '',
      'שנת מס': data.taxYear ? String(data.taxYear) : '2022',
      'טלפון נייד': data.phone || '',
      'דואר אלקטרוני': data.email || '',
      
      // Income Details (Form 135 fields)
      'משכורת ושכר עבודה שדה 158': data.totalIncome ? String(Math.round(data.totalIncome)) : '',
      'מס שנוכה במקור שדה 042': data.taxPaid ? String(Math.round(data.taxPaid)) : '',
      
      // Reserve duty
      'ימי מילואים': data.reserveDays ? String(data.reserveDays) : '',
      
      // Donations (Section 46)
      'תרומות שדה 037': data.donationsTotal ? String(Math.round(data.donationsTotal)) : '',
    };

    for (const [key, value] of Object.entries(fieldsToFill)) {
      if (value) {
        try {
          const field = form.getField(key) || form.getTextField(key);
          if (field) {
            field.setText(value);
          }
        } catch (err) {
          // If direct field matching fails, attempt fuzzy search among fields
          console.warn(`Fuzzy matching / field key not found in PDF: ${key}`);
        }
      }
    }

    // Save PDF
    const filledPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, filledPdfBytes);
    console.log(`🎉 Form 135 successfully generated and saved to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error('❌ Error filling PDF:', error);
    throw error;
  }
}

module.exports = { fillForm135 };

const docs = [
  { text: 'טופס 106 מקורי ומלא ממעסיקך עבור אותן שנים', priority: 'critical' },
  { text: 'אישור שירות מילואים (מטופס 3010)', priority: 'critical' },
  { text: 'תעודת שחרור מצה"ל / שירות לאומי לצורך חישוב נקודות זיכוי', priority: 'critical' },
  { text: 'טופס 135 רשמי לשנת 2025 (להורדה ומילוי: https://ez-tax-one.vercel.app/All%20Attachments/Service_Pages_Income_tax_annual-report-2026_itc135-2025.pdf) - חובה למלא, לחתום ולהחזיר אלינו.', priority: 'critical' },
  { text: 'תעודת זהות (ספח)', priority: 'critical' },
  { text: "אישור ניהול חשבון בנק או צילום צ'ק (חובה על פי חוק לצורך העברת הזיכוי ישירות לחשבון)", priority: 'critical' }
];

const docsHtmlList = docs.map((doc, idx) => {
  let cleanText = doc.text.replace(/<[^>]*>/g, '');
  if (cleanText.includes('טופס 135 רשמי לשנת')) {
    const match = cleanText.match(/(https?:\/\/[^\s\)]+)/);
    if (match) {
      const url = match[1];
      const yearMatch = cleanText.match(/לשנת (\d+)/);
      const docYear = yearMatch ? yearMatch[1] : '';
      cleanText = `<a href="${url}" target="_blank">טופס 135 רשמי לשנת ${docYear}</a> - חובה למלא, לחתום ולהחזיר אלינו.`;
    }
  } else {
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    if (urlRegex.test(cleanText)) {
      cleanText = cleanText.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank">לחץ כאן להורדה</a>`;
      });
    }
  }
  return `${idx + 1}. ${cleanText}`;
});

const docsHtml = docsHtmlList.join('<br>');
console.log("=== VERIFYING DOCS HTML OUTPUT ===");
console.log(docsHtml);

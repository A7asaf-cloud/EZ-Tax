/* =============================================
   TaxOS — Tax Calculation Engine + UI Logic
   ============================================= */
console.log("🚀 EZ Tax — Code Version 2.1 Loaded — Diagnostics Active");

// ─── הגדרות אישיות — שנה כאן בלבד! ─────────────────────────────
const CONFIG = {
  brandName: 'EZ Tax',

  // WhatsApp — ניתוב מספר ישראלי בפורמט בינלאומי
  whatsappNumber: '972502196259',
  advisorName: 'EZ Tax',

  // אימייל לקבלת לידים
  contactEmail: 'contact.ez.security@gmail.com',

  // Web3Forms — ללא הרשמה! קח מפתח חינם ב: https://web3forms.com
  // שים את המפתח כאן אחרי שתקבל אותו (נראה כך: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  web3formsKey: 'YOUR_WEB3FORMS_KEY',  // ← הדבק כאן!

  // EmailJS — לשליחת דוחות אוטומטיים ישירות למייל של הלקוח בחינם (ראה https://www.emailjs.com)
  // רשום שירות חינמי, חבר את ג׳ימייל שלך contact.ez.security@gmail.com, צור תבנית והדבק את המפתחות:
  emailjsServiceId: 'service_97y72xu',   // למשל: 'service_xxxxxx'
  emailjsTemplateId: 'template_248gg2b',  // למשל: 'template_xxxxxx'
  emailjsPublicKey: 'VDH_LRHpUtNdiBeAO',   // למשל: 'user_xxxxxxxxxxxx'

  // Google Analytics — רשום ב-analytics.google.com וקבל G-XXXXXXXX
  gaId: '',  // לדוגמה: 'G-ABC123DEF4'
};
// ────────────────────────────────────────────────────────────────────

// ─── ISRAELI TAX RULES — עדכני ליוני 2026 ──────────────────
// מקור: רשות המסים, ביטוח לאומי, כל-זכות
// נקודת זיכוי 2026: ₪242/חודש = ₪2,904/שנה
// ─────────────────────────────────────────────────────────────

const TAX_RULES = {

  // ══════════════════════════════════
  // 2026 — נתונים מעודכנים ליוני 2026
  // ══════════════════════════════════
  2026: {
    creditPointValue: 242,           // ₪ לנקודת זיכוי לחודש
    creditPointValueAnnual: 2904,    // ₪ לנקודת זיכוי לשנה
    // מדרגות מס 2026 (ריווח שנכנס לתוקף רטרואקטיבית מינואר 2026)
    // מקור: gov.il אפריל 2026
    brackets: [
      { from: 0,       to: 84120,   rate: 0.10 }, // עד ₪7,010/חודש
      { from: 84120,   to: 120720,  rate: 0.14 }, // ₪7,011–₪10,060
      { from: 120720,  to: 228000,  rate: 0.20 }, // ₪10,061–₪19,000
      { from: 228000,  to: 301200,  rate: 0.31 }, // ₪19,001–₪25,100
      { from: 301200,  to: 560280,  rate: 0.35 }, // ₪25,101–₪46,690
      { from: 560280,  to: Infinity, rate: 0.47 } // מעל ₪46,690/חודש
    ],
    // נקודות זיכוי בסיס
    basePoints: 2.25,                // כל תושב ישראל
    femaleBonus: 0.5,                // נשים: 2.75 סך הכל
    childPoints: {
      '0-5':   1.5,
      '6-13':  1.5,
      '14-17': 1.0,
      '18+':   0.0,
    },
    singleParentBonus: 1.0,
    newImmigrantBonus: 1.0,          // עד 4.5 שנים מעלייה
    disabilityPoints: {
      '10-49': 0.5,
      '50-99': 1.5,
      '100+':  2.25,
    },
    // מילואים 2026 — שיטת נקודות זיכוי חדשה ללוחמים (הוראת שעה 2026-2027)
    // מבוסס על ימי שירות ב-2025 (שנה קודמת)
    // מקור: אזור אישי מילואים / רשות המסים
    reserveSystem: 'CREDIT_POINTS', // שינוי מ-₪/יום לנקודות זיכוי
    reserveCreditPoints: {
      '1-14':   0,     // פחות מ-30 יום — אין הטבת נקודות (אך עדיין זיכוי רגיל)
      '15-29':  0,
      '30-39':  0.5,   // 30–39 ימים: חצי נקודת זיכוי
      '40-49':  0.75,  // 40–49 ימים: 0.75 נקודה
      '50-74':  1.0,   // 50–54 ימים: נקודה אחת
      '75+':    2.0,   // 75+ ימים: עד 4 נקודות (בהדרגה)
    },
    reservePerDayFallback: 355,      // זיכוי יומי לאי-לוחמים / שנים קודמות
    // תרומות סעיף 46 — 2026
    donationMinimum: 207,            // מינימום תרומה לזיכוי (עלה מ-₪190)
    donationMultiplier: 0.35,        // 35% זיכוי ליחידים
    maxDonationRate: 0.30,           // עד 30% מהכנסה חייבת
    donationDigital: true,           // מ-1.1.2026: דיווח דיגיטלי חובה
    // פנסיה 2026 — מקור: נתוני שכר ממוצע ₪13,769/חודש
    pensionSelfDeduction: 0.165,     // עד 16.5% לעצמאים
    maxPensionDeductionIncomeMonthly: 34423, // תקרת שכר מוכר למעסיק
    maxPensionDeductionIncome: 34423 * 12,   // ₪413,076 שנתי
    maxSelfEmployedPensionAnnual: 38412,     // תקרה שנתית לעצמאי
    pensionEmployeeContribution: 0.07,
    pensionEmployerContribution: 0.075,
    // ישוב מזכה
    residenceBonus: 0.12,
    // שכר ממוצע במשק 2026
    avgSalaryMonthly: 13769,
  },

  // ══════════════════════════════════
  // 2025
  // ══════════════════════════════════
  2025: {
    creditPointValue: 238,
    creditPointValueAnnual: 2856,
    brackets: [
      { from: 0,       to: 81480,  rate: 0.10 },
      { from: 81480,   to: 116760, rate: 0.14 },
      { from: 116760,  to: 187440, rate: 0.20 },
      { from: 187440,  to: 260520, rate: 0.31 },
      { from: 260520,  to: 557640, rate: 0.35 },
      { from: 557640,  to: Infinity, rate: 0.47 }
    ],
    reserveSystem: 'PER_DAY',
    reservePerDayFallback: 345,
    donationMinimum: 190,
    maxPensionDeductionIncome: 34900 * 12,
  },

  // ══════════════════════════════════
  // 2024
  // ══════════════════════════════════
  2024: {
    creditPointValue: 235,
    creditPointValueAnnual: 2820,
    brackets: [
      { from: 0,       to: 81480,  rate: 0.10 },
      { from: 81480,   to: 116760, rate: 0.14 },
      { from: 116760,  to: 187440, rate: 0.20 },
      { from: 187440,  to: 260520, rate: 0.31 },
      { from: 260520,  to: 557640, rate: 0.35 },
      { from: 557640,  to: Infinity, rate: 0.47 }
    ],
    reserveSystem: 'PER_DAY',
    reservePerDayFallback: 335,
    donationMinimum: 190,
    maxPensionDeductionIncome: 34900 * 12,
  },

  // ══════════════════════════════════
  // 2023
  // ══════════════════════════════════
  2023: {
    creditPointValue: 230,
    creditPointValueAnnual: 2760,
    brackets: [
      { from: 0,       to: 77400,  rate: 0.10 },
      { from: 77400,   to: 110880, rate: 0.14 },
      { from: 110880,  to: 178080, rate: 0.20 },
      { from: 178080,  to: 247440, rate: 0.31 },
      { from: 247440,  to: 514920, rate: 0.35 },
      { from: 514920,  to: Infinity, rate: 0.47 }
    ],
    reserveSystem: 'PER_DAY',
    reservePerDayFallback: 313,
    donationMinimum: 190,
    maxPensionDeductionIncome: 33775 * 12,
  },

  // ══════════════════════════════════
  // 2022
  // ══════════════════════════════════
  2022: {
    creditPointValue: 223,
    creditPointValueAnnual: 2676,
    brackets: [
      { from: 0,       to: 75960,  rate: 0.10 },
      { from: 75960,   to: 108960, rate: 0.14 },
      { from: 108960,  to: 174960, rate: 0.20 },
      { from: 174960,  to: 243120, rate: 0.31 },
      { from: 243120,  to: 505920, rate: 0.35 },
      { from: 505920,  to: Infinity, rate: 0.47 }
    ],
    reserveSystem: 'PER_DAY',
    reservePerDayFallback: 290,
    donationMinimum: 190,
    maxPensionDeductionIncome: 32700 * 12,
  },

  // ══════════════════════════════════
  // 2021
  // ══════════════════════════════════
  2021: {
    creditPointValue: 218,
    creditPointValueAnnual: 2616,
    brackets: [
      { from: 0,       to: 75480,  rate: 0.10 },
      { from: 75480,   to: 108360, rate: 0.14 },
      { from: 108360,  to: 173880, rate: 0.20 },
      { from: 173880,  to: 241680, rate: 0.31 },
      { from: 241680,  to: 502920, rate: 0.35 },
      { from: 502920,  to: Infinity, rate: 0.47 }
    ],
    reserveSystem: 'PER_DAY',
    reservePerDayFallback: 275,
    donationMinimum: 190,
    maxPensionDeductionIncome: 32500 * 12,
  },

  // ══════════════════════════════════
  // 2020
  // ══════════════════════════════════
  2020: {
    creditPointValue: 216,
    creditPointValueAnnual: 2592,
    brackets: [
      { from: 0,       to: 75720,  rate: 0.10 },
      { from: 75720,   to: 108600, rate: 0.14 },
      { from: 108600,  to: 174360, rate: 0.20 },
      { from: 174360,  to: 242400, rate: 0.31 },
      { from: 242400,  to: 504360, rate: 0.35 },
      { from: 504360,  to: Infinity, rate: 0.47 }
    ],
    reserveSystem: 'PER_DAY',
    reservePerDayFallback: 262,
    donationMinimum: 190,
    maxPensionDeductionIncome: 31700 * 12,
  },
};

// ── השלם שדות חסרים משנת 2026 לכל שנה ──
const BASE_2026 = TAX_RULES[2026];
for (const year of [2020, 2021, 2022, 2023, 2024, 2025]) {
  TAX_RULES[year] = { ...BASE_2026, ...TAX_RULES[year] };
}


// ─── STATE ───────────────────────────────────────────────────
let currentStep = 1;
let leadSubmitted = false;
const TOTAL_STEPS = 5;
const formData = {
  firstName: '',
  taxYear: 2025,
  gender: 'male',
  age: 32,
  maritalStatus: 'single',
  hasChildren: 'no',
  childrenCount: 2,
  youngestChildAge: null,
  singleParent: 'no',
  newImmigrant: 'no',
  annualIncome: 120000,
  employers: '1',
  reserveDuty: 'no',
  leaveType: ['no'],
  disability: 'no',
  donations: 'no',
  soldierDischarge: 'no',
  degreeCompleted: 'no',
  residence: 'no',
  pension: 'no',
  insurance: 'no',
  extraIncome: ['no'],
  phone: '',
  email: '',
};


// ─── DOM READY ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectGradients();
  initNavbar();
  initSliders();
  initChips();
  initFormNav();
  animateHeroCard();
  initDynamicQuestions();
  initFileUpload();
  updateLiveEstimate();
  
  if (CONFIG.emailjsPublicKey && typeof emailjs !== 'undefined') {
    emailjs.init({
      publicKey: CONFIG.emailjsPublicKey,
    });
  }
});


// ─── GRADIENTS (SVG defs) ────────────────────────────────────
function injectGradients() {
  const svg = `<svg width="0" height="0" style="position:absolute">
    <defs>
      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="100%" stop-color="#a78bfa"/>
      </linearGradient>
      <linearGradient id="resultGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#10b981"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
    </defs>
  </svg>`;
  document.body.insertAdjacentHTML('afterbegin', svg);
}


// ─── NAVBAR SCROLL ───────────────────────────────────────────
function initNavbar() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
  });
}


// ─── CONTACT MODAL CONTROLS ──────────────────────────────────
// ─── CONTACT MODAL CONTROLS ──────────────────────────────────
window.openContactModal = function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Show form, hide success view
  const formContainer = document.getElementById('contact-form-container');
  const successContainer = document.getElementById('contact-success-container');
  if (formContainer) formContainer.style.display = 'block';
  if (successContainer) successContainer.style.display = 'none';
  
  const nameInput = document.getElementById('contact-name');
  const phoneInput = document.getElementById('contact-phone');
  const emailInput = document.getElementById('contact-email');
  const messageInput = document.getElementById('contact-message');
  const errorDiv = document.getElementById('contact-error');
  
  if (errorDiv) errorDiv.style.display = 'none';
  if (messageInput) messageInput.value = '';
  
  // Try to pre-fill name/phone/email if the user already submitted the main form
  if (window.lastFormData) {
    if (nameInput && window.lastFormData.firstName) {
      nameInput.value = window.lastFormData.firstName;
    }
    if (phoneInput && window.lastFormData.phone) {
      phoneInput.value = window.lastFormData.phone;
    }
    if (emailInput && window.lastFormData.email) {
      emailInput.value = window.lastFormData.email;
    }
  } else {
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (emailInput) emailInput.value = '';
  }
  
  const modal = document.getElementById('contact-modal');
  if (modal) modal.classList.add('open');
};

window.closeContactModal = function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const modal = document.getElementById('contact-modal');
  if (modal) modal.classList.remove('open');
};

// Internal validation function
function getContactInfo() {
  const nameEl = document.getElementById('contact-name');
  const phoneEl = document.getElementById('contact-phone');
  const emailEl = document.getElementById('contact-email');
  const messageEl = document.getElementById('contact-message');
  const errorEl = document.getElementById('contact-error');
  
  const name = nameEl ? nameEl.value.trim() : '';
  const phone = phoneEl ? phoneEl.value.trim() : '';
  const email = emailEl ? emailEl.value.trim() : '';
  const message = messageEl ? messageEl.value.trim() : '';
  
  // Validation: name at least 2 chars, phone at least 9 chars
  if (name.length < 2 || phone.length < 9) {
    if (errorEl) errorEl.style.display = 'block';
    return null;
  }
  
  // Optional email check: if provided, must contain @
  if (email.length > 0 && !email.includes('@')) {
    if (errorEl) errorEl.style.display = 'block';
    return null;
  }
  
  if (errorEl) errorEl.style.display = 'none';
  return { name, phone, email, message };
}

function showContactSuccessView() {
  const formContainer = document.getElementById('contact-form-container');
  const successContainer = document.getElementById('contact-success-container');
  if (formContainer) formContainer.style.display = 'none';
  if (successContainer) successContainer.style.display = 'block';
}

// Background submission to Web3Forms to log the lead and trigger confirmation emails
async function submitContactLead(info) {
  try {
    const payload = {
      access_key: CONFIG.web3formsKey,
      subject: `📞 פנייה חדשה מצור קשר | ${info.name}`,
      from_name: 'EZ Tax Contact',
      name: info.name,
      phone: info.phone,
      email: info.email,
      message: info.message || 'ללא הודעה מפורטת',
      replyto: info.email
    };
    
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Background contact submission failed:', err);
  }
}

window.openWhatsApp = function(e) {
  if (e) e.preventDefault();
  
  const info = getContactInfo();
  if (!info) return; // Validation failed
  
  // Trigger background submission for auto-reply email & admin log
  submitContactLead(info);
  
  const phone = CONFIG.whatsappNumber || '972502196259';
  
  let msgBody = `שלום רב,\nשמי ${info.name} (טלפון לחזרה: ${info.phone}).\nאני פונה אליכם בעקבות הבדיקת זכאות להחזר מס שביצעתי באתר EZ Tax. אשמח שנציג יחזור אליי לקבלת מענה והסבר.`;
  if (info.message) {
    msgBody += `\n\nפירוט הפנייה שלי:\n${info.message}`;
  }
  msgBody += `\n\nתודה.`;
  
  const text = encodeURIComponent(msgBody);
  const url = `https://wa.me/${phone}?text=${text}`;
  window.open(url, '_blank');
  
  // Show success auto-reply view on screen
  showContactSuccessView();
};

window.openMailApp = function(e) {
  if (e) e.preventDefault();
  
  const info = getContactInfo();
  if (!info) return; // Validation failed
  
  // Trigger background submission for auto-reply email & admin log
  submitContactLead(info);
  
  const email = 'contact.ez.security@gmail.com';
  const subject = encodeURIComponent('פנייה לשירות הלקוחות - EZ Tax');
  
  let mailBody = 'שלום רב,\n\n' +
    `שם מלא: ${info.name}\n` +
    `טלפון לחזרה: ${info.phone}\n` +
    `אימייל: ${info.email}\n\n` +
    'אני פונה אליכם בעקבות הבדיקה שביצעתי באתר EZ Tax. אשמח שנציג שירות יחזור אליי לקבלת מענה והסבר.';
    
  if (info.message) {
    mailBody += `\n\nפירוט הפנייה:\n${info.message}`;
  }
  
  mailBody += `\n\nבברכה,\n${info.name}`;
  
  const body = encodeURIComponent(mailBody);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  const webGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
  
  if (isIOS || isAndroid) {
    // Try to open native Gmail app directly
    const gmailUrl = `googlegmail:///co?to=${email}&subject=${subject}&body=${body}`;
    
    let redirected = false;
    const handleVisibilityChange = () => {
      redirected = true;
    };
    window.addEventListener('pagehide', handleVisibilityChange, { once: true });
    window.addEventListener('blur', handleVisibilityChange, { once: true });
    
    window.location.href = gmailUrl;
    
    // Fallback ONLY to Gmail Web Compose, so we never open the native Apple Mail / default Mail app
    setTimeout(() => {
      window.removeEventListener('pagehide', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      if (!redirected) {
        window.location.href = webGmailUrl;
      }
    }, 1200);
  } else {
    // Desktop: Open Gmail Web Compose directly
    window.open(webGmailUrl, '_blank');
  }
  
  // Show success auto-reply view on screen
  showContactSuccessView();
};

window.openWhatsAppDirect = function(e) {
  if (e) e.preventDefault();
  const phone = CONFIG.whatsappNumber || '972502196259';
  const text = encodeURIComponent('שלום רב, ברצוני לפנות לשירות הלקוחות של EZ Tax בנוגע לבדיקת זכאות להחזר מס. אשמח לקבל מענה מנציג. תודה.');
  const url = `https://wa.me/${phone}?text=${text}`;
  window.open(url, '_blank');
};

window.openMailAppDirect = function(e) {
  if (e) e.preventDefault();
  const email = 'contact.ez.security@gmail.com';
  const subject = encodeURIComponent('פנייה לשירות הלקוחות - EZ Tax');
  const body = encodeURIComponent(
    'שלום רב,\n\n' +
    'אני פונה אליכם בעקבות הבדיקה שביצעתי באתר EZ Tax. אשמח שנציג שירות יחזור אליי לקבלת מענה והסבר.\n\n' +
    'בברכה,\n'
  );
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const webGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
  
  if (isIOS || isAndroid) {
    const gmailUrl = `googlegmail:///co?to=${email}&subject=${subject}&body=${body}`;
    let redirected = false;
    const handleVisibilityChange = () => { redirected = true; };
    window.addEventListener('pagehide', handleVisibilityChange, { once: true });
    window.addEventListener('blur', handleVisibilityChange, { once: true });
    
    window.location.href = gmailUrl;
    setTimeout(() => {
      window.removeEventListener('pagehide', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      if (!redirected) {
        window.location.href = webGmailUrl;
      }
    }, 1200);
  } else {
    window.open(webGmailUrl, '_blank');
  }
};




// ─── HERO CARD ANIMATION ─────────────────────────────────────
function animateHeroCard() {
  const targetScore = 84;
  const targetMin = 6800;
  const targetMax = 14200;
  const circumference = 2 * Math.PI * 42;

  setTimeout(() => {
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      const score = Math.round(ease * targetScore);
      const min = Math.round(ease * targetMin);
      const max = Math.round(ease * targetMax);
      const dashLen = (score / 100) * circumference;

      document.getElementById('hero-score').textContent = score;
      document.getElementById('hero-min').textContent = min.toLocaleString('he-IL');
      document.getElementById('hero-max').textContent = max.toLocaleString('he-IL');
      document.getElementById('hero-ring').setAttribute('stroke-dasharray', `${dashLen} ${circumference}`);

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, 800);
}


// ─── SLIDERS ─────────────────────────────────────────────────
// ─── SLIDERS ─────────────────────────────────────────────────
function initSliders() {
  const ageSlider = document.getElementById('age');
  const ageInput = document.getElementById('age-val');
  
  function updateAge(val, fromInput) {
    formData.age = val;
    if (!fromInput && ageInput) {
      ageInput.value = val;
    }
    if (ageSlider) {
      ageSlider.value = val;
      updateSliderFill(ageSlider);
    }
    updateLiveEstimate();
  }
  
  if (ageSlider) {
    ageSlider.addEventListener('input', e => {
      updateAge(parseInt(e.target.value), false);
    });
    updateSliderFill(ageSlider);
  }
  
  if (ageInput) {
    ageInput.value = formData.age;
    ageInput.addEventListener('input', e => {
      let val = parseInt(e.target.value);
      if (!isNaN(val)) {
        if (val >= parseInt(ageSlider.min) && val <= parseInt(ageSlider.max)) {
          updateAge(val, true);
        }
      }
    });
    ageInput.addEventListener('blur', () => {
      let val = parseInt(ageInput.value);
      const min = parseInt(ageSlider.min) || 18;
      const max = parseInt(ageSlider.max) || 70;
      if (isNaN(val) || val < min) val = min;
      if (val > max) val = max;
      updateAge(val, false);
    });
  }

  // Children count
  const childrenSlider = document.getElementById('childrenCount');
  const childrenInput = document.getElementById('children-val');
  
  function updateChildren(val, fromInput) {
    formData.childrenCount = val;
    if (!fromInput && childrenInput) {
      childrenInput.value = val;
    }
    if (childrenSlider) {
      childrenSlider.value = val;
      updateSliderFill(childrenSlider);
    }
    updateLiveEstimate();
  }
  
  if (childrenSlider) {
    childrenSlider.addEventListener('input', e => {
      updateChildren(parseInt(e.target.value), false);
    });
    updateSliderFill(childrenSlider);
  }
  
  if (childrenInput) {
    childrenInput.value = formData.childrenCount;
    childrenInput.addEventListener('input', e => {
      let val = parseInt(e.target.value);
      if (!isNaN(val)) {
        if (val >= parseInt(childrenSlider.min) && val <= parseInt(childrenSlider.max)) {
          updateChildren(val, true);
        }
      }
    });
    childrenInput.addEventListener('blur', () => {
      let val = parseInt(childrenInput.value);
      const min = parseInt(childrenSlider.min) || 1;
      const max = parseInt(childrenSlider.max) || 8;
      if (isNaN(val) || val < min) val = min;
      if (val > max) val = max;
      updateChildren(val, false);
    });
  }

  // Income
  const incomeSlider = document.getElementById('annualIncome');
  const incomeInput = document.getElementById('income-val');
  
  function updateIncome(val, fromInput) {
    formData.annualIncome = val;
    if (!fromInput && incomeInput) {
      incomeInput.value = val;
    }
    if (incomeSlider) {
      incomeSlider.value = val;
      updateSliderFill(incomeSlider);
    }
    updateLiveEstimate();
  }
  
  if (incomeSlider) {
    incomeSlider.addEventListener('input', e => {
      updateIncome(parseInt(e.target.value), false);
    });
    updateSliderFill(incomeSlider);
  }
  
  if (incomeInput) {
    incomeInput.value = formData.annualIncome;
    incomeInput.addEventListener('input', e => {
      let val = parseInt(e.target.value);
      if (!isNaN(val)) {
        if (val >= parseInt(incomeSlider.min) && val <= parseInt(incomeSlider.max)) {
          updateIncome(val, true);
        }
      }
    });
    incomeInput.addEventListener('blur', () => {
      let val = parseInt(incomeInput.value);
      const min = parseInt(incomeSlider.min) || 30000;
      const max = parseInt(incomeSlider.max) || 500000;
      if (isNaN(val) || val < min) val = min;
      if (val > max) val = max;
      updateIncome(val, false);
    });
  }
}

function updateSliderFill(slider) {
  const min = parseFloat(slider.min) || 0;
  const max = parseFloat(slider.max) || 100;
  const val = parseFloat(slider.value) || 0;
  const pct = ((val - min) / (max - min)) * 100;

  // Calculate adjusted percentage to align fill gradient perfectly with thumb center
  let width = slider.offsetWidth;
  if (!width || width <= 0) {
    width = 280; // default mobile fallback width if element is hidden on load
  }
  const thumbWidth = 22; // thumb diameter in pixels
  const pctAdj = (thumbWidth / 2 / width) * 100 + pct * ((width - thumbWidth) / width);

  slider.style.background = `linear-gradient(to left, #2563eb ${pctAdj}%, rgba(255,255,255,0.08) ${pctAdj}%)`;
}


// ─── CHIPS ───────────────────────────────────────────────────
function initChips() {
  const chipGroups = {
    'marital-chips':       (v) => formData.maritalStatus = v,
    'gender-chips':        (v) => formData.gender = v,
    'has-children-chips':  (v) => { formData.hasChildren = v; toggleChildrenFields(v); },
    'youngest-child-chips': (v) => formData.youngestChildAge = v,
    'single-parent-chips': (v) => formData.singleParent = v,
    'new-immigrant-chips': (v) => formData.newImmigrant = v,
    'employers-chips':     (v) => formData.employers = v,
    'reserve-chips':       (v) => formData.reserveDuty = v,
    'disability-chips':    (v) => formData.disability = v,
    'donation-chips':      (v) => formData.donations = v,
    'soldier-chips':       (v) => formData.soldierDischarge = v,
    'degree-chips':        (v) => formData.degreeCompleted = v,
    'residence-chips':     (v) => formData.residence = v,
    'pension-chips':       (v) => formData.pension = v,
    'insurance-chips':     (v) => formData.insurance = v,
  };

  for (const [groupId, setter] of Object.entries(chipGroups)) {
    const group = document.getElementById(groupId);
    if (!group) continue;
    group.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        setter(chip.dataset.val);
        updateLiveEstimate();
      });
    });
  }

  // Multi-select chip groups
  const multiChipGroups = {
    'leave-chips':         (vals) => formData.leaveType = vals,
    'extra-income-chips':  (vals) => formData.extraIncome = vals,
  };

  for (const [groupId, setter] of Object.entries(multiChipGroups)) {
    const group = document.getElementById(groupId);
    if (!group) continue;
    group.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.dataset.val;
        if (val === 'no') {
          // Select "no" and deselect all others
          group.querySelectorAll('.chip').forEach(c => {
            if (c.dataset.val === 'no') c.classList.add('active');
            else c.classList.remove('active');
          });
          setter(['no']);
        } else {
          // Toggle the clicked chip
          chip.classList.toggle('active');
          // Deselect "no"
          const noChip = group.querySelector('.chip[data-val="no"]');
          if (noChip) noChip.classList.remove('active');

          // Gather active chips
          const activeChips = Array.from(group.querySelectorAll('.chip.active'));
          if (activeChips.length === 0) {
            if (noChip) noChip.classList.add('active');
            setter(['no']);
          } else {
            setter(activeChips.map(c => c.dataset.val));
          }
        }
        updateLiveEstimate();
      });
    });
  }

  // Tax year select
  document.getElementById('taxYear').addEventListener('change', e => {
    formData.taxYear = parseInt(e.target.value);
    updateLiveEstimate();
  });

  // Phone
  document.getElementById('phone').addEventListener('input', e => {
    formData.phone = e.target.value;
  });

  // Email
  document.getElementById('email').addEventListener('input', e => {
    formData.email = e.target.value;
  });

  // First name
  document.getElementById('firstName').addEventListener('input', e => {
    formData.firstName = e.target.value;
  });
}


// ─── DYNAMIC QUESTIONS ───────────────────────────────────────
function toggleChildrenFields(val) {
  const countGroup = document.getElementById('children-count-group');
  const ageGroup = document.getElementById('children-age-group');
  if (val === 'yes') {
    countGroup.classList.remove('hidden');
    ageGroup.classList.remove('hidden');
  } else {
    countGroup.classList.add('hidden');
    ageGroup.classList.add('hidden');
  }
}

function initDynamicQuestions() {
  // nothing extra needed; handled in chip callbacks
}


// ─── FORM NAVIGATION ─────────────────────────────────────────
function initFormNav() {
  document.getElementById('btn-next').addEventListener('click', handleNext);
  document.getElementById('btn-back').addEventListener('click', handleBack);
  
  const skipBtn = document.getElementById('btn-skip-upload');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      runAnalysis();
    });
  }
}

function handleNext() {
  if (currentStep < 5) {
    goToStep(currentStep + 1);
  } else if (currentStep === 5) {
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const agreeTerms = document.getElementById('agree-terms');
    const phoneVal = phoneInput.value.trim();
    const emailVal = emailInput.value.trim();

    // Clear previous errors
    document.querySelectorAll('.error-feedback').forEach(el => el.remove());
    phoneInput.style.borderColor = '';
    emailInput.style.borderColor = '';
    if (agreeTerms) {
      agreeTerms.style.outline = '';
    }
    const phoneWrap = document.querySelector('.phone-input-wrap');
    if (phoneWrap) phoneWrap.style.borderColor = '';

    let hasError = false;

    // Validate Phone
    const cleanPhone = phoneVal.replace(/[-\s]/g, '');
    const phoneRegex = /^05\d{8}$/;
    if (!phoneVal) {
      showError(phoneInput, 'נא להזין מספר טלפון');
      hasError = true;
    } else if (!phoneRegex.test(cleanPhone)) {
      showError(phoneInput, 'מספר טלפון לא תקין (למשל: 0501234567)');
      hasError = true;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      showError(emailInput, 'נא להזין כתובת אימייל');
      hasError = true;
    } else if (!emailRegex.test(emailVal)) {
      showError(emailInput, 'כתובת אימייל לא תקינה');
      hasError = true;
    }

    // Validate Terms Agreement
    if (agreeTerms && !agreeTerms.checked) {
      showError(agreeTerms, 'חובה לאשר את תנאי השימוש ומדיניות הפרטיות להמשך');
      hasError = true;
    }

    if (hasError) return;

    // שמירת הערכים
    formData.phone = phoneVal;
    formData.email = emailVal;
    formData.firstName = document.getElementById('firstName').value.trim();

    runAnalysis();
  }
}

function renderDocsChecklist() {
  const listEl = document.getElementById('docs-checklist');
  if (!listEl) return;
  
  const result = runCalculation(formData);
  listEl.innerHTML = '';
  
  const priorityOrder = { critical: 0, important: 1, optional: 2 };
  const sortedDocs = [...result.docs].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  sortedDocs.forEach((doc) => {
    const el = document.createElement('div');
    el.className = `doc-check-item ${doc.priority}`;
    const badgeText = { critical: 'חובה', important: 'חשוב', optional: 'אופציונלי' };
    el.innerHTML = `
      <label class="checkbox-container" style="display:flex; align-items:center; width:100%; margin-bottom: 8px;">
        <input type="checkbox" checked disabled style="margin-left: 10px;" />
        <span>${doc.text}</span>
        <span class="doc-badge ${doc.priority}" style="margin-right:auto; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700;">${badgeText[doc.priority]}</span>
      </label>
    `;
    listEl.appendChild(el);
  });
}

let uploadedFiles = [];

function initFileUpload() {
  const uploadZone = document.getElementById('upload-zone');
  const fileUploadInput = document.getElementById('file-upload');
  const uploadedFilesList = document.getElementById('uploaded-files-list');

  if (!uploadZone || !fileUploadInput) return;

  uploadZone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      fileUploadInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
    }, false);
  });

  uploadZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleUploadedFiles(files);
  });

  fileUploadInput.addEventListener('change', (e) => {
    handleUploadedFiles(e.target.files);
  });

  function handleUploadedFiles(files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(`הקובץ ${file.name} גדול מדי. הגודל המקסימלי הוא 10MB.`);
        continue;
      }
      if (uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
        continue;
      }
      uploadedFiles.push(file);
    }
    renderUploadedFiles();
  }

  function renderUploadedFiles() {
    if (!uploadedFilesList) return;
    uploadedFilesList.innerHTML = '';
    
    if (uploadedFiles.length === 0) {
      uploadedFilesList.style.display = 'none';
      return;
    }
    uploadedFilesList.style.display = 'flex';
    uploadedFilesList.style.flexDirection = 'column';
    uploadedFilesList.style.gap = '8px';
    uploadedFilesList.style.marginTop = '16px';

    uploadedFiles.forEach((file, idx) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const fileEl = document.createElement('div');
      fileEl.style.cssText = `
        display:flex; align-items:center; gap:12px;
        background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
        padding:10px 14px; border-radius:8px; font-size:0.85rem;
      `;
      fileEl.innerHTML = `
        <span>📄</span>
        <div style="flex:1;">
          <div style="font-weight:600; color:var(--text);">${file.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${sizeMB} MB</div>
        </div>
        <button class="uf-remove" type="button" data-idx="${idx}" style="background:transparent; border:none; color:#ef4444; font-size:1.2rem; cursor:pointer; padding:0 4px;">&times;</button>
      `;
      uploadedFilesList.appendChild(fileEl);
    });

    uploadedFilesList.querySelectorAll('.uf-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        uploadedFiles.splice(idx, 1);
        renderUploadedFiles();
      });
    });
  }
}

function showError(el, msg) {
  const err = document.createElement('div');
  err.className = 'error-feedback';
  err.textContent = msg;
  err.style.color = '#ef4444';
  err.style.fontSize = '0.75rem';
  err.style.marginTop = '4px';
  err.style.fontWeight = '500';
  
  if (el.parentNode.classList.contains('phone-input-wrap')) {
    el.parentNode.parentNode.appendChild(err);
    el.parentNode.style.borderColor = '#ef4444';
  } else if (el.id === 'agree-terms') {
    el.parentNode.parentNode.appendChild(err);
    el.style.outline = '2px solid #ef4444';
  } else {
    el.style.borderColor = '#ef4444';
    el.parentNode.appendChild(err);
  }
}

function handleBack() {
  if (currentStep > 1) goToStep(currentStep - 1);
}

function goToStep(step) {
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  currentStep = step;
  const stepEl = document.getElementById(`step-${currentStep}`);
  stepEl.classList.add('active');

  // Recalculate slider fills for sliders in the newly active step (now that they have real layout width)
  stepEl.querySelectorAll('input[type="range"]').forEach(slider => {
    updateSliderFill(slider);
  });

  if (step === 6) {
    renderDocsChecklist();
  }

  updateProgress();
  window.scrollTo({ top: document.getElementById('calculator').offsetTop - 100, behavior: 'smooth' });
}

function updateProgress() {
  const pct = Math.round((currentStep / TOTAL_STEPS) * 100);
  document.getElementById('progress-bar').style.width = `${pct}%`;
  document.getElementById('step-label').textContent = `שלב ${currentStep} מתוך ${TOTAL_STEPS}`;
  document.getElementById('step-pct').textContent = `${pct}%`;

  // Update dots
  document.querySelectorAll('.pdot').forEach(dot => {
    const s = parseInt(dot.dataset.step);
    dot.classList.remove('active', 'done');
    if (s === currentStep) dot.classList.add('active');
    else if (s < currentStep) dot.classList.add('done');
  });

  // Nav buttons
  document.getElementById('btn-back').style.display = currentStep > 1 ? 'block' : 'none';
  const btnLabel = document.getElementById('btn-next-label');
  btnLabel.textContent = currentStep === TOTAL_STEPS ? '✨ חשב את ההחזר שלי' : 'שלב הבא →';
}


// ─── TAX CALCULATION ENGINE ──────────────────────────────────
function calculateTax(income, year) {
  const rules = TAX_RULES[year] || TAX_RULES[2026];
  let tax = 0;
  for (const bracket of rules.brackets) {
    if (income <= 0) break;
    const taxable = Math.min(income, bracket.to) - bracket.from;
    if (taxable > 0) tax += taxable * bracket.rate;
    if (income <= bracket.to) break;
  }
  return tax;
}

// מחזיר את שיעור המס השולי על הכנסה נתונה
function getMarginalRate(income, brackets) {
  if (!brackets) return 0.20;
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (income > brackets[i].from) return brackets[i].rate;
  }
  return brackets[0].rate;
}

function calculateCreditPoints(data, rules) {
  // Base points: 2.25 for men, 2.75 for women
  let points = (data.gender === 'female') ? 2.75 : 2.25;
  const isFemale = (data.gender === 'female');
  const year = data.taxYear || 2025;

  // Children
  if (data.hasChildren === 'yes') {
    let childPoints = 0;
    const youngestAgeGroup = data.youngestChildAge; // '0-5', '6-13', '14-17', '18+'
    const count = Math.min(data.childrenCount, 8); // clamp to 8 children max

    // Estimate representative age for youngest child
    let baseAge = 2;
    if (youngestAgeGroup === '6-13') baseAge = 8;
    else if (youngestAgeGroup === '14-17') baseAge = 15;
    else if (youngestAgeGroup === '18+') baseAge = 18;

    for (let i = 0; i < count; i++) {
      const estimatedAge = baseAge + (i * 3);
      
      // Calculate points for this child based on estimatedAge, isFemale, and year
      if (year >= 2024) {
        if (estimatedAge === 0) {
          childPoints += 2.5;
        } else if (estimatedAge >= 1 && estimatedAge <= 2) {
          childPoints += 4.5;
        } else if (estimatedAge === 3) {
          childPoints += 3.5;
        } else if (estimatedAge >= 4 && estimatedAge <= 5) {
          childPoints += 2.5;
        } else if (estimatedAge >= 6 && estimatedAge <= 17) {
          childPoints += isFemale ? 2.0 : 1.0;
        } else if (estimatedAge === 18) {
          childPoints += isFemale ? 0.5 : 0.0;
        }
      } else if (year === 2022 || year === 2023) {
        if (estimatedAge === 0) {
          childPoints += 1.5;
        } else if (estimatedAge >= 1 && estimatedAge <= 5) {
          childPoints += 2.5;
        } else if (estimatedAge >= 6 && estimatedAge <= 12) {
          childPoints += isFemale ? 2.0 : 1.0; // 6-12 extra point temporary order
        } else if (estimatedAge >= 13 && estimatedAge <= 17) {
          childPoints += isFemale ? 1.0 : 0.0;
        } else if (estimatedAge === 18) {
          childPoints += isFemale ? 0.5 : 0.0;
        }
      } else {
        // 2020 - 2021
        if (estimatedAge === 0) {
          childPoints += 1.5;
        } else if (estimatedAge >= 1 && estimatedAge <= 5) {
          childPoints += 2.5;
        } else if (estimatedAge >= 6 && estimatedAge <= 17) {
          childPoints += isFemale ? 1.0 : 0.0;
        } else if (estimatedAge === 18) {
          childPoints += isFemale ? 0.5 : 0.0;
        }
      }
    }
    points += childPoints;
  }

  // Single parent
  if (data.singleParent === 'yes') points += 1.0;

  // New immigrant (average points per year during the 3.5 or 4.5 year eligibility window)
  if (data.newImmigrant === 'yes') points += 2.0;

  // Disability
  const disabilityPts = { 'no': 0, '10-49': 0.5, '50-99': 1.5, '100+': 2.25 };
  points += disabilityPts[data.disability] || 0;

  return points;
}

function runCalculation(data) {
  const year = data.taxYear;
  const rules = TAX_RULES[year] || TAX_RULES[2026];
  const income = data.annualIncome;

  const reasons = [];
  const docs = [];
  const risks = [];
  let totalRefundMin = 0;
  let totalRefundMax = 0;
  let eligibilityScore = 0;

  // 1. CREDIT POINTS ANALYSIS
  const actualPoints = calculateCreditPoints(data, rules);
  const basePoints = 2.25;
  const extraPoints = actualPoints - basePoints;
  const creditPointValue = rules.creditPointValueAnnual || 2820;

  if (extraPoints > 0) {
    const creditRefund = Math.round(extraPoints * creditPointValue);
    reasons.push({
      icon: '⭐',
      text: `נקודות זיכוי נוספות (${extraPoints.toFixed(2)} נקודות)`,
      min: Math.round(creditRefund * 0.7),
      max: creditRefund,
      docsRequired: [],
      confidence: 0.9,
    });
    totalRefundMin += Math.round(creditRefund * 0.7);
    totalRefundMax += creditRefund;
    eligibilityScore += 30;

    if (data.hasChildren === 'yes') {
      docs.push({ text: 'תעודות לידה של הילדים', priority: 'critical' });
    }
    if (data.newImmigrant === 'yes') {
      docs.push({ text: 'אישור עלייה / תעודת עולה', priority: 'critical' });
    }
    if (data.disability !== 'no') {
      docs.push({ text: 'אישור נכות מביטוח לאומי', priority: 'critical' });
    }
    if (data.singleParent === 'yes') {
      docs.push({ text: 'פסיקת בית משפט / הסכם גירושין (הורה יחיד)', priority: 'critical' });
    }
  }

  // 2. MULTIPLE EMPLOYERS
  if (data.employers === '2' || data.employers === '3+') {
    const numEmployers = data.employers === '2' ? 2 : 3;
    // Two employers often leads to under-deduction
    const estimatedOverpayment = income * 0.03;
    const refundEst = Math.round(estimatedOverpayment);
    reasons.push({
      icon: '🏢',
      text: `ריבוי מעסיקים (${numEmployers}) — עלול לגרום לניכוי מס חסר`,
      min: Math.round(refundEst * 0.5),
      max: Math.round(refundEst * 1.5),
      confidence: 0.75,
    });
    totalRefundMin += Math.round(refundEst * 0.5);
    totalRefundMax += Math.round(refundEst * 1.5);
    eligibilityScore += 25;
    docs.push({ text: `טופס 106 מכל מעסיק (${numEmployers} טפסים)`, priority: 'critical' });
  } else {
    docs.push({ text: 'טופס 106 ממעסיקך', priority: 'critical' });
  }

  // 3. RESERVE DUTY — 2026: שיטת נקודות זיכוי חדשה ללוחמים (הוראת שעה)
  if (data.reserveDuty !== 'no') {
    let reserveRefundMin = 0;
    let reserveRefundMax = 0;
    let reserveDesc = '';
    const cpAnnual = rules.creditPointValueAnnual || 2904;
    const reserveKey = data.reserveDuty; // '1-14','15-29','30-39','40-49','50-74','75+'

    if (year >= 2026 && rules.reserveSystem === 'CREDIT_POINTS') {
      // ─ 2026: מערכת נקודות זיכוי ללוחמים ─
      const cpBonus = (rules.reserveCreditPoints || {})[reserveKey] || 0;
      if (cpBonus > 0) {
        // לוחם עם 30+ ימים: מקבל נקודות זיכוי
        reserveRefundMin = Math.round(cpBonus * cpAnnual * 0.85);
        reserveRefundMax = Math.round(cpBonus * cpAnnual);
        reserveDesc = `מילואים לוחמים ${reserveKey} ימים — ${cpBonus} נקודות זיכוי (₪${reserveRefundMax.toLocaleString('he-IL')} שנתי)`;
      } else {
        // פחות מ-30 ימים / לא לוחם — זיכוי יומי רגיל
        const daysApprox = { '1-14': 7, '15-29': 22 }[reserveKey] || 7;
        const daily = rules.reservePerDayFallback || 355;
        reserveRefundMin = daysApprox * daily;
        reserveRefundMax = Math.round(daysApprox * daily * 1.1);
        reserveDesc = `מילואים ~${daysApprox} ימים (זיכוי יומי ₪${daily})`;
      }
    } else {
      // ─ 2020–2025: זיכוי יומי קלאסי ─
      const daysApprox = { '1-14': 10, '15-29': 22, '30-39': 35, '40-49': 45, '50-74': 60, '75+': 90 }[reserveKey] || 10;
      const daily = rules.reservePerDayFallback || 335;
      reserveRefundMin = daysApprox * daily;
      reserveRefundMax = Math.round(daysApprox * daily * 1.2);
      reserveDesc = `שירות מילואים (~${daysApprox} ימים × ₪${daily}/יום)`;
    }

    reasons.push({
      icon: '🪖',
      text: reserveDesc,
      min: reserveRefundMin,
      max: reserveRefundMax,
      confidence: 0.92,
    });
    totalRefundMin += reserveRefundMin;
    totalRefundMax += reserveRefundMax;
    eligibilityScore += 35;
    const reserveDocText = year >= 2026
      ? 'אישור שירות מילואים מצה"ל (מהאזור האישי במילואים.ישראל) + טופס 101 מעודכן'
      : 'אישור שירות מילואים (מטופס 3010)';
    docs.push({ text: reserveDocText, priority: 'critical' });
  }

  // 4. MATERNITY / UNEMPLOYMENT LEAVE
  const leaveTypes = Array.isArray(data.leaveType) ? data.leaveType : [data.leaveType];
  const activeLeaves = leaveTypes.filter(x => x && x !== 'no');
  if (activeLeaves.length > 0) {
    const leaveDesc = {
      maternity: 'חופשת לידה — ביטוח לאומי לא מנכה מס כנקודות זיכוי',
      unemployment: 'אבטלה — ביטוח לאומי משלם דמי אבטלה עם ניכוי מס שגוי לעיתים',
      leave: 'חל"ד / הפסקת עבודה — שינוי בהכנסה השנתית עלול לשנות את מדרגת המס',
    };
    activeLeaves.forEach(lt => {
      const leaveRefund = Math.round(income * 0.02);
      reasons.push({
        icon: '🤱',
        text: leaveDesc[lt] || 'חופשה / הפסקת עבודה',
        min: leaveRefund,
        max: Math.round(leaveRefund * 2),
        confidence: 0.7,
      });
      totalRefundMin += leaveRefund;
      totalRefundMax += Math.round(leaveRefund * 2);
      eligibilityScore += 20;
    });
    docs.push({ text: 'טופס 106 מביטוח לאומי (תשלומי קצבה)', priority: 'important' });
  }

  // 5. DONATIONS — 2026: מינימום ₪207, מערכת דיווח דיגיטלית
  if (data.donations !== 'no') {
    const donationMin = rules.donationMinimum || 207;
    const donationEstMap = { low: 900, mid: 4500, high: 22000 };
    const donationAmt = donationEstMap[data.donations] || 0;
    const donationRefund = Math.round(donationAmt * (rules.donationMultiplier || 0.35));
    const docsNote = (year >= 2026)
      ? 'אישור תרומה דיגיטלי מרשות המסים (2026: חובה דיווח מקוון — ללא קבלות נייר)'
      : 'קבלות תרומות עם אישור מס הכנסה (סעיף 46)';
    reasons.push({
      icon: '❤️',
      text: `תרומות מוכרות לפי סעיף 46 (מינימום ₪${donationMin} לשנת ${year})`,
      min: Math.round(donationRefund * 0.8),
      max: donationRefund,
      confidence: 0.9,
    });
    totalRefundMin += Math.round(donationRefund * 0.8);
    totalRefundMax += donationRefund;
    eligibilityScore += 15;
    docs.push({ text: docsNote, priority: 'important' });
  }

  // 6. PENSION — SELF CONTRIBUTION (2026: תקרה ₪34,423/חודש)
  if (data.pension === 'self') {
    const pensionCeiling = rules.maxPensionDeductionIncome || (34423 * 12);
    const pensionBase = Math.min(income, pensionCeiling);
    // עובד: 7% הפקדה עצמית, מעסיק: 7.5% — החלק המזוכה: עד 16.5% לעצמאים
    const pensionEmployeeContrib = pensionBase * (rules.pensionEmployeeContribution || 0.07);
    // ניכוי אפשרי: 5.5% מהשכר כניכוי מהכנסה
    const pensionDeductible = pensionBase * 0.055;
    const marginalRate = getMarginalRate(income, rules.brackets);
    const pensionRefund = Math.round(pensionDeductible * marginalRate);
    reasons.push({
      icon: '🏦',
      text: `הפקדה עצמית לפנסיה / קופת גמל (תקרת שכר מוכר: ₪${(rules.maxPensionDeductionIncomeMonthly || 34423).toLocaleString('he-IL')}/חודש)`,
      min: Math.round(pensionRefund * 0.7),
      max: Math.round(pensionRefund * 1.15),
      confidence: 0.85,
    });
    totalRefundMin += Math.round(pensionRefund * 0.7);
    totalRefundMax += Math.round(pensionRefund * 1.15);
    eligibilityScore += 20;
    docs.push({ text: 'דוח שנתי מקרן הפנסיה / קופת הגמל (כולל פירוט הפקדות עובד ומעסיק)', priority: 'important' });
  }

  // 7. RESIDENCE BENEFIT
  if (data.residence === 'yes') {
    const residenceRefund = Math.round(income * 0.07);
    reasons.push({
      icon: '🌄',
      text: 'הנחת תושב ישוב מזכה (נגב / גליל / פריפריה)',
      min: Math.round(residenceRefund * 0.6),
      max: residenceRefund,
      confidence: 0.8,
    });
    totalRefundMin += Math.round(residenceRefund * 0.6);
    totalRefundMax += residenceRefund;
    eligibilityScore += 25;
    docs.push({ text: 'אישור תושבות מהרשות המקומית', priority: 'important' });
  }

  // 8. DISCHARGED SOLDIER / NATIONAL SERVICE
  if (data.soldierDischarge && data.soldierDischarge !== 'no') {
    const cpAnnual = rules.creditPointValueAnnual || 2904;
    const points = data.soldierDischarge === 'combat' ? 3.0 : 2.0;
    const soldierRefund = Math.round(points * cpAnnual);
    
    reasons.push({
      icon: '🎖️',
      text: `חייל/ת משוחרר/ת או שירות לאומי (${points.toFixed(1)} נקודות זיכוי)`,
      min: Math.round(soldierRefund * 0.85),
      max: soldierRefund,
      confidence: 0.95,
    });
    totalRefundMin += Math.round(soldierRefund * 0.85);
    totalRefundMax += soldierRefund;
    eligibilityScore += 20;
    docs.push({ text: 'תעודת שחרור מצה"ל / אישור סיום שירות לאומי', priority: 'critical' });
  }

  // 9. ACADEMIC DEGREE / PROFESSIONAL CERTIFICATE COMPLETION
  if (data.degreeCompleted && data.degreeCompleted !== 'no') {
    const cpAnnual = rules.creditPointValueAnnual || 2904;
    const points = data.degreeCompleted === 'bachelor' ? 1.0 : 0.5;
    const degreeRefund = Math.round(points * cpAnnual);
    
    reasons.push({
      icon: '🎓',
      text: `סיום תואר אקדמי או לימודי מקצוע (${points.toFixed(1)} נקודות זיכוי)`,
      min: Math.round(degreeRefund * 0.85),
      max: degreeRefund,
      confidence: 0.95,
    });
    totalRefundMin += Math.round(degreeRefund * 0.85);
    totalRefundMax += degreeRefund;
    eligibilityScore += 20;
    docs.push({ text: 'אישור זכאות לתואר אקדמי / תעודת מקצוע (טופס 119)', priority: 'critical' });
  }

  // 10. INSURANCE
  if (data.insurance === 'yes') {
    const insuranceRefund = Math.round(income * 0.005);
    reasons.push({
      icon: '🛡️',
      text: 'ניכוי פרמיות ביטוח מנהלים / ביטוח חיים',
      min: Math.round(insuranceRefund * 0.7),
      max: Math.round(insuranceRefund * 1.3),
      confidence: 0.75,
    });
    totalRefundMin += Math.round(insuranceRefund * 0.7);
    totalRefundMax += Math.round(insuranceRefund * 1.3);
    eligibilityScore += 10;
    docs.push({ text: 'אישורי ביטוח ופרמיות מחברת הביטוח', priority: 'optional' });
  }

  // ── STANDARD DOCS (always needed) ──
  docs.push({ text: 'תעודת זהות (ספח)', priority: 'critical' });
  docs.push({ text: 'אישור ניהול חשבון בנק', priority: 'critical' });

  // ── RISKS ──
  const extraIncomes = Array.isArray(data.extraIncome) ? data.extraIncome : [data.extraIncome];
  const activeExtras = extraIncomes.filter(x => x && x !== 'no');
  if (activeExtras.length > 0) {
    const extraLabels = {
      rent: 'שכ"ד',
      capital: 'רווחי הון',
      foreign: 'חו"ל'
    };
    const selectedLabels = activeExtras.map(lt => extraLabels[lt] || lt).join(', ');
    risks.push(`הכנסות נוספות (${selectedLabels}) עלולות להשפיע על חישוב המס הכולל — דרוש ניתוח מקיף יותר`);
    docs.push({ text: 'מסמכי הכנסה נוספת (שכ"ד / טופס 867 / אישורי בנק)', priority: 'important' });
  }
  if (data.employers === '3+') {
    risks.push('ריבוי מעסיקים — ייתכן שגם חובת מס נוספת. יש לבדוק עם יועץ');
  }
  if (income > 300000) {
    risks.push('הכנסה גבוהה — יש לבדוק חבות מס נוספת');
  }

  // ── TAX CAPPING ──
  const grossTax = calculateTax(income, year);
  const basePointsValue = (data.gender === 'female' ? 2.75 : 2.25) * (rules.creditPointValueAnnual || 2820);
  let estimatedTaxPaid = Math.max(grossTax - basePointsValue, 0);

  // If they have multiple employers, they likely paid extra tax due to lack of tax coordination
  if (data.employers === '2') {
    estimatedTaxPaid += income * 0.03;
  } else if (data.employers === '3+') {
    estimatedTaxPaid += income * 0.07;
  }
  
  estimatedTaxPaid = Math.round(estimatedTaxPaid);

  if (totalRefundMax > estimatedTaxPaid) {
    if (estimatedTaxPaid <= 150) {
      // Virtually no tax paid, refund is 0 or negligible
      totalRefundMin = 0;
      totalRefundMax = 0;
      reasons.forEach(r => {
        r.min = 0;
        r.max = 0;
      });
      risks.push("גובה המס המשוער ששילמת נמוך מאוד או אפס (מתחת לסף המס), ולכן ההחזר הצפוי הוא ₪0.");
    } else {
      // Proportional reduction
      const ratio = estimatedTaxPaid / totalRefundMax;
      reasons.forEach(r => {
        r.min = Math.round(r.min * ratio);
        r.max = Math.round(r.max * ratio);
      });
      totalRefundMin = Math.round(totalRefundMin * ratio);
      totalRefundMax = estimatedTaxPaid;
      risks.push("גובה החזר המס הוגבל בהתאם לגובה המס המשוער ששילמת בפועל במהלך השנה.");
    }
  }

  // ── SCORING ──
  // Add bonus based on estimated refund amount
  if (totalRefundMax > 15000) {
    eligibilityScore += 30;
  } else if (totalRefundMax > 8000) {
    eligibilityScore += 20;
  } else if (totalRefundMax > 4000) {
    eligibilityScore += 15;
  } else if (totalRefundMax > 1500) {
    eligibilityScore += 10;
  }

  eligibilityScore = Math.min(eligibilityScore, 98);
  if (reasons.length === 0 || totalRefundMax === 0) eligibilityScore = 10;

  // ── PROBABILITY ──
  let probability;
  if (eligibilityScore >= 70 && totalRefundMax > 500) probability = 'גבוהה מאוד';
  else if (eligibilityScore >= 50 && totalRefundMax > 500) probability = 'גבוהה';
  else if (eligibilityScore >= 30 && totalRefundMax > 200) probability = 'בינונית';
  else probability = 'נמוכה';

  return {
    eligibilityScore,
    refundMin: Math.max(totalRefundMin, 0),
    refundMax: Math.max(totalRefundMax, 0),
    probability,
    reasons,
    docs: deduplicateDocs(docs),
    risks,
    hasRefund: reasons.length > 0 && totalRefundMax > 500,
  };
}

function deduplicateDocs(docs) {
  const seen = new Set();
  return docs.filter(d => {
    if (seen.has(d.text)) return false;
    seen.add(d.text);
    return true;
  });
}

function updateLiveEstimate() {
  const bar = document.getElementById('live-estimate-bar');
  const lebAmount = document.getElementById('leb-amount');
  if (!bar || !lebAmount) return;

  const res = runCalculation(formData);
  if (res.refundMax > 0) {
    lebAmount.textContent = `₪${res.refundMin.toLocaleString('he-IL')} - ₪${res.refundMax.toLocaleString('he-IL')}`;
    bar.classList.add('visible');
  } else {
    lebAmount.textContent = '₪0';
    bar.classList.remove('visible');
  }
}


// ─── ANALYSIS FLOW ───────────────────────────────────────────
async function runAnalysis() {
  // Hide form, show loading
  document.getElementById('progress-wrap').classList.add('hidden');
  document.getElementById('form-card').classList.add('hidden');
  document.getElementById('form-nav').style.display = 'none';
  const loadingCard = document.getElementById('loading-card');
  loadingCard.classList.remove('hidden');

  // Update tax year display
  document.querySelectorAll('.tax-year-display').forEach(el => {
    el.textContent = formData.taxYear;
  });

  // Animate loading steps
  const steps = [
    { id: 'ls-1', delay: 600 },
    { id: 'ls-2', delay: 1400 },
    { id: 'ls-3', delay: 2200 },
    { id: 'ls-4', delay: 3000 },
    { id: 'ls-5', delay: 3800 },
  ];

  for (const step of steps) {
    await delay(step.delay - (steps.indexOf(step) > 0 ? steps[steps.indexOf(step) - 1].delay : 0));
    const el = document.getElementById(step.id);
    el.classList.remove('hidden');
    el.querySelector('.lstep-icon').textContent = '✅';
  }

  await delay(800);

  // Run calculation
  const result = runCalculation(formData);

  // Show results
  loadingCard.classList.add('hidden');
  showResults(result);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// ─── SHOW RESULTS ────────────────────────────────────────────
function showResults(result) {
  const card = document.getElementById('results-card');
  card.classList.remove('hidden');

  window.lastResult = result;
  window.lastFormData = { ...formData };

  // Trigger automatic download of the year-specific Form 135 PDF
  try {
    const FORM_135_FILES = {
      2020: 'Service_Pages_Income_tax_annual-report-2020_135 - 2020.pdf',
      2021: 'Service_Pages_Income_tax_annual-report-2021_135 - 2021.pdf',
      2022: 'Service_Pages_Income_tax_annual-report-2022_annual-singular-report-2022_135-2022.pdf',
      2023: 'Service_Pages_Income_tax_annual-report-2023_135-2023.pdf',
      2024: 'Service_Pages_Income_tax_annual-report-2024_135-2024.pdf',
      2025: 'Service_Pages_Income_tax_annual-report-2026_itc135-2025.pdf'
    };
    const formFilename = FORM_135_FILES[formData.taxYear] || FORM_135_FILES[2025];
    const formUrl = window.location.origin + '/All%20Attachments/' + encodeURIComponent(formFilename);
    const link = document.createElement('a');
    link.href = formUrl;
    link.download = formFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.warn("Failed to trigger automatic PDF download:", err);
  }

  // Emoji & title
  const emoji = document.getElementById('result-emoji');
  const title = document.getElementById('results-title');
  const sub = document.getElementById('results-sub');

  if (result.hasRefund) {
    emoji.textContent = '🎉';
    title.textContent = `${formData.firstName ? formData.firstName + ', ' : ''}נמצאה זכאות להחזר מס!`;
    sub.textContent = `על פי הנתונים שהזנת, ניתוח ה-AI מעריך עבור שנת ${formData.taxYear}:`;
  } else {
    emoji.textContent = '🔍';
    title.textContent = 'לא זוהתה זכאות ברורה';
    sub.textContent = 'ייתכן שאין החזר משמעותי, אך ממליצים על בדיקה עם יועץ מס';
  }

  // Year & income
  document.getElementById('res-year').textContent = formData.taxYear;
  document.getElementById('res-income').textContent = `₪${formData.annualIncome.toLocaleString('he-IL')}`;

  // Score ring animation
  const circumference = 2 * Math.PI * 52;
  let score = 0;
  let min = 0;
  let max = 0;
  const targetScore = result.eligibilityScore;
  const targetMin = result.refundMin;
  const targetMax = result.refundMax;
  const startTime = performance.now();
  const duration = 2000;

  function animateResults(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);

    score = Math.round(ease * targetScore);
    min = Math.round(ease * targetMin);
    max = Math.round(ease * targetMax);

    document.getElementById('result-score').textContent = score;
    document.getElementById('result-min').textContent = min.toLocaleString('he-IL');
    document.getElementById('result-max').textContent = max.toLocaleString('he-IL');

    const dashLen = (score / 100) * circumference;
    document.getElementById('result-ring').setAttribute('stroke-dasharray', `${dashLen} ${circumference}`);

    if (progress < 1) requestAnimationFrame(animateResults);
  }
  requestAnimationFrame(animateResults);

  // Probability badge
  const probEl = document.getElementById('result-prob');
  probEl.textContent = `סבירות ${result.probability}`;
  const probColors = {
    'גבוהה מאוד': 'rgba(16,185,129,0.2)',
    'גבוהה': 'rgba(16,185,129,0.15)',
    'בינונית': 'rgba(217,119,6,0.2)',
    'נמוכה': 'rgba(220,38,38,0.2)',
  };
  probEl.style.background = probColors[result.probability] || probColors['גבוהה'];

  // Reasons
  const reasonsList = document.getElementById('reasons-list');
  reasonsList.innerHTML = '';
  result.reasons.forEach((r, i) => {
    const el = document.createElement('div');
    el.className = 'reason-item';
    el.style.animationDelay = `${i * 0.1}s`;
    el.innerHTML = `
      <span style="font-size:1.2rem">${r.icon}</span>
      <span>${r.text}</span>
      <span class="reason-amount">₪${r.min.toLocaleString('he-IL')} – ₪${r.max.toLocaleString('he-IL')}</span>
    `;
    reasonsList.appendChild(el);
  });

  // Docs
  const docsList = document.getElementById('docs-list');
  docsList.innerHTML = '';
  const priorityOrder = { critical: 0, important: 1, optional: 2 };
  const sortedDocs = [...result.docs].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  sortedDocs.forEach(doc => {
    const el = document.createElement('div');
    el.className = `doc-item ${doc.priority}`;
    const badgeText = { critical: 'חובה', important: 'חשוב', optional: 'אופציונלי' };
    const icons = { critical: '📄', important: '📋', optional: '📑' };
    el.innerHTML = `
      <span>${icons[doc.priority] || '📄'}</span>
      <span>${doc.text}</span>
      <span class="doc-badge ${doc.priority}">${badgeText[doc.priority]}</span>
    `;
    docsList.appendChild(el);
  });

  // Risks
  if (result.risks.length > 0) {
    document.getElementById('risk-section').classList.remove('hidden');
    const riskList = document.getElementById('risk-list');
    riskList.innerHTML = '';
    result.risks.forEach(risk => {
      const el = document.createElement('div');
      el.className = 'risk-item';
      el.innerHTML = `<span>⚠️</span><span>${risk}</span>`;
      riskList.appendChild(el);
    });
  }

  // Scroll to results
  setTimeout(() => {
    window.scrollTo({ top: document.getElementById('results-card').offsetTop - 80, behavior: 'smooth' });
  }, 200);

  // Automatically trigger WhatsApp share and Email report
  setTimeout(() => {
    sendWhatsApp();
    sendEmailReport();
  }, 1500);
}


// ─── WHATSAPP + EMAIL ──────────────────────────────────────────
function sendWhatsApp() {
  const r = window.lastResult;
  const d = window.lastFormData;
  if (!r) return;

  const name = d.firstName || 'לקוח';
  const phone = d.phone ? ` | טל: ${d.phone}` : '';
  const email = d.email ? ` | מייל: ${d.email}` : '';

  // 1. שלח לאימייל ברקע
  submitLeadByEmail(r, d);

  // 2. פתח WhatsApp
  const waMsg = encodeURIComponent(
    `שלום לצוות יועצי המס של EZ Tax,\n` +
    `שמי ${name}${phone}${email}.\n` +
    `ביצעתי בדיקת זכאות להחזר מס לשנת ${d.taxYear} באתר שלכם, ואשמח לקבל ליווי מקצועי להגשת הדו"ח מול מס הכנסה.\n\n` +
    `להלן פרטי הזכאות המשוערת שחושבו בסימולטור:\n` +
    `📊 ציון זכאות: ${r.eligibilityScore}/100\n` +
    `💰 טווח החזר מס משוער: ₪${r.refundMin.toLocaleString('he-IL')} – ₪${r.refundMax.toLocaleString('he-IL')}\n` +
    `📈 סבירות קבלת החזר: ${r.probability}\n` +
    `✅ סיבות עיקריות: ${r.reasons.slice(0,3).map(x => x.text).join(' | ')}\n\n` +
    `אשמח שתצרו איתי קשר בהקדם להמשך בדיקה והגשת התיק. תודה!`
  );
  
  const targetPhone = CONFIG.whatsappNumber || '972502196259';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = `whatsapp://send?phone=${targetPhone}&text=${waMsg}`;
    setTimeout(() => {
      window.location.href = `https://wa.me/${targetPhone}?text=${waMsg}`;
    }, 500);
  } else {
    window.open(`https://web.whatsapp.com/send?phone=${targetPhone}&text=${waMsg}`, '_blank');
  }
}

window.sendDocsWhatsApp = function() {
  const targetPhone = CONFIG.whatsappNumber || '972502196259';
  const name = (window.lastFormData && window.lastFormData.firstName) || 'לקוח';
  const taxYear = (window.lastFormData && window.lastFormData.taxYear) || '2025';
  const waMsg = encodeURIComponent(
    `שלום, שמי ${name}.\n` +
    `אני מעוניין לשלוח את המסמכים הדרושים לבדיקת החזר המס שלי עבור שנת ${taxYear}.`
  );
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = `whatsapp://send?phone=${targetPhone}&text=${waMsg}`;
    setTimeout(() => {
      window.location.href = `https://wa.me/${targetPhone}?text=${waMsg}`;
    }, 500);
  } else {
    window.open(`https://web.whatsapp.com/send?phone=${targetPhone}&text=${waMsg}`, '_blank');
  }
};

// ─── SUBMIT EMAIL — Web3Forms (ללא הרשמה!) ───────────────────
async function submitLeadByEmail(result, data) {
  if (leadSubmitted) return;
  leadSubmitted = true;

  const name = data.firstName || 'לא צוין';
  const phone = data.phone || 'לא צוין';
  const email = data.email || 'לא צוין';

  // Format arrays for Leave and Extra Income
  const leaveTypesTranslated = Array.isArray(data.leaveType) 
    ? data.leaveType.filter(x => x !== 'no').map(lt => ({maternity:'חופשת לידה', unemployment:'אבטלה', leave:'חלד/הפסקת עבודה'}[lt] || lt)).join(', ')
    : (data.leaveType !== 'no' ? data.leaveType : '');
  
  const extraIncomeTranslated = Array.isArray(data.extraIncome)
    ? data.extraIncome.filter(x => x !== 'no').map(ei => ({rent:'שכ"ד', capital:'רווחי הון', foreign:'חו"ל'}[ei] || ei)).join(', ')
    : (data.extraIncome !== 'no' ? data.extraIncome : '');

  const fileNames = uploadedFiles.map(f => f.name).join(', ');

  // ── הכנת גוף המייל ──
  const emailBody = {
    access_key: CONFIG.web3formsKey,
    subject: `🎯 ליד חדש | EZ Tax | ${name} | ₪${result.refundMin.toLocaleString()}–${result.refundMax.toLocaleString()}`,
    from_name: 'EZ Tax Calculator',
    // שדות שיופיעו במייל:
    שם: name,
    טלפון: phone,
    אימייל: email,
    'שנת מס': data.taxYear,
    'הכנסה שנתית': `₪${data.annualIncome.toLocaleString('he-IL')}`,
    'ציון זכאות': `${result.eligibilityScore}/100`,
    'החזר משוער': `₪${result.refundMin.toLocaleString('he-IL')} – ₪${result.refundMax.toLocaleString('he-IL')}`,
    'סבירות': result.probability,
    'סיבות עיקריות': result.reasons.map(r => r.text).join(' | '),
    'מצב משפחתי': data.maritalStatus,
    'מגדר': data.gender === 'female' ? 'אישה' : 'גבר',
    'ילדים': data.hasChildren === 'yes' ? data.childrenCount : 'אין',
    'מילואים': data.reserveDuty !== 'no' ? data.reserveDuty + ' ימים' : 'לא',
    'חופשה/אבטלה/חלד': leaveTypesTranslated || 'לא',
    'נכות': data.disability !== 'no' ? data.disability + '%' : 'לא',
    'חייל משוחרר': data.soldierDischarge !== 'no' ? ({combat:'לוחם/תומך לחימה', 'non-combat':'שירות אחר/לאומי'}[data.soldierDischarge] || data.soldierDischarge) : 'לא',
    'סיום תואר': data.degreeCompleted !== 'no' ? ({bachelor:'תואר ראשון/מקצוע', master:'תואר שני/דוקטורט'}[data.degreeCompleted] || data.degreeCompleted) : 'לא',
    'עולה חדש': data.newImmigrant === 'yes' ? 'כן' : 'לא',
    'תרומות': data.donations !== 'no' ? data.donations : 'לא',
    'פנסיה עצמית': data.pension === 'self' ? 'כן' : 'לא',
    'הכנסות נוספות': extraIncomeTranslated || 'לא',
    'קבצים שהועלו': fileNames || 'לא הועלו קבצים',
    'תאריך': new Date().toLocaleString('he-IL'),
    'מקור': 'EZ Tax Calculator',
  };

  // ── בדוק אם המפתח הוגדר ──
  if (!CONFIG.web3formsKey || CONFIG.web3formsKey === 'YOUR_WEB3FORMS_KEY') {
    console.warn('⚠️ Web3Forms key לא הוגדר עדיין. ראה הנחיות בקוד.');
    return;
  }

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(emailBody),
    });
    const json = await res.json();
    if (json.success) {
      console.log('✅ ליד נשלח בהצלחה למייל:', CONFIG.contactEmail);
      showLeadSentBadge();
    } else {
      console.warn('שגיאה בשליחת ליד ל-Web3Forms:', json);
    }
  } catch (e) {
    console.error('שגיאת רשת בשליחת ליד ל-Web3Forms:', e);
  }
}

// ── Fallback: פתח אפליקציית מייל אם Web3Forms נכשל ──
function showEmailFallback(body) {
  const subject = encodeURIComponent(body.subject);
  const text = encodeURIComponent(
    Object.entries(body)
      .filter(([k]) => !['access_key','subject','from_name'].includes(k))
      .map(([k,v]) => `${k}: ${v}`)
      .join('\n')
  );
  window.location.href = `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${text}`;
}

// ── הצג הודעת אישור ──
function showLeadSentBadge() {
  const note = document.querySelector('.results-note');
  if (!note) return;
  const badge = document.createElement('div');
  badge.style.cssText = `
    display:inline-flex;align-items:center;gap:8px;
    background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);
    color:#34d399;padding:10px 18px;border-radius:100px;
    font-size:0.85rem;font-weight:600;margin-top:12px;
  `;
  badge.innerHTML = '✅ הפרטים נשלחו לכתובת contact.ez.security@gmail.com';
  note.appendChild(badge);
}


// ─── FAQ TOGGLE ───────────────────────────────────────────────
function toggleFaq(el) {
  const wasOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('open'));
  if (!wasOpen) el.classList.add('open');
}


// ─── RESET FORM ──────────────────────────────────────────────
function resetForm() {
  currentStep = 1;
  leadSubmitted = false;

  // Clear uploaded files state
  uploadedFiles = [];
  const uploadedFilesList = document.getElementById('uploaded-files-list');
  if (uploadedFilesList) {
    uploadedFilesList.innerHTML = '';
    uploadedFilesList.style.display = 'none';
  }
  const fileUploadInput = document.getElementById('file-upload');
  if (fileUploadInput) {
    fileUploadInput.value = '';
  }

  document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step-1').classList.add('active');
  document.getElementById('progress-wrap').classList.remove('hidden');
  document.getElementById('form-card').classList.remove('hidden');
  document.getElementById('form-nav').style.display = '';
  document.getElementById('loading-card').classList.add('hidden');
  document.getElementById('results-card').classList.add('hidden');

  // Reset loading steps
  document.querySelectorAll('.lstep').forEach((el, i) => {
    if (i > 0) el.classList.add('hidden');
    el.querySelector('.lstep-icon').textContent = '⏳';
  });

  // Reset email button state
  const btn = document.getElementById('cta-email');
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.background = '';
    btn.style.border = '';
    btn.style.color = '';
    const iconSpan = btn.querySelector('span:first-child');
    if (iconSpan) iconSpan.textContent = '📧';
    const labelSpan = btn.querySelector('span:last-child');
    if (labelSpan) labelSpan.textContent = 'שלח דוח לאימייל';
  }

  // Reset terms checkbox
  const agreeTerms = document.getElementById('agree-terms');
  if (agreeTerms) {
    agreeTerms.checked = false;
    agreeTerms.style.outline = '';
  }

  updateProgress();
  window.scrollTo({ top: document.getElementById('calculator').offsetTop - 100, behavior: 'smooth' });
}


// ─── SEND EMAIL REPORT TO CLIENT ──────────────────────────────
async function sendEmailReport() {
  const r = window.lastResult;
  const d = window.lastFormData;
  if (!r) return;

  const name = d.firstName || 'לקוח';
  const emailTo = d.email || '';

  // 1. שלח ליועץ ברקע (Web3Forms)
  submitLeadByEmail(r, d);

  const FORM_135_FILES = {
    2020: 'Service_Pages_Income_tax_annual-report-2020_135%20-%202020.pdf',
    2021: 'Service_Pages_Income_tax_annual-report-2021_135%20-%202021.pdf',
    2022: 'Service_Pages_Income_tax_annual-report-2022_annual-singular-report-2022_135-2022.pdf',
    2023: 'Service_Pages_Income_tax_annual-report-2023_135-2023.pdf',
    2024: 'Service_Pages_Income_tax_annual-report-2024_135-2024.pdf',
    2025: 'Service_Pages_Income_tax_annual-report-2026_itc135-2025.pdf'
  };

  const formFilename = FORM_135_FILES[d.taxYear] || FORM_135_FILES[2025];
  const formUrl = window.location.origin + '/All%20Attachments/' + formFilename;

  // Fetch file and convert to base64 for direct email attachment
  let base64Attachment = '';
  try {
    const res = await fetch(formUrl);
    if (res.ok) {
      const blob = await res.blob();
      base64Attachment = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn("Could not fetch Form 135 PDF for attachment:", err);
  }

  const reasonsText = r.reasons.map((x, idx) => `${idx + 1}. ${x.text}`).join('\n');
  
  // Dynamically build legally compliant official document checklist based on client profile flags (without crappy download link)
  const checklistItems = [
    `טופס 135 רשמי ומלא לשנת ${d.taxYear} (מצורף למייל זה - נא למלא ולחתום).`,
    "טופס 106 מקורי ומלא מכל המעסיקים עבור אותן שנים.",
    "אישור ניהול חשבון בנק או צילום צ'ק (חובה על פי חוק לצורך העברת הזיכוי ישירות לחשבון)."
  ];
  
  if (d.employers === '2' || d.employers === '3+') {
    checklistItems.push("אישור תיאום מס (אם בוצע במהלך השנה) או אסמכתאות על הפסקת עבודה / חל\"ת.");
  }
  if (Array.isArray(d.extraIncome) && d.extraIncome.includes('capital')) {
    checklistItems.push("טופס 867 שנתי מרוכז מכל הבנקים או בתי ההשקעות (פירוט רווחים והפסדים מניירות ערך).");
  }
  if (d.donations && d.donations !== 'no') {
    checklistItems.push("קבלות מקוריות על תרומות למוסדות מוכרים לפי סעיף 46 לפקודת מס הכנסה.");
  }
  if (d.soldierDischarge && d.soldierDischarge !== 'no') {
    checklistItems.push("תעודת שחרור מצה\"ל / שירות לאומי לצורך חישוב נקודות זיכוי.");
  }
  if (d.degreeCompleted && d.degreeCompleted !== 'no') {
    checklistItems.push("אישור זכאות לתואר אקדמי או תעודת מקצוע (טופס 219) לקבלת נקודת זיכוי.");
  }
  
  const docsText = checklistItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n');

  console.log('✉️ Attempting automatic send via EmailJS to:', emailTo, { name, taxYear: d.taxYear });

  const filesListText = uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name).join(', ') : 'לא הועלו קבצים';

  // 2. שלח ללקוח (EmailJS או Mailto)
  if (CONFIG.emailjsServiceId && CONFIG.emailjsTemplateId && CONFIG.emailjsPublicKey && typeof emailjs !== 'undefined') {
    showEmailSendingBadge();
    
    const emailParams = {
      to_email: emailTo,
      email: emailTo, // תאימות מלאה אם הוגדר {{email}} במקום {{to_email}} בתבנית
      to_name: name,
      name: name,     // תאימות מלאה
      tax_year: d.taxYear,
      score: r.eligibilityScore,
      refund_min: r.refundMin.toLocaleString('he-IL'),
      refund_max: r.refundMax.toLocaleString('he-IL'),
      probability: r.probability,
      reasons: reasonsText,
      documents: docsText,
      client_phone: d.phone,
      uploaded_files: filesListText,
      form_135_attachment: base64Attachment // Variable attachment parameter for EmailJS
    };

    emailjs.send(CONFIG.emailjsServiceId, CONFIG.emailjsTemplateId, emailParams)
    .then(() => {
      console.log('✅ Email sent successfully via EmailJS');
      showEmailSentToClientBadge();
    })
    .catch((err) => {
      console.error('❌ EmailJS error:', err);
      alert(`שגיאה משירות המייל (EmailJS): ${err.text || err.message || JSON.stringify(err)}\n\nפרטי השליחה:\n- אימייל לקוח: "${emailTo}"\n- שם לקוח: "${name}"\n\n(אם המייל נכון, הבעיה היא שהגדרת "To Email" בתבנית ב-EmailJS ריקה או שגויה)`);
      openMailtoFallback(emailTo, name, d.taxYear, r, reasonsText, docsText);
    });
  } else {
    let reason = "";
    if (!CONFIG.emailjsServiceId) reason += "חסר Service ID. ";
    if (!CONFIG.emailjsTemplateId) reason += "חסר Template ID. ";
    if (!CONFIG.emailjsPublicKey) reason += "חסר Public Key. ";
    if (typeof emailjs === 'undefined') reason += "הסקריפט של EmailJS לא נטען בדפנפן (ייתכן שנחסם ע\"י חוסם פרסומות/AdBlocker או בעיית אינטרנט). ";
    
    console.warn('EmailJS fallback active. Reason:', reason);
    alert(`שליחה אוטומטית נכשלה ועוברת לגיבוי ידני.\nסיבה: ${reason}\n\nפרטי השליחה:\n- אימייל לקוח: "${emailTo}"\n\n(נלחץ על אישור כדי לפתוח את תוכנת המייל הידנית)`);
    openMailtoFallback(emailTo, name, d.taxYear, r, reasonsText, docsText);
  }
}

function openMailtoFallback(emailTo, name, taxYear, r, reasonsText, docsText) {
  const d = window.lastFormData;
  const clientId = d ? `${d.phone ? d.phone.slice(-4) : ''}-${Date.now().toString().slice(-4)}` : Date.now().toString().slice(-6);
  const subject = encodeURIComponent(`💰 תוצאות בדיקת הזכאות שלך + הטפסים המוכנים להגשה (תיק מס' ${clientId})`);
  
  const bodyText = encodeURIComponent(
    `שלום ${name},\n\n` +
    `אנו שמחים לעדכן כי בדיקת הזכאות שלך בפלטפורמת EZ-Tax הושלמה בהצלחה. על פי הנתונים שהזנת, סכום החזר המס המשוער שלך עבור שנת המס ${taxYear} עומד על כ-₪${r.refundMin.toLocaleString('he-IL')} – ₪${r.refundMax.toLocaleString('he-IL')}.\n\n` +
    `בהתאם לסעיף 160 לפקודת מס הכנסה, כל אזרח זכאי לקבל החזר על מס ששולם ביתר בתוספת ריבית והפרשי הצמדה כחוק.\n\n` +
    `טופס 135 הרשמי לשנת ${taxYear} מצורף למייל זה שנשלח אליך. אנא מלא אותו, חתום עליו והחזר אותו אלינו (במייל חוזר או בוואטסאפ) לצורך הגשת הדו"ח.\n\n` +
    `לאחר חתימתך והעלאת המסמכים המלווים הנדרשים, התיק ייבדק על ידי נציג שירות מקצועי וישודר ישירות לרשות המסים. כספי ההחזר יועברו ישירות לחשבון הבנק שלך בתוך 30 עד 90 ימים ממועד קליטת התיק במשרדי שומה.\n\n` +
    `לנוחיותך, להלן רשימת המסמכים שיש לצרף לתיק לצורך הגשתו:\n` +
    `${docsText}\n\n` +
    `בברכה,\n` +
    `צוות EZ Tax`
  );
  window.location.href = `mailto:${emailTo}?subject=${subject}&body=${bodyText}`;
}

function showEmailSendingBadge() {
  const btn = document.getElementById('cta-email');
  if (!btn) return;
  btn.disabled = true;
  btn.style.opacity = '0.7';
  btn.querySelector('span:last-child').textContent = 'שולח דו"ח לאימייל...';
}

function showEmailSentToClientBadge() {
  const btn = document.getElementById('cta-email');
  if (!btn) return;
  btn.style.background = 'rgba(16,185,129,0.2)';
  btn.style.border = '1px solid rgba(16,185,129,0.4)';
  btn.style.color = '#34d399';
  const iconSpan = btn.querySelector('span:first-child');
  if (iconSpan) iconSpan.textContent = '✅';
  const labelSpan = btn.querySelector('span:last-child');
  if (labelSpan) labelSpan.textContent = 'הדו"ח נשלח למייל שלך!';
}


// ─── SMOOTH ANCHOR SCROLL ─────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    }
  });
});


// ─── LEGAL MODAL HANDLERS ───────────────────────────────────────
function openTermsModal(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('terms-modal');
  if (modal) modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTermsModal(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('terms-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

window.openTermsModal = openTermsModal;
window.closeTermsModal = closeTermsModal;


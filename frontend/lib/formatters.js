/**
 * Bangladeshi Currency & Date Formatting Helpers
 */

const BANGLA_DIGITS = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBanglaDigits(input) {
  if (input === null || input === undefined) return '';
  return String(input).replace(/[0-9]/g, (digit) => BANGLA_DIGITS[digit] || digit);
}

/**
 * Format amount into Bangladeshi Taka (BDT ৳) with Indian/Bangladeshi comma separators (e.g. 1,50,000)
 */
export function formatBDT(amount, lang = 'bn') {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (lang === 'bn') {
    return `৳ ${toBanglaDigits(formatted)}`;
  }
  return `৳ ${formatted}`;
}

/**
 * Format Date to dd/mm/yyyy in Asia/Dhaka
 */
export function formatDate(dateInput, lang = 'bn') {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const formatted = `${day}/${month}/${year}`;
  return lang === 'bn' ? toBanglaDigits(formatted) : formatted;
}

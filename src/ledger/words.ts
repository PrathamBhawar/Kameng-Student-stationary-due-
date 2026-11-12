// Amounts in words, Indian system: "One lakh twenty thousand five hundred rupees".

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0–99 in words. */
function upTo99(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

/** 0–999 in words. */
function upTo999(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  return [h ? ONES[h] + ' hundred' : '', r ? upTo99(r) : ''].filter(Boolean).join(' ');
}

/** Whole rupees in words, e.g. 120 → "One hundred twenty rupees", 150000 → "One lakh fifty thousand rupees". */
export function amountInWords(amount: number): string {
  const n = Math.floor(Math.abs(amount));
  if (n === 0) return 'Zero rupees';
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  const parts = [
    crore ? (crore > 999 ? amountInWords(crore).replace(/ rupees?$/, '').toLowerCase() : upTo999(crore)) + ' crore' : '',
    lakh ? upTo99(lakh) + ' lakh' : '',
    thousand ? upTo99(thousand) + ' thousand' : '',
    rest ? upTo999(rest) : '',
  ].filter(Boolean).join(' ');
  const words = parts + (n === 1 ? ' rupee' : ' rupees');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const AS_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Western digits to Assamese numerals: "₹1,200" → "₹১,২০০". */
export const toAssameseDigits = (s: string) => s.replace(/[0-9]/g, (d) => AS_DIGITS[+d]);

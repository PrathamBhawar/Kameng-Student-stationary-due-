import type { DisputeReason } from './ledger/types';

export type Lang = 'en' | 'as';

export type Strings = {
  overview: string; students: string; profile: string; scan: string; greet: (first: string) => string;
  total: string; pending: string; overdue: string; settled: string; all: string; search: string;
  addDue: string; receive: string; remind: string; history: string; n: (k: number) => string; owe: string;

  // Receipts
  receipt: string; sendWhatsApp: string; sendAgain: string; later: string; noWhatsApp: string; addNumber: string;
  waOpened: string; waFailed: string; didItGo: (name: string) => string; sent: string; notYet: string;
  stSent: string; stOpened: string; stNotSent: string; stNoPhone: string; accepted: string;
  receiptsNotSent: string; unsentTitle: string; allSent: string; send: string;

  // Disputes
  disputes: string; disputed: string; disputedAfter: string; inDispute: (amt: string) => string;
  studentSaysWrong: string; whatsWrong: string; markDisputed: string; reasons: Record<DisputeReason, string>;
  disputesThisMonth: (n: number) => string; cardMisused: string; daysOpenLabel: (n: number) => string;
  noDisputes: string; underReview: (amt: string) => string; inDisputeStatus: string;

  // Resolve
  resolve: string; evidence: string; items: string; amount: string; when: string; enteredBy: string;
  windowLabel: string; windowPassed: string; windowOpen: string; windowNone: string;
  keepIt: string; keepSub: string; changeAmount: string; changeSub: string; removeIt: string; removeSub: string;
  wrongStudent: string; wrongSub: string; pickStudent: string; saveChange: string; moveTo: (name: string) => string;
  kept: (amt: string) => string; changedTo: (amt: string) => string; removedAmt: (amt: string) => string; movedToast: (name: string) => string;

  // History
  dueAdded: string; paymentReceived: string; correction: string; removed: string;
  movedTo: (name: string) => string; movedFrom: (name: string) => string; correctedTo: (amt: string) => string; left: string;

  // Add due / Receive Payment
  saveFor: (amt: string, name: string) => string; receiveFrom: (amt: string, name: string) => string;
  usualTimes: (amt: string, x: number, name: string) => string; largeAmount: (amt: string) => string; correctQ: string;
  yesSave: string; sameAsAgo: (min: number) => string; addAgainQ: string; addAgain: string; wasDuplicate: string;
  savedAmt: (amt: string) => string; undo: string; undone: string;
  phoneLabel: string; addPhoneHint: string; saveFailed: string;
};

const EN_REASONS: Record<DisputeReason, string> = {
  didnt_buy: 'Didn’t buy it', wrong_amount: 'Wrong amount', already_paid: 'Already paid', card_misused: 'Someone used my card',
};

const EN: Strings = {
  overview: 'Overview', students: 'Students', profile: 'Profile', scan: 'Scan',
  greet: (f) => 'Good morning ' + f + ' 👋', total: 'Total outstanding', pending: 'Pending', overdue: 'Overdue',
  settled: 'Settled', all: 'All', search: 'Name, ID, room or city', addDue: 'Add due', receive: 'Receive Payment',
  remind: 'Remind', history: 'History', n: (k) => k + (k === 1 ? ' student' : ' students'), owe: ' owe',

  receipt: 'Receipt', sendWhatsApp: 'Send on WhatsApp', sendAgain: 'Send again', later: 'Later',
  noWhatsApp: 'No WhatsApp number', addNumber: 'Add number', waOpened: 'WhatsApp opened', waFailed: 'Couldn’t open WhatsApp',
  didItGo: (n) => 'Did the receipt go to ' + n + '?', sent: 'Sent', notYet: 'Not yet',
  stSent: 'Sent', stOpened: 'Opened', stNotSent: 'Not sent', stNoPhone: 'No phone', accepted: 'Accepted',
  receiptsNotSent: 'Receipts not sent', unsentTitle: 'Unsent receipts', allSent: 'All receipts sent', send: 'Send',

  disputes: 'Disputes', disputed: 'Disputed', disputedAfter: 'Disputed after 24 h', inDispute: (a) => a + ' in dispute',
  studentSaysWrong: 'Student says it’s wrong', whatsWrong: 'What’s wrong?', markDisputed: 'Mark disputed', reasons: EN_REASONS,
  disputesThisMonth: (n) => n + ' disputes this month', cardMisused: 'Card used by someone else',
  daysOpenLabel: (n) => n + ' days open', noDisputes: 'No open disputes', underReview: (a) => a + ' is under review.',
  inDisputeStatus: 'In dispute',

  resolve: 'Resolve', evidence: 'Evidence', items: 'Items', amount: 'Amount', when: 'When', enteredBy: 'Entered by',
  windowLabel: '24-hour window', windowPassed: 'Passed, no reply', windowOpen: 'Still open', windowNone: 'Receipt not confirmed',
  keepIt: 'Keep it', keepSub: 'The amount stays', changeAmount: 'Change amount', changeSub: 'Enter the right amount',
  removeIt: 'Remove it', removeSub: 'Cancel this entry', wrongStudent: 'Wrong student', wrongSub: 'Move it to someone else',
  pickStudent: 'Pick student', saveChange: 'Save change', moveTo: (n) => 'Move to ' + n,
  kept: (a) => a + ' kept', changedTo: (a) => 'Changed to ' + a, removedAmt: (a) => a + ' removed', movedToast: (n) => 'Moved to ' + n,

  dueAdded: 'Due added', paymentReceived: 'Payment received', correction: 'Correction', removed: 'Removed',
  movedTo: (n) => 'Moved to ' + n, movedFrom: (n) => 'Moved from ' + n, correctedTo: (a) => 'Corrected → ' + a, left: 'Left',

  saveFor: (a, n) => 'Save ' + a + ' for ' + n, receiveFrom: (a, n) => 'Receive ' + a + ' from ' + n,
  usualTimes: (a, x, n) => a + ' is ' + x + '× ' + n + '’s usual.', largeAmount: (a) => a + ' is a large amount.', correctQ: 'Correct?',
  yesSave: 'Yes, save', sameAsAgo: (m) => (m < 1 ? 'Same as a moment ago.' : 'Same as ' + m + ' min ago.'), addAgainQ: 'Add again?',
  addAgain: 'Add again', wasDuplicate: 'It was a duplicate', savedAmt: (a) => 'Saved ' + a, undo: 'Undo', undone: 'Entry undone',
  phoneLabel: 'Phone', addPhoneHint: 'Add their WhatsApp number', saveFailed: 'Couldn’t save. Try again.',
};

const AS: Strings = {
  overview: 'সাৰাংশ', students: 'ছাত্ৰ-ছাত্ৰী', profile: 'প্ৰফাইল', scan: 'স্কেন',
  greet: (f) => 'নমস্কাৰ ' + f + ' 👋', total: 'মুঠ বাকী', pending: 'বাকী আছে', overdue: 'পলম হৈছে',
  settled: 'পৰিশোধিত', all: 'সকলো', search: 'নাম, ID, ৰুম বা চহৰ', addDue: 'বাকী লিখক', receive: 'ধন লওক',
  remind: 'সোঁৱৰাওক', history: 'হিচাপ', n: (k) => k + ' জন', owe: '',

  receipt: 'ৰচিদ', sendWhatsApp: 'WhatsAppত পঠিয়াওক', sendAgain: 'আকৌ পঠিয়াওক', later: 'পিছত',
  noWhatsApp: 'WhatsApp নম্বৰ নাই', addNumber: 'নম্বৰ যোগ কৰক', waOpened: 'WhatsApp খোলা হ’ল',
  waFailed: EN.waFailed, // TODO(as)
  didItGo: EN.didItGo, // TODO(as)
  sent: 'পঠোৱা হ’ল', notYet: 'এতিয়াও নাই',
  stSent: 'পঠোৱা হ’ল', stOpened: 'খোলা হ’ল', stNotSent: 'পঠোৱা হোৱা নাই', stNoPhone: 'ফোন নাই',
  accepted: EN.accepted, // TODO(as)
  receiptsNotSent: 'ৰচিদ পঠোৱা হোৱা নাই', unsentTitle: 'ৰচিদ বাকী',
  allSent: EN.allSent, // TODO(as)
  send: 'পঠিয়াওক',

  disputes: 'আপত্তি', disputed: 'আপত্তি', disputedAfter: EN.disputedAfter, // TODO(as)
  inDispute: (a) => a + ' আপত্তিত',
  studentSaysWrong: EN.studentSaysWrong, // TODO(as)
  whatsWrong: EN.whatsWrong, // TODO(as)
  markDisputed: EN.markDisputed, // TODO(as)
  reasons: { didnt_buy: 'কিনা নাই', wrong_amount: 'ভুল পৰিমাণ', already_paid: 'আগতেই দিছে', card_misused: EN_REASONS.card_misused }, // TODO(as) card_misused
  disputesThisMonth: EN.disputesThisMonth, // TODO(as)
  cardMisused: EN.cardMisused, // TODO(as)
  daysOpenLabel: (n) => n + ' দিন', // TODO(as) check wording
  noDisputes: EN.noDisputes, // TODO(as)
  underReview: EN.underReview, // TODO(as)
  inDisputeStatus: 'আপত্তিত',

  resolve: EN.resolve, // TODO(as)
  evidence: EN.evidence, // TODO(as)
  items: 'বস্তু', amount: 'পৰিমাণ', when: 'কেতিয়া', enteredBy: EN.enteredBy, // TODO(as)
  windowLabel: EN.windowLabel, windowPassed: EN.windowPassed, windowOpen: EN.windowOpen, windowNone: EN.windowNone, // TODO(as)
  keepIt: EN.keepIt, keepSub: EN.keepSub, changeAmount: 'পৰিমাণ সলনি কৰক', changeSub: EN.changeSub, // TODO(as)
  removeIt: EN.removeIt, removeSub: EN.removeSub, wrongStudent: EN.wrongStudent, wrongSub: EN.wrongSub, // TODO(as)
  pickStudent: EN.pickStudent, saveChange: EN.saveChange, moveTo: EN.moveTo, // TODO(as)
  kept: EN.kept, changedTo: EN.changedTo, removedAmt: EN.removedAmt, movedToast: EN.movedToast, // TODO(as)

  dueAdded: 'বাকী লিখা হ’ল', paymentReceived: 'ধন পোৱা হ’ল',
  correction: EN.correction, removed: EN.removed, movedTo: EN.movedTo, movedFrom: EN.movedFrom, correctedTo: EN.correctedTo, // TODO(as)
  left: 'বাকী',

  saveFor: EN.saveFor, receiveFrom: EN.receiveFrom, // TODO(as)
  usualTimes: EN.usualTimes, largeAmount: EN.largeAmount, // TODO(as)
  correctQ: 'শুদ্ধনে?', yesSave: EN.yesSave, // TODO(as)
  sameAsAgo: EN.sameAsAgo, addAgainQ: EN.addAgainQ, addAgain: EN.addAgain, wasDuplicate: EN.wasDuplicate, // TODO(as)
  savedAmt: EN.savedAmt, undo: EN.undo, undone: EN.undone, // TODO(as)
  phoneLabel: 'ফোন', addPhoneHint: EN.addPhoneHint, // TODO(as)
  saveFailed: EN.saveFailed, // TODO(as)
};

export const strings = (l: Lang) => (l === 'as' ? AS : EN);

/** The WhatsApp receipt and reminder text, in the shop's language. */
export type ReceiptStrings = {
  shop: (hostel: string) => string; receipt: string; bought: string; paid: string; previous: string; totalNow: string;
  allPaid: string; replyNo: string; noReceipt: string; correctionTo: (no: string) => string; removed: (no: string) => string;
  changed: string; movedFrom: (name: string) => string; movedTo: (name: string) => string; confirmed: (amt: string) => string;
  shopItems: string; months: string[];
  remind: (first: string, owner: string, hostel: string, amt: string) => string; underReview: (amt: string) => string;
};

const RC_EN: ReceiptStrings = {
  shop: (h) => h + ' Hostel Shop', receipt: 'Receipt', bought: 'Bought', paid: 'Paid', previous: 'Previous due',
  totalNow: 'Total due now', allPaid: 'All dues paid ✓', replyNo: 'Reply NO within 24 hours if this is wrong.',
  noReceipt: 'No receipt? It isn’t recorded. Ask at the counter.',
  correctionTo: (no) => 'Correction to ' + no, removed: (no) => 'Removed ' + no, changed: 'Changed',
  movedFrom: (n) => 'Moved from ' + n, movedTo: (n) => 'Moved to ' + n, confirmed: (a) => 'Confirmed: ' + a + ' stays',
  shopItems: 'Shop items', months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  remind: (f, o, h, a) => 'Hi ' + f + ', this is ' + o + ' from ' + h + ' Hostel shop. Your balance is ' + a + '. Please check. Thank you.',
  underReview: (a) => a + ' is under review.',
};

const RC_AS: ReceiptStrings = {
  shop: (h) => h + ' হোষ্টেল দোকান', receipt: 'ৰচিদ', bought: 'কিনিলে', paid: 'পৰিশোধ', previous: 'আগৰ বাকী',
  totalNow: 'এতিয়াৰ মুঠ বাকী', allPaid: 'সকলো বাকী পৰিশোধ ✓',
  replyNo: RC_EN.replyNo, // TODO(as)
  noReceipt: RC_EN.noReceipt, // TODO(as)
  correctionTo: RC_EN.correctionTo, removed: RC_EN.removed, changed: RC_EN.changed, // TODO(as)
  movedFrom: RC_EN.movedFrom, movedTo: RC_EN.movedTo, confirmed: RC_EN.confirmed, // TODO(as)
  shopItems: 'দোকানৰ বস্তু', months: RC_EN.months, // TODO(as) month names
  remind: RC_EN.remind, // TODO(as)
  underReview: RC_EN.underReview, // TODO(as)
};

export const receiptStrings = (l: Lang) => (l === 'as' ? RC_AS : RC_EN);

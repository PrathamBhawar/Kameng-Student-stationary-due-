// The text of a WhatsApp receipt or reminder. Pure, so it can be previewed, sent and tested alike.
import { receiptStrings, type Lang } from '../i18n';
import { balanceAround, correctedEffect, disputedAmount, isMoveTo, undisputedBalance } from './balance';
import type { Entry } from './types';

const groupIN = (n: number) => {
  const s = String(Math.abs(Math.round(n)));
  if (s.length <= 3) return s;
  return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
};
const rs = (n: number) => '₹' + groupIN(n);

/** "12 Nov, 12:20", in the phone's local time. */
export function receiptDate(iso: string, lang: Lang = 'en'): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return d.getDate() + ' ' + receiptStrings(lang).months[d.getMonth()] + ', ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

export interface ReceiptContext {
  all: Entry[];
  nameOf: (studentId: string) => string;
  hostel: string;
  owner: string; // first name
  lang: Lang;
}

/** The receipt for an entry, or (kind 'kept') the "Confirmed: ₹120 stays" note after a dispute. */
export function receiptMessage(e: Entry, kind: 'entry' | 'kept', ctx: ReceiptContext): string {
  const R = receiptStrings(ctx.lang);
  const ref = e.refId ? ctx.all.find((x) => x.id === e.refId) : undefined;
  const when = kind === 'kept' ? (e.dispute?.resolvedAt || e.createdAt) : e.createdAt;
  const { before, after } = balanceAround(ctx.all, e);
  const lines: string[] = [R.shop(ctx.hostel) + ' · ' + R.receipt + ' ' + e.receiptNo, receiptDate(when, ctx.lang), ''];

  if (kind === 'entry' && e.type === 'correction' && ref) lines.push(R.correctionTo(ref.receiptNo));
  if (kind === 'entry' && e.type === 'reversal' && ref) lines.push(R.removed(ref.receiptNo) + ': ' + rs(e.amount));
  lines.push(ctx.nameOf(e.studentId));

  if (kind === 'kept') {
    lines.push(R.confirmed(rs(Math.abs(correctedEffect(ctx.all, e)))));
  } else if (e.type === 'due') {
    lines.push(R.bought + ': ' + (e.note || R.shopItems) + ' · ' + rs(e.amount));
  } else if (e.type === 'payment') {
    lines.push(R.paid + ': ' + rs(e.amount) + ' · ' + (e.method || 'Cash'));
  } else if (e.type === 'correction' && ref) {
    const others = ctx.all.filter((x) => x.id !== e.id);
    lines.push(R.changed + ': ' + rs(Math.abs(correctedEffect(others, ref))) + ' → ' + rs(e.amount));
  } else if (e.type === 'transfer_out' || e.type === 'transfer_in') {
    const other = ctx.nameOf(e.otherStudentId || '');
    const moved = isMoveTo(ctx.all, e) ? R.movedTo(other) : R.movedFrom(other);
    lines.push(moved + ': ' + rs(e.amount));
  }

  if (kind !== 'kept') lines.push(R.previous + ': ' + rs(Math.max(before, 0)));
  lines.push(after <= 0 ? R.allPaid : R.totalNow + ': ' + rs(after));
  lines.push('', R.replyNo, R.noReceipt, '— ' + ctx.owner);
  return lines.join('\n');
}

/** WhatsApp reminder: asks only for the undisputed amount, and says what is under review. */
export function remindMessage(studentId: string, ctx: ReceiptContext): string {
  const R = receiptStrings(ctx.lang);
  const first = ctx.nameOf(studentId).split(' ')[0];
  const owed = Math.max(undisputedBalance(ctx.all, studentId), 0);
  const disputed = disputedAmount(ctx.all, studentId);
  return R.remind(first, ctx.owner, ctx.hostel, rs(owed)) + (disputed > 0 ? ' ' + R.underReview(rs(disputed)) : '');
}

/** wa.me link with the message filled in. */
export const whatsAppUrl = (phone: string, text: string) => 'https://wa.me/91' + phone + '?text=' + encodeURIComponent(text);

import { receiptDate, receiptMessage, remindMessage, whatsAppUrl } from '../receipt';
import type { Entry } from '../types';

const names: Record<string, string> = { a: 'Ankur Bora', b: 'Rahul Verma' };
const base = { by: 'Sampath', receipt: { status: 'not_sent' as const } };
const at = (h: number, m: number) => new Date(2026, 10, 12, h, m).toISOString();
const old: Entry = { ...base, id: '1', receiptNo: 'SD-1020', studentId: 'a', type: 'due', amount: 380, note: 'Bucket', createdAt: at(10, 0) };
const due: Entry = { ...base, id: '2', receiptNo: 'SD-1021', studentId: 'a', type: 'due', amount: 120, note: '2 notebooks, gel pens', createdAt: at(12, 20) };
const ctx = (all: Entry[]) => ({ all, nameOf: (id: string) => names[id], hostel: 'Kameng', owner: 'Sampath', lang: 'en' as const });

describe('receiptMessage', () => {
  it('writes the due receipt exactly', () => {
    expect(receiptMessage(due, 'entry', ctx([old, due]))).toBe([
      'Kameng Hostel Shop · Receipt SD-1021',
      '12 Nov, 12:20',
      '',
      'Ankur Bora',
      'Bought: 2 notebooks, gel pens · ₹120',
      'Previous due: ₹380',
      'Total due now: ₹500',
      '',
      'Reply NO within 24 hours if this is wrong.',
      'No receipt? It isn’t recorded. Ask at the counter.',
      '— Sampath',
    ].join('\n'));
  });

  it('says All dues paid after a full payment', () => {
    const pay: Entry = { ...base, id: '3', receiptNo: 'SD-1022', studentId: 'a', type: 'payment', amount: 500, method: 'UPI', createdAt: at(13, 0) };
    const msg = receiptMessage(pay, 'entry', ctx([old, due, pay]));
    expect(msg).toContain('Paid: ₹500 · UPI');
    expect(msg).toContain('Previous due: ₹500');
    expect(msg).toContain('All dues paid ✓');
  });

  it('heads corrections, removals and moves with the receipt they change', () => {
    const corr: Entry = { ...base, id: '4', receiptNo: 'SD-1023', studentId: 'a', type: 'correction', amount: 60, delta: -60, refId: '2', createdAt: at(14, 0) };
    const c = receiptMessage(corr, 'entry', ctx([old, due, corr]));
    expect(c).toContain('Correction to SD-1021');
    expect(c).toContain('Changed: ₹120 → ₹60');
    expect(c).toContain('Total due now: ₹440');

    const rev: Entry = { ...base, id: '5', receiptNo: 'SD-1024', studentId: 'a', type: 'reversal', amount: 120, refId: '2', createdAt: at(14, 0) };
    const r = receiptMessage(rev, 'entry', ctx([old, due, rev]));
    expect(r.split('\n').slice(3, 5)).toEqual(['Removed SD-1021: ₹120', 'Ankur Bora']);
    expect(r.match(/Removed SD-1021/g)).toHaveLength(1);

    const out: Entry = { ...base, id: '6', receiptNo: 'SD-1025', studentId: 'a', type: 'transfer_out', amount: 120, refId: '2', otherStudentId: 'b', createdAt: at(14, 0) };
    const into: Entry = { ...base, id: '7', receiptNo: 'SD-1026', studentId: 'b', type: 'transfer_in', amount: 120, refId: '2', otherStudentId: 'a', createdAt: at(14, 0) };
    expect(receiptMessage(out, 'entry', ctx([old, due, out, into]))).toContain('Moved to Rahul Verma: ₹120');
    expect(receiptMessage(into, 'entry', ctx([old, due, out, into]))).toContain('Moved from Ankur Bora: ₹120');
  });

  it('writes the Keep it confirmation', () => {
    const kept: Entry = { ...due, dispute: { status: 'resolved', reason: 'didnt_buy', openedAt: at(13, 0), resolvedAt: at(15, 5), outcome: 'kept' } };
    const msg = receiptMessage(kept, 'kept', ctx([old, kept]));
    expect(msg).toContain('15:05');
    expect(msg).toContain('Confirmed: ₹120 stays');
  });
});

describe('remindMessage', () => {
  it('asks only for the undisputed amount', () => {
    const disputed: Entry = { ...due, dispute: { status: 'open', reason: 'didnt_buy', openedAt: at(13, 0) } };
    const msg = remindMessage('a', ctx([old, disputed]));
    expect(msg).toContain('Your balance is ₹380.');
    expect(msg).toContain('₹120 is under review.');
  });
});

it('formats dates and links', () => {
  expect(receiptDate(at(9, 5))).toBe('12 Nov, 09:05');
  expect(whatsAppUrl('9000010009', 'Hi & bye')).toBe('https://wa.me/919000010009?text=Hi%20%26%20bye');
});

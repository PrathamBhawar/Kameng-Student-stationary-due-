import {
  balance, balanceAround, daysOpen, disputedAfterWindow, disputedAmount, history, isAccepted, isMoveTo, median,
  recentSame, status, summaries, undisputedBalance, unsentReceipts, unusualAmount,
} from '../balance';
import type { Entry } from '../types';

const NOW = new Date('2026-11-12T12:00:00Z').getTime();
const DAY = 86_400_000;
const at = (daysAgo: number, minutes = 0) => new Date(NOW - daysAgo * DAY + minutes * 60_000).toISOString();
let n = 1000;
const mk = (studentId: string, type: Entry['type'], amount: number, daysAgo: number, more: Partial<Entry> = {}): Entry => ({
  id: 'e' + ++n, receiptNo: 'SD-' + n, studentId, type, amount, by: 'Sampath', createdAt: at(daysAgo),
  receipt: { status: 'not_sent' }, ...more,
});

describe('balance', () => {
  it('adds dues and transfers in, subtracts payments and transfers out', () => {
    const e = [mk('a', 'due', 500, 3), mk('a', 'payment', 200, 2), mk('a', 'transfer_in', 50, 1), mk('a', 'transfer_out', 30, 0), mk('b', 'due', 999, 1)];
    expect(balance(e, 'a')).toBe(320);
    expect(balance(e, 'b')).toBe(999);
  });

  it('applies a correction delta', () => {
    const due = mk('a', 'due', 120, 2);
    const e = [due, mk('a', 'correction', 60, 1, { delta: -60, refId: due.id })];
    expect(balance(e, 'a')).toBe(60);
  });

  it('cancels a reversed entry exactly, corrections included', () => {
    const due = mk('a', 'due', 120, 3);
    const e = [mk('a', 'due', 100, 4), due, mk('a', 'correction', 150, 2, { delta: 30, refId: due.id }), mk('a', 'reversal', 150, 1, { refId: due.id })];
    expect(balance(e, 'a')).toBe(100);
  });

  it('moves a due from one student to another', () => {
    const due = mk('a', 'due', 120, 2);
    const e = [due, mk('a', 'transfer_out', 120, 1, { refId: due.id, otherStudentId: 'b' }), mk('b', 'transfer_in', 120, 1, { refId: due.id, otherStudentId: 'a' })];
    expect(balance(e, 'a')).toBe(0);
    expect(balance(e, 'b')).toBe(120);
    expect(isMoveTo(e, e[1])).toBe(true);
    expect(isMoveTo(e, e[2])).toBe(false);
  });

  it('moves a payment the other way', () => {
    const pay = mk('a', 'payment', 100, 2);
    const e = [mk('a', 'due', 300, 3), pay, mk('a', 'transfer_in', 100, 1, { refId: pay.id, otherStudentId: 'b' }), mk('b', 'due', 100, 4), mk('b', 'transfer_out', 100, 1, { refId: pay.id, otherStudentId: 'a' })];
    expect(balance(e, 'a')).toBe(300);
    expect(balance(e, 'b')).toBe(0);
    expect(isMoveTo(e, e[2])).toBe(true);
  });
});

describe('disputes', () => {
  const open = (d: Partial<Entry> = {}) => ({ dispute: { status: 'open' as const, reason: 'didnt_buy' as const, openedAt: at(0) }, ...d });

  it('separates the disputed amount from the undisputed balance', () => {
    const e = [mk('a', 'due', 380, 5), mk('a', 'due', 120, 1, open())];
    expect(balance(e, 'a')).toBe(500);
    expect(disputedAmount(e, 'a')).toBe(120);
    expect(undisputedBalance(e, 'a')).toBe(380);
  });

  it('counts a disputed entry at its corrected value, and not at all once removed', () => {
    const due = mk('a', 'due', 120, 2, open());
    const corr = [due, mk('a', 'correction', 80, 1, { delta: -40, refId: due.id })];
    expect(disputedAmount(corr, 'a')).toBe(80);
    expect(disputedAmount([due, mk('a', 'reversal', 120, 1, { refId: due.id })], 'a')).toBe(0);
  });

  it('works out pending / overdue / disputed on the undisputed balance', () => {
    expect(status([mk('a', 'due', 100, 20)], 'a', NOW)).toBe('overdue');
    expect(status([mk('a', 'due', 100, 20, open())], 'a', NOW)).toBe('disputed');
    expect(status([mk('a', 'due', 100, 20, open()), mk('a', 'due', 50, 3)], 'a', NOW)).toBe('pending');
    expect(status([mk('a', 'due', 100, 3), mk('a', 'payment', 100, 1)], 'a', NOW)).toBe('settled');
  });

  it('runs the overdue clock from the oldest unpaid, undisputed charge', () => {
    // Payments clear the oldest charge first: 500 (30 d) is paid, so 360 (10 d) is the oldest unpaid.
    expect(daysOpen([mk('a', 'due', 500, 30), mk('a', 'due', 360, 10), mk('a', 'payment', 500, 5)], 'a', NOW)).toBe(10);
    // Part-paid: 150 of the 450 is still open, so the clock is the 450's.
    expect(daysOpen([mk('a', 'due', 450, 6), mk('a', 'due', 230, 4), mk('a', 'payment', 300, 2)], 'a', NOW)).toBe(6);
    // A disputed charge doesn't start the clock.
    expect(daysOpen([mk('a', 'due', 100, 40, open()), mk('a', 'due', 50, 3)], 'a', NOW)).toBe(3);
  });

  it('tags Accepted only after 24 h with the receipt sent and no dispute', () => {
    const sent = (h: number) => ({ status: 'sent' as const, confirmedAt: new Date(NOW - h * 3_600_000).toISOString() });
    expect(isAccepted(mk('a', 'due', 10, 2, { receipt: sent(25) }), NOW)).toBe(true);
    expect(isAccepted(mk('a', 'due', 10, 2, { receipt: sent(23) }), NOW)).toBe(false);
    expect(isAccepted(mk('a', 'due', 10, 2, { receipt: { status: 'opened' } }), NOW)).toBe(false);
    expect(isAccepted(mk('a', 'due', 10, 2, { receipt: sent(30), ...open() }), NOW)).toBe(false);
    expect(disputedAfterWindow(mk('a', 'due', 10, 2, { receipt: sent(30), ...open() }))).toBe(true);
    expect(disputedAfterWindow(mk('a', 'due', 10, 2, { receipt: sent(2), ...open() }))).toBe(false);
  });
});

describe('history', () => {
  it('lists newest first with the balance left, and how changed entries were changed', () => {
    const a = mk('s', 'due', 120, 5), b = mk('s', 'due', 80, 4), c = mk('s', 'due', 50, 3);
    const e = [a, b, c,
      mk('s', 'correction', 60, 2, { delta: -60, refId: a.id }),
      mk('s', 'reversal', 80, 1, { refId: b.id }),
      mk('s', 'transfer_out', 50, 0, { refId: c.id, otherStudentId: 'x' })];
    const rows = history(e, 's');
    // 120, +80 = 200, +50 = 250, correction −60 = 190, reversal of 80 = 110, move out 50 = 60.
    expect(rows.map((r) => r.after)).toEqual([60, 110, 190, 250, 200, 120]);
    const byId = Object.fromEntries(rows.map((r) => [r.entry.id, r.struck]));
    expect(byId[a.id]).toEqual({ kind: 'corrected', newAmount: 60 });
    expect(byId[b.id]).toEqual({ kind: 'removed' });
    expect(byId[c.id]).toEqual({ kind: 'moved', otherStudentId: 'x' });
  });

  it('gives the balance just before and after an entry', () => {
    const e = [mk('s', 'due', 380, 3), mk('s', 'due', 120, 1)];
    expect(balanceAround(e, e[1])).toEqual({ before: 380, after: 500 });
  });
});

describe('receipts', () => {
  it('counts unsent, opened and no-phone receipts, but not legacy entries', () => {
    const e = [
      mk('s', 'due', 1, 1, { receipt: { status: 'not_sent' } }), mk('s', 'due', 2, 1, { receipt: { status: 'opened' } }),
      mk('s', 'due', 3, 1, { receipt: { status: 'no_phone' } }), mk('s', 'due', 4, 1, { receipt: { status: 'sent' } }),
      mk('s', 'due', 5, 1, { legacy: true }),
    ];
    expect(unsentReceipts(e).map((u) => u.entry.amount).sort()).toEqual([1, 2, 3]);
    expect(summaries(e, ['s'])['s'].unsent).toBe(3);
  });
});

describe('amount checks', () => {
  const history3 = [mk('s', 'due', 100, 9), mk('s', 'due', 120, 8), mk('s', 'due', 140, 7)];

  it('never asks under ₹50', () => {
    expect(unusualAmount([], 's', 'due', 40).unusual).toBe(false);
    expect(unusualAmount(history3, 's', 'due', 49).unusual).toBe(false);
  });

  it('asks over ₹1,000', () => {
    expect(unusualAmount([], 's', 'due', 1001).unusual).toBe(true);
    expect(unusualAmount([], 's', 'payment', 1200).unusual).toBe(true);
    expect(unusualAmount([], 's', 'due', 1000).unusual).toBe(false);
  });

  it('asks at more than 3× the median of 3+ earlier dues', () => {
    expect(median([100, 140, 120])).toBe(120);
    expect(unusualAmount(history3, 's', 'due', 361)).toEqual({ unusual: true, ratio: 361 / 120 });
    expect(unusualAmount(history3, 's', 'due', 360).unusual).toBe(false);
    expect(unusualAmount(history3.slice(0, 2), 's', 'due', 500).unusual).toBe(false);
    expect(unusualAmount(history3, 's', 'due', 1200).ratio).toBe(10);
  });

  it('finds the same entry within 2 minutes', () => {
    const now = Date.now();
    const recent = { ...mk('s', 'due', 120, 0), createdAt: new Date(now - 60_000).toISOString() };
    const old = { ...mk('s', 'due', 80, 0), createdAt: new Date(now - 180_000).toISOString() };
    expect(recentSame([recent, old], 's', 'due', 120, now)?.id).toBe(recent.id);
    expect(recentSame([recent, old], 's', 'payment', 120, now)).toBeUndefined();
    expect(recentSame([recent, old], 's', 'due', 80, now)).toBeUndefined();
  });
});

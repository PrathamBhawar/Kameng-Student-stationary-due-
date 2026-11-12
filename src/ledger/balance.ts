// Pure ledger maths. Balances are always worked out from entries and never stored.
import type { Entry, ReceiptState } from './types';

const DAY = 86_400_000;
export const OVERDUE_DAYS = 14;
export const ACCEPT_AFTER_MS = DAY; // 24 h with no "NO" reply
export const STALE_DISPUTE_DAYS = 7;

export type Status = 'overdue' | 'pending' | 'settled' | 'disputed';

const time = (iso: string) => new Date(iso).getTime();

/** Whole calendar days between a date and now ("16 Sep" → "20 Oct" is 34), whatever the time of day. */
export function calendarDays(iso: string, now = Date.now()): number {
  const a = new Date(iso), b = new Date(now);
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.max(0, Math.round((db - da) / DAY));
}

/** Entries in the order they happened (receipt number breaks ties). */
export function chronological(entries: Entry[]): Entry[] {
  return entries.slice().sort((a, b) => (time(a.createdAt) - time(b.createdAt)) || (seq(a) - seq(b)));
}
const seq = (e: Entry) => parseInt(e.receiptNo.replace(/\D/g, ''), 10) || 0;

export const forStudent = (all: Entry[], studentId: string) => all.filter((e) => e.studentId === studentId);

/** The change an entry makes on its own, before anything points at it. */
export function baseEffect(e: Entry): number {
  switch (e.type) {
    case 'due': case 'transfer_in': return e.amount;
    case 'payment': case 'transfer_out': return -e.amount;
    case 'correction': return e.delta ?? 0;
    default: return 0;
  }
}

const correctionsTo = (all: Entry[], id: string) => all.filter((x) => x.type === 'correction' && x.refId === id);
export const reversalOf = (all: Entry[], id: string) => all.find((x) => x.type === 'reversal' && x.refId === id);
/** A "Wrong student" move of this entry: the counter-entry on the same student. */
export const moveOf = (all: Entry[], e: Entry) =>
  all.find((x) => (x.type === 'transfer_out' || x.type === 'transfer_in') && x.refId === e.id && x.studentId === e.studentId);

/** What the entry is worth now, with corrections applied (before any reversal or move). */
export const correctedEffect = (all: Entry[], e: Entry) =>
  baseEffect(e) + correctionsTo(all, e.id).reduce((s, c) => s + (c.delta ?? 0), 0);

/** The change an entry makes to the balance. A reversal cancels its entry exactly, corrections included. */
export function effect(all: Entry[], e: Entry): number {
  if (e.type !== 'reversal') return baseEffect(e);
  const ref = all.find((x) => x.id === e.refId);
  return ref ? -correctedEffect(all, ref) : 0;
}

/** A transfer reads "Moved to <other>" when the value left this student, "Moved from <other>" when it arrived. */
export function isMoveTo(all: Entry[], e: Entry): boolean {
  const ref = all.find((x) => x.id === e.refId);
  return (ref?.type === 'payment') === (e.type === 'transfer_in');
}

/** True when an entry no longer counts: reversed, or moved to another student. */
export const isCancelled = (all: Entry[], e: Entry) => !!reversalOf(all, e.id) || !!moveOf(all, e);

/** What an entry still contributes, used for disputes: corrections in, reversals and moves out. */
export const liveEffect = (all: Entry[], e: Entry) => (isCancelled(all, e) ? 0 : correctedEffect(all, e));

export const isOpenDispute = (e: Entry) => e.dispute?.status === 'open';

export function balance(all: Entry[], studentId: string): number {
  const mine = forStudent(all, studentId);
  return mine.reduce((s, e) => s + effect(mine, e), 0);
}

/** The sum of open-dispute entries' effect on the balance. */
export function disputedAmount(all: Entry[], studentId: string): number {
  const mine = forStudent(all, studentId);
  return mine.filter(isOpenDispute).reduce((s, e) => s + liveEffect(mine, e), 0);
}

export const undisputedBalance = (all: Entry[], studentId: string) => balance(all, studentId) - disputedAmount(all, studentId);

/**
 * Days the oldest unpaid, undisputed charge has been open. Payments clear the oldest charges first,
 * so walk charges from newest to oldest until they add up to what is still owed.
 */
export function daysOpen(all: Entry[], studentId: string, now = Date.now()): number {
  const mine = forStudent(all, studentId);
  let owed = undisputedBalance(all, studentId);
  if (owed <= 0) return 0;
  const charges = chronological(mine)
    .filter((e) => (e.type === 'due' || e.type === 'transfer_in') && !isOpenDispute(e))
    .map((e) => ({ e, amt: liveEffect(mine, e) }))
    .filter((c) => c.amt > 0)
    .reverse();
  let oldest = charges[0]?.e;
  for (const c of charges) { oldest = c.e; owed -= c.amt; if (owed <= 0) break; }
  return oldest ? calendarDays(oldest.createdAt, now) : 0;
}

/** Pending / overdue on the undisputed balance; "disputed" when only disputed money is left. */
export function status(all: Entry[], studentId: string, now = Date.now()): Status {
  const u = undisputedBalance(all, studentId);
  if (u <= 0) return disputedAmount(all, studentId) > 0 ? 'disputed' : 'settled';
  return daysOpen(all, studentId, now) > OVERDUE_DAYS ? 'overdue' : 'pending';
}

// ── Receipts

const unsentStatus = (r?: ReceiptState) => !!r && r.status !== 'sent';
/** Receipts the student hasn't been confirmed to have: not sent, opened but unconfirmed, or no phone. */
export function unsentReceipts(all: Entry[]): { entry: Entry; kind: 'entry' | 'kept' }[] {
  const out: { entry: Entry; kind: 'entry' | 'kept' }[] = [];
  for (const e of all) {
    if (!e.legacy && unsentStatus(e.receipt)) out.push({ entry: e, kind: 'entry' });
    if (e.dispute?.keptReceipt && unsentStatus(e.dispute.keptReceipt)) out.push({ entry: e, kind: 'kept' });
  }
  return out.sort((a, b) => time(b.entry.createdAt) - time(a.entry.createdAt));
}

/** Sent, confirmed more than 24 h ago and never disputed: the student had their chance to say NO. */
export const isAccepted = (e: Entry, now = Date.now()) =>
  (e.type === 'due' || e.type === 'payment') && !e.dispute && e.receipt.status === 'sent'
  && !!e.receipt.confirmedAt && now - time(e.receipt.confirmedAt) > ACCEPT_AFTER_MS;

/** A dispute raised after the 24-hour window had already passed. */
export const disputedAfterWindow = (e: Entry) =>
  !!e.dispute && e.receipt.status === 'sent' && !!e.receipt.confirmedAt
  && time(e.dispute.openedAt) - time(e.receipt.confirmedAt) > ACCEPT_AFTER_MS;

export const canDispute = (all: Entry[], e: Entry) =>
  (e.type === 'due' || e.type === 'payment') && e.dispute?.status !== 'open' && !isCancelled(all, e);

export const openDisputes = (all: Entry[]) =>
  all.filter(isOpenDispute).sort((a, b) => time(b.dispute!.openedAt) - time(a.dispute!.openedAt));

export const disputeDaysOpen = (e: Entry, now = Date.now()) =>
  e.dispute ? calendarDays(e.dispute.openedAt, now) : 0;

/** Disputes opened on a student's entries in the last 30 days. */
export const recentDisputes = (all: Entry[], studentId: string, now = Date.now()) =>
  forStudent(all, studentId).filter((e) => e.dispute && now - time(e.dispute.openedAt) <= 30 * DAY).length;

/** Disputes per person who made the entry (`by`), kept ready for helper PINs. Not shown yet. */
export function disputesByMaker(all: Entry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of all) if (e.dispute) out[e.by] = (out[e.by] || 0) + 1;
  return out;
}

// ── History

export type Struck =
  | { kind: 'corrected'; newAmount: number }
  | { kind: 'removed' }
  | { kind: 'moved'; otherStudentId: string };

export interface HistoryRow { entry: Entry; after: number; struck?: Struck }

/** Newest first, with the balance left after each entry and how a changed entry was changed. */
export function history(all: Entry[], studentId: string): HistoryRow[] {
  const mine = chronological(forStudent(all, studentId));
  let run = 0;
  const rows: HistoryRow[] = mine.map((e) => {
    run += effect(mine, e);
    let struck: Struck | undefined;
    const move = moveOf(mine, e);
    const moveOut = move ? all.find((x) => x.refId === e.id && x.studentId !== e.studentId) : undefined;
    if (reversalOf(mine, e.id)) struck = { kind: 'removed' };
    else if (move) struck = { kind: 'moved', otherStudentId: move.otherStudentId || moveOut?.studentId || '' };
    else if (correctionsTo(mine, e.id).length) struck = { kind: 'corrected', newAmount: Math.abs(correctedEffect(mine, e)) };
    return { entry: e, after: run, struck };
  });
  return rows.reverse();
}

/** Balance just before and just after an entry, for its receipt. */
export function balanceAround(all: Entry[], e: Entry): { before: number; after: number } {
  const mine = chronological(forStudent(all, e.studentId));
  let run = 0;
  for (const x of mine) {
    const before = run;
    run += effect(mine, x);
    if (x.id === e.id) return { before, after: run };
  }
  return { before: run, after: run };
}

// ── Amount checks on Add due / Receive Payment

export function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = nums.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Should Save ask "Correct?" first? Never under ₹50. Otherwise yes over ₹1,000, or (dues only) when the
 * student has 3+ earlier dues and this is more than 3× their median due. `ratio` is against that median.
 */
export function unusualAmount(all: Entry[], studentId: string, type: 'due' | 'payment', amount: number): { unusual: boolean; ratio: number } {
  if (amount < 50) return { unusual: false, ratio: 0 };
  const dues = forStudent(all, studentId).filter((e) => e.type === 'due').map((e) => e.amount);
  const med = dues.length >= 3 ? median(dues) : 0;
  const ratio = med ? amount / med : 0;
  return { unusual: amount > 1000 || (type === 'due' && med > 0 && amount > 3 * med), ratio };
}

/** Whole minutes since an entry was made, for "Same as 1 min ago". */
export const minutesSince = (iso: string, now = Date.now()) => Math.floor((now - time(iso)) / 60_000);

/** The same kind and amount for this student in the last 2 minutes, if any. */
export function recentSame(all: Entry[], studentId: string, type: 'due' | 'payment', amount: number, now = Date.now(), windowMs = 120_000): Entry | undefined {
  return forStudent(all, studentId)
    .filter((e) => e.type === type && e.amount === amount && now - time(e.createdAt) <= windowMs && !isCancelled(all, e))
    .sort((a, b) => time(b.createdAt) - time(a.createdAt))[0];
}

// ── One pass per student for lists

export interface Summary {
  balance: number; disputed: number; undisputed: number; status: Status; days: number;
  unsent: number; openDisputes: number; recentDisputes: number;
}

export function summaries(all: Entry[], studentIds: string[], now = Date.now()): Record<string, Summary> {
  const by: Record<string, Entry[]> = {};
  for (const e of all) (by[e.studentId] ||= []).push(e);
  const unsentBy: Record<string, number> = {};
  for (const u of unsentReceipts(all)) unsentBy[u.entry.studentId] = (unsentBy[u.entry.studentId] || 0) + 1;
  const out: Record<string, Summary> = {};
  for (const id of studentIds) {
    const mine = by[id] || [];
    const b = balance(mine, id), d = disputedAmount(mine, id);
    out[id] = {
      balance: b, disputed: d, undisputed: b - d, status: status(mine, id, now), days: daysOpen(mine, id, now),
      unsent: unsentBy[id] || 0, openDisputes: mine.filter(isOpenDispute).length, recentDisputes: recentDisputes(mine, id, now),
    };
  }
  return out;
}

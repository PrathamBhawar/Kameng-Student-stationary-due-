// Schema 1 kept each student's entries inside the student ({ type: 'due' | 'pay', amt, date: '16 Sep' }).
// Schema 2 is one add-only ledger of Entry objects. The migration is pure and deterministic, so running it
// twice gives the same entries (ids are derived from the student and position, not random).
import type { Student } from '../data';
import type { Entry } from './types';

export const SCHEMA_VERSION = 2;
export const FIRST_RECEIPT = 1001;

export type LegacyTx =
  | { type: 'due'; amt: number; date: string; note: string; by: string }
  | { type: 'pay'; amt: number; date: string; method: 'UPI' | 'Cash'; by: string };
export type LegacyStudent = Student & { tx?: LegacyTx[]; since?: number };

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "16 Sep" → the most recent 16 September at or before `now`; "Today" → now. Midday keeps the day stable across time zones. */
export function parseLegacyDate(date: string, now: Date): Date {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(date.trim());
  if (!m) return new Date(now);
  const day = +m[1], mon = MONTHS.indexOf(m[2].toLowerCase());
  if (mon < 0) return new Date(now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const year = new Date(now.getFullYear(), mon, day).getTime() > today ? now.getFullYear() - 1 : now.getFullYear();
  const d = new Date(year, mon, day, 12, 0, 0);
  return d.getTime() > now.getTime() ? new Date(now) : d; // today before noon: never in the future
}

export const receiptNo = (n: number) => 'SD-' + n;

/** Turn schema-1 students into schema-2 students and ledger entries. Balances are unchanged. */
export function migrateLegacy(students: LegacyStudent[], now = new Date()): { students: Student[]; entries: Entry[]; nextReceipt: number } {
  const drafts: Omit<Entry, 'receiptNo'>[] = [];
  for (const s of students) {
    (s.tx || []).forEach((t, i) => {
      // Keep the original order within a day: a minute apart, ending at the parsed time (never in the future).
      const at = new Date(parseLegacyDate(t.date, now).getTime() - ((s.tx || []).length - 1 - i) * 60_000);
      drafts.push({
        id: 'm-' + s.id + '-' + i, studentId: s.id, type: t.type === 'due' ? 'due' : 'payment', amount: t.amt,
        note: t.type === 'due' ? t.note : undefined, method: t.type === 'pay' ? t.method : undefined,
        by: t.by, createdAt: at.toISOString(), legacy: true, receipt: { status: 'not_sent' },
      });
    });
  }
  drafts.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const entries = drafts.map((d, i) => ({ ...d, receiptNo: receiptNo(FIRST_RECEIPT + i) }) as Entry);
  const clean = students.map(({ tx: _tx, since: _since, ...rest }) => rest as Student);
  return { students: clean, entries, nextReceipt: FIRST_RECEIPT + entries.length };
}

/** Old balance of a schema-1 student, for checking the migration. */
export const legacyBalance = (s: LegacyStudent) => (s.tx || []).reduce((a, t) => a + (t.type === 'due' ? t.amt : -t.amt), 0);

/** Sample shop for a fresh install, dated relative to today so the demo statuses stay the same. */
export function seedLedger(now = new Date()): { students: Student[]; entries: Entry[]; nextReceipt: number } {
  const ago = (days: number, h = 12) => { const d = new Date(now); d.setDate(d.getDate() - days); d.setHours(h, 0, 0, 0); return d; };
  const fmt = (d: Date) => d.getDate() + ' ' + MONTHS[d.getMonth()].replace(/^./, (c) => c.toUpperCase());
  type T = [kind: 'd' | 'p', amt: number, days: number, extra: string, by?: string];
  const S = (id: string, name: string, room: string, phone: string, tx: T[]): LegacyStudent => ({
    id, name, hostel: 'Kameng', room, phone,
    tx: tx.map(([k, amt, days, extra, by]) => (k === 'd'
      ? { type: 'due', amt, date: fmt(ago(days)), note: extra, by: by || 'Sampath' }
      : { type: 'pay', amt, date: fmt(ago(days)), method: extra as 'UPI' | 'Cash', by: 'Sampath' })),
  });
  const legacy = [
    S('210102031', 'Rohit Kalita', 'B-118', '9000010001', [['d', 500, 34, 'Bedsheet, bucket'], ['d', 360, 28, 'Notebooks, pens']]),
    S('220106044', 'Sneha Reddy', 'C-207', '9000010002', [['d', 540, 21, 'Yoga mat, soap']]),
    S('210107012', 'Arjun Mehta', 'D-305', '9000010003', [['d', 380, 19, 'Printing, files']]),
    S('220102039', 'Imran Hussain', 'B-301', '9000010004', [['d', 310, 18, 'Deodorant, snacks']]),
    S('220104078', 'Nilutpal Gogoi', 'A-012', '9000010005', [['d', 420, 12, 'Umbrella, chocolates']]),
    S('230103021', 'Vikram Rathore', 'D-208', '9000010006', [['d', 150, 9, 'Xerox']]),
    S('230105066', 'Debanjan Das', 'B-022', '', [['d', 260, 6, 'Shoe polish, soap']]),
    S('240101091', 'Karthik Iyer', 'A-221', '9000010008', [['d', 45, 1, 'Gel pens']]),
    S('230101015', 'Ankur Bora', 'B-214', '9000010009', [['d', 450, 6, 'Bucket, soap, Xerox'], ['d', 230, 4, 'Bedsheet', 'Ravi'], ['p', 300, 2, 'UPI']]),
    S('220103027', 'Priya Sharma', 'C-110', '9000010010', [['d', 220, 8, 'Cosmetics'], ['p', 220, 0, 'UPI']]),
    S('230108054', 'Meghna Baruah', 'D-112', '9000010011', [['d', 140, 15, 'Notebooks'], ['p', 140, 10, 'Cash']]),
    S('240106008', 'Tanvi Joshi', 'C-019', '9000010012', [['d', 90, 17, 'Pens'], ['p', 90, 16, 'Cash']]),
  ];
  // Sample entries are dated "D Mon"; anchor them at the sample's own `now`.
  return migrateLegacy(legacy, now);
}

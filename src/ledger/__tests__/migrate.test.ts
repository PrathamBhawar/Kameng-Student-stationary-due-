import { balance, daysOpen, status } from '../balance';
import { LegacyStudent, legacyBalance, migrateLegacy, parseLegacyDate, seedLedger } from '../migrate';

const NOW = new Date(2026, 10, 12, 15, 30); // 12 Nov 2026, 15:30 local

const legacy: LegacyStudent[] = [
  { id: '1', name: 'Rohit Kalita', hostel: 'Kameng', room: 'B-118', phone: '9000010001', since: 34, tx: [
    { type: 'due', amt: 500, date: '16 Sep', note: 'Bedsheet, bucket', by: 'Sampath' },
    { type: 'due', amt: 360, date: '22 Sep', note: 'Notebooks, pens', by: 'Sampath' }] },
  { id: '2', name: 'Ankur Bora', hostel: 'Kameng', room: 'B-214', phone: '9000010009', since: 6, tx: [
    { type: 'due', amt: 450, date: '2 Oct', note: 'Bucket', by: 'Sampath' },
    { type: 'due', amt: 230, date: '9 Oct', note: 'Bedsheet', by: 'Ravi' },
    { type: 'pay', amt: 300, date: '14 Oct', method: 'UPI', by: 'Sampath' },
    { type: 'due', amt: 120, date: 'Today', note: '2 notebooks', by: 'Sampath' }] },
  { id: '3', name: 'Debanjan Das', hostel: 'Kameng', room: 'B-022', phone: '', since: 0, tx: [] },
];

describe('migrateLegacy', () => {
  it('keeps every student and every balance', () => {
    const m = migrateLegacy(legacy, NOW);
    expect(m.students.map((s) => s.id)).toEqual(['1', '2', '3']);
    for (const s of legacy) expect(balance(m.entries, s.id)).toBe(legacyBalance(s));
    expect(m.entries).toHaveLength(6);
    expect(m.students.every((s) => !('tx' in s) && !('since' in s))).toBe(true);
  });

  it('is deterministic, so running it twice gives the same ledger', () => {
    expect(migrateLegacy(legacy, NOW)).toEqual(migrateLegacy(legacy, NOW));
  });

  it('numbers receipts in date order and marks old entries as legacy', () => {
    const m = migrateLegacy(legacy, NOW);
    expect(m.entries.map((e) => e.receiptNo)).toEqual(['SD-1001', 'SD-1002', 'SD-1003', 'SD-1004', 'SD-1005', 'SD-1006']);
    expect(m.entries.map((e) => e.amount)).toEqual([500, 360, 450, 230, 300, 120]);
    expect(m.nextReceipt).toBe(1007);
    expect(m.entries.every((e) => e.legacy && e.receipt.status === 'not_sent')).toBe(true);
    expect(m.entries.find((e) => e.method)?.type).toBe('payment');
  });

  it('dates "16 Sep" in the most recent past and never in the future', () => {
    expect(parseLegacyDate('16 Sep', NOW).getFullYear()).toBe(2026);
    expect(parseLegacyDate('20 Dec', NOW).getFullYear()).toBe(2025);
    expect(parseLegacyDate('Today', NOW).getTime()).toBe(NOW.getTime());
    const morning = new Date(2026, 10, 12, 8, 0);
    expect(parseLegacyDate('12 Nov', morning).getTime()).toBeLessThanOrEqual(morning.getTime());
  });
});

describe('seedLedger', () => {
  it('reproduces the demo statuses', () => {
    const now = new Date();
    const s = seedLedger(now);
    const t = now.getTime();
    expect(balance(s.entries, '230101015')).toBe(380);
    expect(status(s.entries, '230101015', t)).toBe('pending');
    expect(status(s.entries, '210102031', t)).toBe('overdue');
    expect(daysOpen(s.entries, '210102031', t)).toBe(34);
    expect(status(s.entries, '220103027', t)).toBe('settled');
    expect(s.students).toHaveLength(12);
  });
});

export type Tx =
  | { type: 'due'; amt: number; date: string; note: string; by: string; fresh?: boolean }
  | { type: 'pay'; amt: number; date: string; method: 'UPI' | 'Cash'; by: string; fresh?: boolean };

export type Student = {
  id: string; name: string; hostel: string; room: string; phone: string;
  since: number; // days the oldest unpaid due has been open
  tx: Tx[];
};

export type Status = 'overdue' | 'pending' | 'settled';

/** Hostels at IIT Guwahati. Shops can add any that are missing from the Choose hostel screen. */
export const HOSTELS = ['Barak', 'Brahmaputra', 'Dhansiri', 'Dibang', 'Dihing', 'Disang', 'Kameng', 'Kapili', 'Lohit', 'Manas', 'Siang', 'Subansiri', 'Umiam'];
export const NEW_ID = '240104112';
export const DEMO_ID = '230101015';

export function seed(): Student[] {
  const S = (id: string, name: string, room: string, phone: string, since: number, tx: Tx[]): Student =>
    ({ id, name, hostel: 'Kameng', room, phone, since, tx });
  const d = (amt: number, date: string, note: string, by = 'Sampath'): Tx => ({ type: 'due', amt, date, note, by });
  const p = (amt: number, date: string, method: 'UPI' | 'Cash'): Tx => ({ type: 'pay', amt, date, method, by: 'Sampath' });
  return [
    S('210102031', 'Rohit Kalita', 'B-118', '9000010001', 34, [d(500, '16 Sep', 'Bedsheet, bucket'), d(360, '22 Sep', 'Notebooks, pens')]),
    S('220106044', 'Sneha Reddy', 'C-207', '9000010002', 21, [d(540, '29 Sep', 'Yoga mat, soap')]),
    S('210107012', 'Arjun Mehta', 'D-305', '9000010003', 19, [d(380, '1 Oct', 'Printing, files')]),
    S('220102039', 'Imran Hussain', 'B-301', '9000010004', 18, [d(310, '2 Oct', 'Deodorant, snacks')]),
    S('220104078', 'Nilutpal Gogoi', 'A-012', '9000010005', 12, [d(420, '8 Oct', 'Umbrella, chocolates')]),
    S('230103021', 'Vikram Rathore', 'D-208', '9000010006', 9, [d(150, '11 Oct', 'Xerox')]),
    S('230105066', 'Debanjan Das', 'B-022', '', 6, [d(260, '14 Oct', 'Shoe polish, soap')]),
    S('240101091', 'Karthik Iyer', 'A-221', '9000010008', 1, [d(45, '19 Oct', 'Gel pens')]),
    S(DEMO_ID, 'Ankur Bora', 'B-214', '9000010009', 6, [d(450, '2 Oct', 'Bucket, soap, Xerox'), d(230, '9 Oct', 'Bedsheet', 'Ravi'), p(300, '14 Oct', 'UPI')]),
    S('220103027', 'Priya Sharma', 'C-110', '9000010010', 0, [d(220, '12 Oct', 'Cosmetics'), p(220, '20 Oct', 'UPI')]),
    S('230108054', 'Meghna Baruah', 'D-112', '9000010011', 0, [d(140, '5 Oct', 'Notebooks'), p(140, '10 Oct', 'Cash')]),
    S('240106008', 'Tanvi Joshi', 'C-019', '9000010012', 0, [d(90, '3 Oct', 'Pens'), p(90, '4 Oct', 'Cash')]),
  ];
}

export const bal = (s: Student) => s.tx.reduce((a, t) => a + (t.type === 'due' ? t.amt : -t.amt), 0);
export const status = (s: Student): Status => {
  const b = bal(s);
  return b <= 0 ? 'settled' : s.since > 14 ? 'overdue' : 'pending';
};

const groupIN = (n: number) => {
  // Indian digit grouping (12,34,567) without relying on Intl being present.
  const s = String(Math.abs(Math.round(n)));
  if (s.length <= 3) return s;
  const last = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return rest + ',' + last;
};
export const fmt = (v: number) => (v < 0 ? '-' : '') + groupIN(v);
export const rs = (v: number) => '₹' + fmt(v);
export const initials = (n: string) => n.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
export const prettyPhone = (p: string) => (p ? '+91 ' + p.slice(0, 5) + ' ' + p.slice(5) : 'Not on ID');

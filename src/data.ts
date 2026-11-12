export type Student = {
  id: string; name: string; hostel: string; room: string; phone: string;
  /** 'visitor': someone from off campus with no ID card. They have a city instead of a hostel and room. */
  kind?: 'student' | 'visitor';
  city?: string;
  /** Set when a disputed entry turned out to be someone else's ("Wrong student"). */
  cardMisuse?: boolean;
};

/** Hostels at IIT Guwahati. Shops can add any that are missing from the Choose hostel screen. */
export const HOSTELS = ['Barak', 'Brahmaputra', 'Dhansiri', 'Dibang', 'Dihing', 'Disang', 'Kameng', 'Kapili', 'Lohit', 'Manas', 'Siang', 'Subansiri', 'Umiam'];
export const NEW_ID = '240104112';
export const DEMO_ID = '230101015';

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
export const isVisitor = (s: Student) => s.kind === 'visitor';
/** Where someone is from, as shown under their name: "Kameng · B-214" or "Visitor · Shillong". */
export const placeOf = (s: Student) => (isVisitor(s) ? 'Visitor · ' + (s.city || '') : s.hostel + ' · ' + s.room);
/** A visitor has no campus ID, so make a unique one for the ledger. */
export const visitorId = () => 'V' + Date.now().toString(36).toUpperCase();
export const prettyPhone = (p: string) => (p ? '+91 ' + p.slice(0, 5) + ' ' + p.slice(5) : 'Not on ID');

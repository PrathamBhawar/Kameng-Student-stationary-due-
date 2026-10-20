export type Lang = 'en' | 'as';

export type Strings = {
  overview: string; students: string; profile: string; scan: string; greet: (first: string) => string;
  total: string; pending: string; overdue: string; settled: string; all: string; search: string;
  addDue: string; receive: string; remind: string; history: string; n: (k: number) => string; owe: string;
};

const EN: Strings = {
  overview: 'Overview', students: 'Students', profile: 'Profile', scan: 'Scan',
  greet: (f) => 'Good morning ' + f + ' 👋', total: 'Total outstanding', pending: 'Pending', overdue: 'Overdue',
  settled: 'Settled', all: 'All', search: 'Name, ID or room', addDue: 'Add due', receive: 'Receive Payment',
  remind: 'Remind', history: 'History', n: (k) => k + (k === 1 ? ' student' : ' students'), owe: ' owe',
};

const AS: Strings = {
  overview: 'সাৰাংশ', students: 'ছাত্ৰ-ছাত্ৰী', profile: 'প্ৰফাইল', scan: 'স্কেন',
  greet: (f) => 'নমস্কাৰ ' + f + ' 👋', total: 'মুঠ বাকী', pending: 'বাকী আছে', overdue: 'পলম হৈছে',
  settled: 'পৰিশোধিত', all: 'সকলো', search: 'নাম, ID বা ৰুম', addDue: 'বাকী লিখক', receive: 'ধন লওক',
  remind: 'সোঁৱৰাওক', history: 'হিচাপ', n: (k) => k + ' জন', owe: '',
};

export const strings = (l: Lang) => (l === 'as' ? AS : EN);

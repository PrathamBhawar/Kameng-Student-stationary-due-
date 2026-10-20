import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { bal, fmt, seed, Student, Tx, DEMO_ID, NEW_ID } from './data';
import { dark, light, Palette, scaleOf, SizeKey } from './theme';
import { Lang, strings, Strings } from './i18n';

export type Screen =
  | 'splash' | 'intro1' | 'intro2' | 'lang' | 'auth' | 'signin' | 'otp' | 'name'
  | 'hostel' | 'overview' | 'students' | 'profile' | 'scan' | 'verify' | 'newStudent'
  | 'student' | 'pay' | 'addDue' | 'edit';

export type ScanState = 'ready' | 'reading' | 'invalid' | 'denied' | 'unavailable';
export type ThemeKey = 'light' | 'dark' | 'system';
export type Filter = 'all' | 'pending' | 'overdue' | 'settled';
/** Who is signed in, and how. `email` holds the phone number for phone sign-in. */
export type Account = { provider: 'email' | 'google' | 'apple' | 'phone' | 'demo'; name: string; email: string };

export type State = {
  stack: Screen[]; dir: 1 | -1;
  students: Student[]; sel: string; scanState: ScanState; scannedId: string;
  theme: ThemeKey; size: SizeKey; lang: Lang;
  q: string; f: Filter;
  amt: string; method: 'upi' | 'cash'; note: string;
  phone: string; code: string;
  authMode: 'signup' | 'login'; authBusy: '' | 'apple' | 'google';
  ownerName: string; nameDraft: string; onboarded: boolean; account: Account | null;
  shopHostel: string; customHostels: string[]; nsIdEditable: boolean;
  sheet: boolean;
  editHostel: string; editRoom: string;
  ns: { name: string; room: string; phone: string; hostel: string }; nsTouched: boolean;
  toast: string; toastOn: boolean; toastSeq: number; toastWarn: boolean; torch: boolean; saving: boolean;
};

const initial = (): State => ({
  stack: ['splash'], dir: 1,
  students: seed(), sel: DEMO_ID, scanState: 'ready', scannedId: NEW_ID,
  theme: 'light', size: 'regular', lang: 'en',
  q: '', f: 'all',
  amt: '', method: 'upi', note: '',
  phone: '98640 21873', code: '',
  authMode: 'signup', authBusy: '', ownerName: 'Sampath', nameDraft: '', onboarded: false, account: null,
  shopHostel: 'Kameng', customHostels: [], nsIdEditable: false,
  sheet: false,
  editHostel: 'Kameng', editRoom: 'B-214',
  ns: { name: '', room: '', phone: '', hostel: 'Kameng' }, nsTouched: false,
  toast: '', toastOn: false, toastSeq: 0, toastWarn: false, torch: false, saving: false,
});

const KEY = 'studentDues.v1';
const TRANSIENT: Screen[] = ['scan', 'verify', 'newStudent', 'addDue', 'pay', 'edit'];

export const tapLight = () => { Haptics.selectionAsync().catch(() => {}); };
export const tapMedium = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
export const tapSuccess = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };
export const tapWarn = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); };

function useStoreValue() {
  const [state, setState] = useState<State>(initial);
  // The ref is the source of truth so chained actions (and timers) always see the latest state.
  const ref = useRef(state);
  const [ready, setReady] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = useCallback((patch: Partial<State> | ((s: State) => Partial<State>)) => {
    const s = ref.current;
    const next = { ...s, ...(typeof patch === 'function' ? patch(s) : patch) };
    ref.current = next;
    setState(next);
  }, []);
  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); }, []);

  // Load saved prefs + ledger once.
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          set({
            theme: saved.theme ?? 'light', size: saved.size ?? 'regular', lang: saved.lang ?? 'en',
            ownerName: saved.name ?? 'Sampath', onboarded: !!saved.onboarded, account: saved.account ?? null,
            shopHostel: saved.shopHostel ?? 'Kameng', customHostels: Array.isArray(saved.customHostels) ? saved.customHostels : [],
            students: Array.isArray(saved.students) && saved.students.length ? saved.students : seed(),
          });
        } catch {}
      }
    }).catch(() => {}).finally(() => setReady(true));
    const pending = timers.current;
    return () => { pending.forEach(clearTimeout); if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [set]);

  // Persist whenever saved fields change.
  useEffect(() => {
    if (!ready) return;
    const s = ref.current;
    const students = s.students.map((x) => ({ ...x, tx: x.tx.map((t) => ({ ...t, fresh: false })) }));
    AsyncStorage.setItem(KEY, JSON.stringify({ theme: s.theme, size: s.size, lang: s.lang, name: s.ownerName, onboarded: s.onboarded, account: s.account, shopHostel: s.shopHostel, customHostels: s.customHostels, students })).catch(() => {});
  }, [ready, state.theme, state.size, state.lang, state.ownerName, state.onboarded, state.account, state.shopHostel, state.customHostels, state.students]);

  const top = () => { const s = ref.current.stack; return s[s.length - 1]; };

  const actions = useMemo(() => {
    const go = (scr: Screen, extra?: Partial<State>) => set((s) => ({ stack: s.stack.concat([scr]), dir: 1, ...(extra || {}) }));
    const back = () => {
      const s = ref.current.stack;
      if (s.length > 1) set({ stack: s.slice(0, -1), dir: -1, saving: false, sheet: false, authBusy: '' });
    };
    const tab = (scr: Screen) => {
      if (top() !== scr) tapLight();
      set({ stack: [scr], dir: 1, sheet: false, scanState: 'ready' });
    };
    const toast = (msg: string, warn = false) => {
      set((s) => ({ toast: msg, toastOn: true, toastSeq: s.toastSeq + 1, toastWarn: warn }));
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => set({ toastOn: false }), 2400);
    };
    const find = (id: string) => ref.current.students.find((s) => s.id === id) || ref.current.students[0];
    const landOnStudent = (id: string, msg: string, extraTop?: Screen) => {
      let s = ref.current.stack.filter((x) => TRANSIENT.indexOf(x) < 0);
      if (s[s.length - 1] !== 'student') s = s.concat(['student']);
      if (extraTop) s = s.concat([extraTop]);
      set({ stack: s, dir: 1, sel: id, saving: false, amt: '', note: '' });
      if (msg) toast(msg);
    };
    /** Shows "Connecting…" on a sign-in button. Returns false if another sign-in is already running. */
    const authStart = (k: 'apple' | 'google') => {
      if (ref.current.authBusy) return false;
      tapMedium();
      set({ authBusy: k });
      return true;
    };
    /** Signed in: choose the shop's hostel, then the Overview. */
    const enterApp = (name: string, a: Account, msg: string) => {
      tapSuccess();
      set({ authBusy: '', account: a, ownerName: name, onboarded: true, stack: ['hostel'], dir: 1 });
      toast(msg);
    };
    /**
     * A sign-in finished. Log in goes straight to the Overview; sign up asks for a name only when
     * the account didn't come with one.
     */
    const authDone = (a: Account) => {
      const st = ref.current;
      const name = a.name.trim();
      if (st.authMode === 'login' || name) {
        const n = name || st.ownerName;
        enterApp(n, a, (st.authMode === 'login' ? 'Welcome back, ' : 'Welcome, ') + firstName(n));
        return;
      }
      tapSuccess();
      set((s) => ({ authBusy: '', account: a, stack: s.stack.concat(['name']), dir: 1, nameDraft: '' }));
      toast(a.email ? 'Signed in as ' + a.email : 'Signed in with ' + (a.provider === 'apple' ? 'Apple' : 'Google'));
    };
    /** Sign-in failed or was cancelled (message null). */
    const authFail = (message: string | null) => {
      set({ authBusy: '' });
      if (message) { tapWarn(); toast(message, true); }
    };
    /** Sign-in that can't run on this device: explain why, then continue as a demo account. */
    const demoSignIn = (k: 'apple' | 'google', reason: string) => {
      if (!authStart(k)) return;
      later(() => {
        const demo: Account = { provider: 'demo', name: '', email: '' };
        if (ref.current.authMode === 'login') { enterApp(ref.current.ownerName, demo, reason + ' · demo'); return; }
        set((s) => ({ authBusy: '', account: demo, stack: s.stack.concat(['name']), dir: 1, nameDraft: '' }));
        toast(reason + ' · demo', true);
      }, 900);
    };
    const addTx = (type: 'due' | 'pay') => {
      const st = ref.current;
      if (st.saving) return;
      const n = parseInt(st.amt || '0', 10);
      const s = find(st.sel);
      const b = bal(s);
      if (!n) return;
      if (type === 'pay' && n > b) return;
      if (type === 'due' && n > 10000) return;
      const tx: Tx = type === 'due'
        ? { type: 'due', amt: n, date: 'Today', note: st.note.trim() || 'Shop items', by: firstName(st.ownerName), fresh: true }
        : { type: 'pay', amt: n, date: 'Today', method: st.method === 'upi' ? 'UPI' : 'Cash', by: firstName(st.ownerName), fresh: true };
      const students = st.students.map((x) => x.id !== s.id ? x : {
        ...x,
        since: type === 'due' && b <= 0 ? 0 : x.since,
        tx: x.tx.map((t): Tx => ({ ...t, fresh: false })).concat([tx]),
      });
      tapSuccess();
      set({ saving: true, students });
      landOnStudent(s.id, type === 'due' ? 'Due of ₹' + fmt(n) + ' added' : (n === b ? '₹' + fmt(n) + ' received · Settled' : '₹' + fmt(n) + ' received'));
    };
    const press = (v: string) => {
      const key = top() === 'otp' ? 'code' : 'amt';
      const cur = ref.current[key] || '';
      tapLight();
      if (v === 'del') return set({ [key]: cur.slice(0, -1) } as Partial<State>);
      if (v === '00') { if (key === 'amt' && cur && cur.length < 4) set({ amt: cur + '00' }); return; }
      if (key === 'amt' && !cur && v === '0') return;
      const max = key === 'code' ? 6 : 5;
      if (cur.length < max) set({ [key]: cur + v } as Partial<State>);
    };
    const openRemind = () => { tapMedium(); set({ sheet: true }); };
    const closeRemind = () => set({ sheet: false });
    const resetDemo = () => set({ students: seed(), stack: ['splash'], dir: -1, q: '', f: 'all', onboarded: false });
    const signOut = () => set({ stack: ['auth'], dir: -1, authMode: 'login', code: '', onboarded: false, account: null });
    /** Shows "Reading…" briefly, then opens Student found for `id`. */
    const startScanRead = (id: string = DEMO_ID) => {
      tapMedium();
      set({ scanState: 'reading' });
      later(() => {
        set({ scanState: 'ready' });
        if (top() === 'scan') { tapSuccess(); go('verify', { sel: id }); }
      }, 900);
    };
    /** Handles a barcode read by the camera: known ID → Student found, unknown → Not found, junk → Can't read. */
    const handleScan = (data: string) => {
      if (ref.current.scanState !== 'ready' || top() !== 'scan') return;
      const id = (data || '').replace(/\D/g, '');
      if (id.length < 6 || id.length > 12) { tapWarn(); set({ scanState: 'invalid' }); return; }
      if (ref.current.students.some((s) => s.id === id)) { startScanRead(id); return; }
      tapWarn();
      set({ scanState: 'unavailable', scannedId: id });
    };
    return { set, go, back, tab, toast, find, landOnStudent, authStart, authDone, authFail, demoSignIn, enterApp, addTx, press, openRemind, closeRemind, resetDemo, signOut, startScanRead, handleScan, later };
  }, [set, later]);

  return { state, ready, ...actions };
}

export const firstName = (n: string) => ((n || 'Sampath').trim().split(/\s+/)[0]) || 'Sampath';

type StoreValue = ReturnType<typeof useStoreValue>;
const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const v = useStoreValue();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}

export type Look = {
  c: Palette; isDark: boolean; t: Strings; lang: Lang;
  fs: (n: number) => number;
};

export function useLook(): Look {
  const { state } = useStore();
  const scheme = useColorScheme();
  const isDark = state.theme === 'dark' || (state.theme === 'system' && scheme === 'dark');
  const scale = scaleOf(state.size);
  return useMemo(() => ({
    c: isDark ? dark : light, isDark, t: strings(state.lang), lang: state.lang,
    fs: (n: number) => Math.round(n * scale),
  }), [isDark, scale, state.lang]);
}

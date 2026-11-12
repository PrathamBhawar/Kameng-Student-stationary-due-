import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Linking, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { fmt, Student, DEMO_ID, NEW_ID } from './data';
import { dark, light, Palette, scaleOf, SizeKey } from './theme';
import { Lang, strings, Strings } from './i18n';
import type { DisputeReason, Entry, EntryType, ReceiptState, ReceiptTarget } from './ledger/types';
import { balance, baseEffect, correctedEffect, summaries, Summary } from './ledger/balance';
import { LegacyStudent, migrateLegacy, receiptNo, SCHEMA_VERSION, seedLedger } from './ledger/migrate';
import { receiptMessage, whatsAppUrl } from './ledger/receipt';

export type Screen =
  | 'splash' | 'intro1' | 'intro2' | 'lang' | 'auth' | 'signin' | 'otp' | 'name'
  | 'hostel' | 'overview' | 'students' | 'profile' | 'scan' | 'verify' | 'newStudent' | 'visitor'
  | 'student' | 'pay' | 'addDue' | 'edit' | 'resolve';

export type ScanState = 'ready' | 'reading' | 'invalid' | 'denied';
export type ThemeKey = 'light' | 'dark' | 'system';
export type Filter = 'all' | 'pending' | 'overdue' | 'settled' | 'unsent' | 'disputes';
/** Who is signed in, and how. `email` holds the phone number for phone sign-in. */
export type Account = { provider: 'email' | 'google' | 'apple' | 'phone' | 'demo'; name: string; email: string };

/** The 10-second Undo after a save. */
export type UndoState = { entryId: string; amount: number; until: number };

export type State = {
  stack: Screen[]; dir: 1 | -1;
  students: Student[]; sel: string; scanState: ScanState; scannedId: string;
  entries: Entry[]; receiptSeq: number; freshId: string;
  theme: ThemeKey; size: SizeKey; lang: Lang;
  q: string; f: Filter;
  amt: string; method: 'upi' | 'cash'; note: string;
  phone: string; code: string;
  authMode: 'signup' | 'login'; authBusy: '' | 'apple' | 'google';
  ownerName: string; nameDraft: string; onboarded: boolean; account: Account | null;
  shopHostel: string; customHostels: string[]; nsIdEditable: boolean;
  sheet: boolean;
  // Receipts and disputes
  receiptQueue: ReceiptTarget[]; awaitConfirm: ReceiptTarget | null; confirmFor: ReceiptTarget | null;
  undo: UndoState | null; disputeFor: string; resolveId: string;
  editHostel: string; editRoom: string;
  ns: { name: string; room: string; phone: string; hostel: string }; nsTouched: boolean;
  toast: string; toastOn: boolean; toastSeq: number; toastWarn: boolean; torch: boolean; saving: boolean;
};

const initial = (): State => ({
  stack: ['splash'], dir: 1,
  students: [], sel: DEMO_ID, scanState: 'ready', scannedId: NEW_ID,
  entries: [], receiptSeq: 1001, freshId: '',
  theme: 'light', size: 'regular', lang: 'en',
  q: '', f: 'all',
  amt: '', method: 'upi', note: '',
  phone: '98640 21873', code: '',
  authMode: 'signup', authBusy: '', ownerName: 'Sampath', nameDraft: '', onboarded: false, account: null,
  shopHostel: 'Kameng', customHostels: [], nsIdEditable: false,
  sheet: false,
  receiptQueue: [], awaitConfirm: null, confirmFor: null, undo: null, disputeFor: '', resolveId: '',
  editHostel: 'Kameng', editRoom: 'B-214',
  ns: { name: '', room: '', phone: '', hostel: 'Kameng' }, nsTouched: false,
  toast: '', toastOn: false, toastSeq: 0, toastWarn: false, torch: false, saving: false,
});

const KEY = 'studentDues.v1';                  // settings + students
const LEDGER_KEY = 'studentDues.ledger';       // { entries, receiptSeq }
const SCHEMA_KEY = 'studentDues.schemaVersion';
const TRANSIENT: Screen[] = ['scan', 'verify', 'newStudent', 'visitor', 'addDue', 'pay', 'edit', 'resolve'];
export const UNDO_MS = 10_000;

export const tapLight = () => { Haptics.selectionAsync().catch(() => {}); };
export const tapMedium = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
export const tapSuccess = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };
export const tapWarn = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}); };

const writeLedger = (entries: Entry[], receiptSeq: number) =>
  AsyncStorage.setItem(LEDGER_KEY, JSON.stringify({ entries, receiptSeq }));

/** Load settings, students and the ledger; migrate schema 1 (entries inside students) once. */
async function loadAll(): Promise<{ saved: any; students: Student[]; entries: Entry[]; receiptSeq: number }> {
  const [[, raw], [, ledgerRaw], [, version]] = await AsyncStorage.multiGet([KEY, LEDGER_KEY, SCHEMA_KEY]);
  let saved: any = {};
  try { saved = raw ? JSON.parse(raw) || {} : {}; } catch { saved = {}; }
  const savedStudents: LegacyStudent[] = Array.isArray(saved.students) ? saved.students : [];
  if (version === String(SCHEMA_VERSION) && ledgerRaw) {
    try {
      const l = JSON.parse(ledgerRaw);
      const students = savedStudents.map(({ tx: _tx, since: _since, ...s }) => s as Student);
      if (Array.isArray(l.entries) && students.length) return { saved, students, entries: l.entries, receiptSeq: l.receiptSeq };
    } catch {}
  }
  // Schema 1 → 2. Deterministic, so if it is interrupted and runs again the result is the same.
  const migrated = savedStudents.length ? migrateLegacy(savedStudents) : seedLedger();
  await writeLedger(migrated.entries, migrated.nextReceipt);
  await AsyncStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
  return { saved, students: migrated.students, entries: migrated.entries, receiptSeq: migrated.nextReceipt };
}

function useStoreValue() {
  const [state, setState] = useState<State>(initial);
  // The ref is the source of truth so chained actions (and timers) always see the latest state.
  const ref = useRef(state);
  const [ready, setReady] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = useCallback((patch: Partial<State> | ((s: State) => Partial<State>)) => {
    const s = ref.current;
    const next = { ...s, ...(typeof patch === 'function' ? patch(s) : patch) };
    ref.current = next;
    setState(next);
  }, []);
  const later = useCallback((fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); }, []);

  // Load saved prefs, students and ledger once.
  useEffect(() => {
    loadAll().then(({ saved, students, entries, receiptSeq }) => {
      set({
        theme: saved.theme ?? 'light', size: saved.size ?? 'regular', lang: saved.lang ?? 'en',
        ownerName: saved.name ?? 'Sampath', onboarded: !!saved.onboarded, account: saved.account ?? null,
        shopHostel: saved.shopHostel ?? 'Kameng', customHostels: Array.isArray(saved.customHostels) ? saved.customHostels : [],
        students, entries, receiptSeq,
      });
    }).catch(() => {
      const s = seedLedger();
      set({ students: s.students, entries: s.entries, receiptSeq: s.nextReceipt });
    }).finally(() => setReady(true));
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, [set]);

  // Persist settings + students whenever they change. The ledger is written by `commit` before the UI moves on.
  useEffect(() => {
    if (!ready) return;
    const s = ref.current;
    AsyncStorage.setItem(KEY, JSON.stringify({ theme: s.theme, size: s.size, lang: s.lang, name: s.ownerName, onboarded: s.onboarded, account: s.account, shopHostel: s.shopHostel, customHostels: s.customHostels, students: s.students })).catch(() => {});
  }, [ready, state.theme, state.size, state.lang, state.ownerName, state.onboarded, state.account, state.shopHostel, state.customHostels, state.students]);

  // Back from WhatsApp: ask whether the receipt went.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active' && ref.current.awaitConfirm) set((s) => ({ confirmFor: s.awaitConfirm, awaitConfirm: null }));
    });
    return () => sub.remove();
  }, [set]);

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
    const nameOf = (id: string) => ref.current.students.find((s) => s.id === id)?.name || '';
    const landOnStudent = (id: string, msg: string, extraTop?: Screen) => {
      let s = ref.current.stack.filter((x) => TRANSIENT.indexOf(x) < 0);
      if (s[s.length - 1] !== 'student') s = s.concat(['student']);
      if (extraTop) s = s.concat([extraTop]);
      set({ stack: s, dir: 1, sel: id, saving: false, amt: '', note: '' });
      if (msg) toast(msg);
    };

    // ── Ledger writes. Storage first, then the UI moves on.

    /** Write the ledger, then update state. Entries are only ever added (or, for Undo before the receipt was opened, dropped). */
    const commit = async (entries: Entry[], receiptSeq = ref.current.receiptSeq, extra: Partial<State> = {}) => {
      await writeLedger(entries, receiptSeq);
      set({ entries, receiptSeq, ...extra });
    };
    /** A new entry with the next receipt number. Receipt status starts as "no phone" when there's no number to send to. */
    const draft = (studentId: string, type: EntryType, amount: number, more: Partial<Entry>, seq: number): Entry => ({
      id: Crypto.randomUUID(), receiptNo: receiptNo(seq), studentId, type, amount,
      by: firstName(ref.current.ownerName), createdAt: new Date().toISOString(),
      receipt: { status: ref.current.students.find((s) => s.id === studentId)?.phone ? 'not_sent' : 'no_phone' },
      ...more,
    });
    const updateEntry = (id: string, fn: (e: Entry) => Entry) => commit(ref.current.entries.map((e) => (e.id === id ? fn(e) : e)));
    const queueReceipts = (targets: ReceiptTarget[]) => set((s) => ({ receiptQueue: s.receiptQueue.concat(targets) }));

    const startUndo = (e: Entry) => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      set({ undo: { entryId: e.id, amount: e.amount, until: Date.now() + UNDO_MS } });
      undoTimer.current = setTimeout(() => set({ undo: null }), UNDO_MS);
    };

    /** Save a due or payment from the money screen. Validation and "Correct?" checks happen before this. */
    const addTx = async (type: 'due' | 'pay') => {
      const st = ref.current;
      if (st.saving) return;
      const n = parseInt(st.amt || '0', 10);
      const s = find(st.sel);
      const b = balance(st.entries, s.id);
      if (!n || (type === 'pay' && n > b) || (type === 'due' && n > 10000)) return;
      set({ saving: true });
      const e = draft(s.id, type === 'due' ? 'due' : 'payment', n, type === 'due'
        ? { note: st.note.trim() || undefined } : { method: st.method === 'upi' ? 'UPI' : 'Cash' }, st.receiptSeq);
      try {
        await commit(st.entries.concat([e]), st.receiptSeq + 1, { freshId: e.id });
      } catch {
        set({ saving: false });
        tapWarn(); toast(strings(ref.current.lang).saveFailed, true);
        return;
      }
      tapSuccess();
      landOnStudent(s.id, '');
      set({ receiptQueue: [{ entryId: e.id, kind: 'entry' }] });
      startUndo(e);
    };

    /** Undo within 10 s: drop the entry if its receipt was never opened, otherwise add a reversal with its own receipt. */
    const undoLast = async () => {
      const u = ref.current.undo;
      if (undoTimer.current) clearTimeout(undoTimer.current);
      set({ undo: null });
      if (!u) return;
      const e = ref.current.entries.find((x) => x.id === u.entryId);
      if (!e) return;
      const t = strings(ref.current.lang);
      if (e.receipt.status === 'not_sent' || e.receipt.status === 'no_phone') {
        // It never reached the student, so no receipt is needed. The receipt number is not reused.
        await commit(ref.current.entries.filter((x) => x.id !== e.id), ref.current.receiptSeq, {
          receiptQueue: ref.current.receiptQueue.filter((q) => q.entryId !== e.id),
          awaitConfirm: ref.current.awaitConfirm?.entryId === e.id ? null : ref.current.awaitConfirm,
          confirmFor: ref.current.confirmFor?.entryId === e.id ? null : ref.current.confirmFor,
        });
        tapMedium(); toast(t.undone);
        return;
      }
      const seq = ref.current.receiptSeq;
      const rev = draft(e.studentId, 'reversal', Math.abs(correctedEffect(ref.current.entries, e)), { refId: e.id }, seq);
      await commit(ref.current.entries.concat([rev]), seq + 1, { freshId: rev.id });
      tapMedium();
      queueReceipts([{ entryId: rev.id, kind: 'entry' }]);
    };

    // ── Receipts

    const receiptOf = (t: ReceiptTarget): ReceiptState | undefined => {
      const e = ref.current.entries.find((x) => x.id === t.entryId);
      return t.kind === 'kept' ? e?.dispute?.keptReceipt : e?.receipt;
    };
    const setReceipt = (t: ReceiptTarget, patch: Partial<ReceiptState>) => updateEntry(t.entryId, (e) => (t.kind === 'kept'
      ? { ...e, dispute: e.dispute ? { ...e.dispute, keptReceipt: { ...(e.dispute.keptReceipt || { status: 'not_sent' }), ...patch } } : e.dispute }
      : { ...e, receipt: { ...e.receipt, ...patch } }));
    const messageFor = (t: ReceiptTarget) => {
      const e = ref.current.entries.find((x) => x.id === t.entryId);
      if (!e) return '';
      return receiptMessage(e, t.kind, {
        all: ref.current.entries, nameOf, hostel: ref.current.shopHostel, owner: firstName(ref.current.ownerName), lang: ref.current.lang,
      });
    };
    const openReceipt = (t: ReceiptTarget) => set({ receiptQueue: [t] });
    const nextReceipt = () => set((s) => ({ receiptQueue: s.receiptQueue.slice(1) }));
    /** Open WhatsApp with the receipt. We can only ever know it was opened; the shopkeeper confirms it was sent. */
    const sendReceipt = async (t: ReceiptTarget) => {
      const e = ref.current.entries.find((x) => x.id === t.entryId);
      const phone = e ? ref.current.students.find((s) => s.id === e.studentId)?.phone : '';
      const tr = strings(ref.current.lang);
      if (!e || !phone) return;
      try {
        await Linking.openURL(whatsAppUrl(phone, messageFor(t)));
      } catch {
        tapWarn(); toast(tr.waFailed, true);
        return;
      }
      await setReceipt(t, { status: receiptOf(t)?.status === 'sent' ? 'sent' : 'opened', openedAt: new Date().toISOString() });
      set((s) => ({ awaitConfirm: t, receiptQueue: s.receiptQueue.filter((q) => !(q.entryId === t.entryId && q.kind === t.kind)) }));
      toast(tr.waOpened);
    };
    /** "Did the receipt go?" — Sent marks it sent; Not yet leaves it opened (still counts as not sent). */
    const confirmReceipt = async (sent: boolean) => {
      const t = ref.current.confirmFor;
      set({ confirmFor: null });
      if (!t || !sent) return;
      await setReceipt(t, { status: 'sent', confirmedAt: new Date().toISOString() });
      tapSuccess();
    };
    /** A phone number was added: receipts waiting on "no phone" can now be sent. */
    const phoneAdded = (studentId: string) => commit(ref.current.entries.map((e) => (e.studentId === studentId && e.receipt.status === 'no_phone'
      ? { ...e, receipt: { ...e.receipt, status: 'not_sent' } } : e)));
    const addNumber = (studentId: string) => {
      const s = ref.current.students.find((x) => x.id === studentId);
      set({ receiptQueue: [], sel: studentId });
      go('edit', { editHostel: s?.hostel || ref.current.shopHostel, editRoom: s?.room || '' });
    };

    // ── Disputes

    const openDispute = async (entryId: string, reason: DisputeReason) => {
      // The student already says it's wrong: don't offer to send that entry's receipt again.
      set((st) => ({ disputeFor: '', receiptQueue: st.receiptQueue.filter((q) => q.entryId !== entryId) }));
      await updateEntry(entryId, (e) => ({ ...e, dispute: { status: 'open', reason, openedAt: new Date().toISOString() } }));
      tapWarn();
      toast(strings(ref.current.lang).disputed + ' · ' + strings(ref.current.lang).reasons[reason], true);
    };
    type Resolution = { outcome: 'kept' } | { outcome: 'changed'; amount: number } | { outcome: 'removed' } | { outcome: 'moved'; toId: string };
    /** Settle a dispute at the counter. Every outcome adds entries (never edits amounts) and sends receipts. */
    const resolveDispute = async (entryId: string, r: Resolution) => {
      const st = ref.current;
      const orig = st.entries.find((e) => e.id === entryId);
      if (!orig?.dispute) return;
      const t = strings(st.lang);
      const now = new Date().toISOString();
      const worth = Math.abs(correctedEffect(st.entries, orig));
      const rsAmt = (n: number) => '₹' + fmt(n);
      let seq = st.receiptSeq;
      const added: Entry[] = [];
      const receipts: ReceiptTarget[] = [];
      let msg = '';
      let students = st.students;
      const resolved = (outcome: 'kept' | 'changed' | 'removed' | 'moved', resolutionEntryId?: string) => ({
        ...orig.dispute!, status: 'resolved' as const, resolvedAt: now, outcome, resolutionEntryId,
      });
      let updated: Entry;
      if (r.outcome === 'kept') {
        const phone = st.students.find((s) => s.id === orig.studentId)?.phone;
        updated = { ...orig, dispute: { ...resolved('kept'), keptReceipt: { status: phone ? 'not_sent' : 'no_phone' } } };
        receipts.push({ entryId: orig.id, kind: 'kept' });
        msg = t.kept(rsAmt(worth));
      } else if (r.outcome === 'changed') {
        const sign = Math.sign(baseEffect(orig)) || 1;
        const delta = sign * r.amount - correctedEffect(st.entries, orig);
        const c = draft(orig.studentId, 'correction', r.amount, { delta, refId: orig.id }, seq++);
        added.push(c);
        updated = { ...orig, dispute: resolved('changed', c.id) };
        receipts.push({ entryId: c.id, kind: 'entry' });
        msg = t.changedTo(rsAmt(r.amount));
      } else if (r.outcome === 'removed') {
        const rev = draft(orig.studentId, 'reversal', worth, { refId: orig.id }, seq++);
        added.push(rev);
        updated = { ...orig, dispute: resolved('removed', rev.id) };
        receipts.push({ entryId: rev.id, kind: 'entry' });
        msg = t.removedAmt(rsAmt(worth));
      } else {
        // Wrong student: the value leaves this student and lands on the other, both with receipts.
        const outType: EntryType = orig.type === 'payment' ? 'transfer_in' : 'transfer_out';
        const inType: EntryType = outType === 'transfer_out' ? 'transfer_in' : 'transfer_out';
        const out = draft(orig.studentId, outType, worth, { refId: orig.id, otherStudentId: r.toId }, seq++);
        const into = draft(r.toId, inType, worth, { refId: orig.id, otherStudentId: orig.studentId }, seq++);
        added.push(out, into);
        updated = { ...orig, dispute: resolved('moved', out.id) };
        receipts.push({ entryId: out.id, kind: 'entry' }, { entryId: into.id, kind: 'entry' });
        students = st.students.map((s) => (s.id === orig.studentId ? { ...s, cardMisuse: true } : s));
        msg = t.movedToast(nameOf(r.toId));
      }
      const entries = st.entries.map((e) => (e.id === orig.id ? updated : e)).concat(added);
      await commit(entries, seq, { students, freshId: added[0]?.id || orig.id });
      tapSuccess();
      landOnStudent(orig.studentId, msg);
      set({ receiptQueue: receipts });
    };

    // ── Everything else

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
    const press = (v: string) => {
      const key = top() === 'otp' ? 'code' : 'amt';
      const cur = ref.current[key] || '';
      tapLight();
      if (v === 'del') return set({ [key]: cur.slice(0, -1) } as Partial<State>);
      if (key === 'amt' && !cur && v === '0') return;
      const max = key === 'code' ? 6 : 5;
      if (cur.length < max) set({ [key]: cur + v } as Partial<State>);
    };
    const openRemind = () => { tapMedium(); set({ sheet: true }); };
    const closeRemind = () => set({ sheet: false });
    const resetDemo = async () => {
      const s = seedLedger();
      await commit(s.entries, s.nextReceipt, { students: s.students, stack: ['splash'], dir: -1, q: '', f: 'all', onboarded: false, receiptQueue: [], undo: null });
    };
    const signOut = () => set({ stack: ['auth'], dir: -1, authMode: 'login', code: '', onboarded: false, account: null });
    /** A student ID only (from the barcode or typed): someone we know opens their profile, a new ID the New student form. */
    const openId = (id: string) => {
      const known = ref.current.students.find((s) => s.id === id);
      if (known) { tapSuccess(); landOnStudent(known.id, known.name + ' · ₹' + fmt(balance(ref.current.entries, known.id)) + ' due'); return; }
      tapWarn();
      go('newStudent', { scanState: 'ready', scannedId: id, nsIdEditable: false, nsTouched: false, ns: { name: '', room: '', phone: '', hostel: ref.current.shopHostel } });
      toast('New ID · add their details');
    };
    /** Shows "Reading…" briefly, as a real barcode read does, then opens the ID. */
    const startScanRead = (id: string = DEMO_ID) => {
      tapMedium();
      set({ scanState: 'reading' });
      later(() => {
        set({ scanState: 'ready' });
        if (top() === 'scan') openId(id);
      }, 900);
    };
    /** Handles a barcode read by the camera. The barcode carries only the student ID. */
    const handleScan = (data: string) => {
      if (ref.current.scanState !== 'ready' || top() !== 'scan') return;
      const id = (data || '').replace(/\D/g, '');
      if (id.length < 6 || id.length > 12) { tapWarn(); set({ scanState: 'invalid' }); return; }
      startScanRead(id);
    };
    return {
      set, go, back, tab, toast, find, nameOf, landOnStudent, authStart, authDone, authFail, demoSignIn, enterApp, addTx, undoLast,
      press, openRemind, closeRemind, resetDemo, signOut, startScanRead, handleScan, openId, later,
      openReceipt, nextReceipt, sendReceipt, confirmReceipt, messageFor, receiptOf, phoneAdded, addNumber, openDispute, resolveDispute,
    };
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

/** Balance, dispute and receipt summary for every student, worked out from the ledger in one pass. */
export function useSummaries(): Record<string, Summary> {
  const { state } = useStore();
  return useMemo(() => summaries(state.entries, state.students.map((s) => s.id)), [state.entries, state.students]);
}

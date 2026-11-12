import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { Anim } from '../anim';
import { Avatar, DismissKeyboard, Icon, IconName, PillButton, T, Tap } from '../components/ui';
import { BackBtn, Keypad } from '../components/parts';
import { ReceiptStatusLine } from '../components/Receipts';
import { fmt, initials, placeOf, rs } from '../data';
import { ACCEPT_AFTER_MS, correctedEffect, disputeDaysOpen } from '../ledger/balance';
import { receiptDate } from '../ledger/receipt';
import { tapLight, useLook, useStore } from '../store';
import { useSafe } from '../safe';
import { AmountWords } from './StudentScreens';

type Mode = null | 'change' | 'move';

/** Settle a dispute face to face: the evidence first, then Keep it / Change amount / Remove it / Wrong student. */
export function Resolve() {
  const { state, back, find, resolveDispute, nameOf } = useStore();
  const { c, t, lang, fs, isDark } = useLook();
  const { top, bottom } = useSafe();
  const [mode, setMode] = useState<Mode>(null);
  const [amt, setAmt] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const e = state.entries.find((x) => x.id === state.resolveId);
  if (!e?.dispute) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  const s = find(e.studentId);
  const worth = Math.abs(correctedEffect(state.entries, e));
  const n = parseInt(amt || '0', 10);
  const changeOk = n > 0 && n !== worth && n <= 10000;

  // Was the 24-hour window over with no reply when the dispute was raised?
  const confirmed = e.receipt.status === 'sent' && e.receipt.confirmedAt ? new Date(e.receipt.confirmedAt).getTime() : 0;
  const windowText = !confirmed ? t.windowNone
    : new Date(e.dispute.openedAt).getTime() - confirmed > ACCEPT_AFTER_MS ? t.windowPassed : t.windowOpen;
  const facts: [string, React.ReactNode][] = [
    [t.items, e.type === 'due' ? (e.note || 'Shop items') : (e.method || 'Cash')],
    [t.amount, rs(worth) + (worth !== e.amount ? ' (' + rs(e.amount) + ')' : '')],
    [t.when, receiptDate(e.createdAt, lang) + ' · ' + e.receiptNo],
    [t.enteredBy, e.by],
    [t.receipt, <View key="r" style={{ alignItems: 'flex-end', gap: 2 }}>
      <ReceiptStatusLine receipt={e.receipt} />
      {e.receipt.confirmedAt ? <T size={12} color={c.text2}>{receiptDate(e.receipt.confirmedAt, lang)}</T> : null}
    </View>],
    [t.windowLabel, windowText],
  ];
  const run = async (r: Parameters<typeof resolveDispute>[1]) => {
    if (busy) return;
    setBusy(true);
    await resolveDispute(e.id, r);
  };
  const outcome = (key: string, icon: IconName, title: string, sub: string, onPress: () => void, on = false) => (
    <Tap key={key} onPress={() => { tapLight(); onPress(); }} label={title} scaleTo={0.98}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, minHeight: 68, borderRadius: 22, backgroundColor: on ? c.primarySoft : c.surface, borderWidth: 2, borderColor: on ? c.primary : 'transparent' }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={c.text} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T size={17} weight={600}>{title}</T>
        <T size={13} color={c.text2}>{sub}</T>
      </View>
      <Icon name="chevron" size={20} color={c.text3} />
    </Tap>
  );
  const others = state.students.filter((x) => x.id !== s.id && (!q.trim() || (x.name + ' ' + x.id + ' ' + x.room).toLowerCase().includes(q.trim().toLowerCase())));
  return (
    <DismissKeyboard style={{ backgroundColor: c.bg }}>
      <View style={{ flex: 1, paddingTop: top, paddingHorizontal: 16, paddingBottom: Math.max(bottom - 10, 12) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <BackBtn color={c.text} onPress={back} style={{ marginLeft: -6 }} />
          <T size={18} weight={700} accessibilityRole="header">{t.resolve}</T>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView style={{ flex: 1, marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Anim type="rise" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <Avatar ini={initials(s.name)} size={46} bg={c.amberSoft} fg={c.amber} fontSize={16} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T size={20} weight={800} face="display">{s.name}</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, backgroundColor: c.amberSoft }}>
                  <T size={12} weight={700} color={c.amber}>{t.disputed + ' · ' + t.reasons[e.dispute.reason]}</T>
                </View>
                <T size={12} color={c.text2}>{t.daysOpenLabel(disputeDaysOpen(e))}</T>
              </View>
            </View>
          </Anim>

          <T size={15} weight={700} color={c.text2} style={{ marginTop: 20, marginBottom: 8, marginHorizontal: 4 }}>{t.evidence}</T>
          <Anim type="rise" delay={60} style={{ backgroundColor: c.surface, borderRadius: 22, overflow: 'hidden' }}>
            {facts.map(([k, v], i) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 10, minHeight: 50, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                <T size={15} color={c.text2}>{k}</T>
                {typeof v === 'string' ? <T size={15} weight={600} style={{ textAlign: 'right', flexShrink: 1 }}>{v}</T> : v}
              </View>
            ))}
          </Anim>

          <Anim type="rise" delay={120} style={{ gap: 8, marginTop: 20 }}>
            {outcome('keep', 'check', t.keepIt, t.keepSub, () => run({ outcome: 'kept' }))}
            {outcome('change', 'plus', t.changeAmount, t.changeSub, () => setMode(mode === 'change' ? null : 'change'), mode === 'change')}
            {outcome('remove', 'close', t.removeIt, t.removeSub, () => run({ outcome: 'removed' }))}
            {outcome('move', 'students', t.wrongStudent, t.wrongSub, () => setMode(mode === 'move' ? null : 'move'), mode === 'move')}
          </Anim>

          {mode === 'change' ? (
            <View style={{ marginTop: 16, gap: 8 }}>
              <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <T size={18} weight={600} color={c.text3} style={{ textDecorationLine: 'line-through' }}>{rs(worth)}</T>
                <Icon name="chevron" size={18} color={c.text3} />
                <T size={44} weight={800} face="display" ls={-0.03} color={n ? c.text : c.text3}>{'₹' + (n ? fmt(n) : '0')}</T>
              </View>
              <AmountWords n={n} />
              <Keypad kind="amt" onKey={(k) => {
                tapLight();
                if (k === 'del') setAmt((a) => a.slice(0, -1));
                else setAmt((a) => (!a && k === '0') || a.length >= 5 ? a : a + k);
              }} />
              <PillButton title={changeOk ? t.saveChange + ' · ' + rs(n) : t.saveChange} disabled={!changeOk || busy}
                onPress={() => run({ outcome: 'changed', amount: n })} bg={changeOk ? c.primary : c.disBg} fg={changeOk ? '#FFFFFF' : c.disFg} />
            </View>
          ) : null}

          {mode === 'move' ? (
            <View style={{ marginTop: 16, gap: 8 }}>
              <T size={15} weight={700} color={c.text2} style={{ marginHorizontal: 4 }}>{t.pickStudent}</T>
              <TextInput accessibilityLabel={t.pickStudent} placeholder={t.search} placeholderTextColor={c.text3} value={q} onChangeText={setQ}
                autoCorrect={false} keyboardAppearance={isDark ? 'dark' : 'light'}
                style={{ height: 50, borderRadius: 16, backgroundColor: c.surface2, color: c.text, fontFamily: 'Inter_400Regular', fontSize: fs(16), paddingHorizontal: 16 }} />
              <View style={{ backgroundColor: c.surface, borderRadius: 22, overflow: 'hidden' }}>
                {others.slice(0, 30).map((x, i) => (
                  <Tap key={x.id} onPress={() => run({ outcome: 'moved', toId: x.id })} label={t.moveTo(x.name)} scaleTo={0.98}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 60, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                    <Avatar ini={initials(x.name)} size={36} bg={c.surface2} fg={c.text2} fontSize={13} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T size={16} weight={600} numberOfLines={1}>{x.name}</T>
                      <T size={13} color={c.text2} numberOfLines={1}>{placeOf(x)}</T>
                    </View>
                  </Tap>
                ))}
              </View>
            </View>
          ) : null}
          <T size={12} color={c.text3} center style={{ marginTop: 14 }}>{nameOf(e.studentId) + ' · ' + e.receiptNo}</T>
        </ScrollView>
      </View>
    </DismissKeyboard>
  );
}

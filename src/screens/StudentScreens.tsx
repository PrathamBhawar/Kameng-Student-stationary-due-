import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { Anim, reducedMotion } from '../anim';
import { Avatar, Icon, LinearBg, PillButton, RadialBg, T, Tap } from '../components/ui';
import { BackBtn, Keypad } from '../components/parts';
import { bal, fmt, HOSTELS, initials, prettyPhone, rs } from '../data';
import { grad } from '../theme';
import { tapLight, tapWarn, useLook, useStore } from '../store';
import { useSafe } from '../safe';
import { useStatusLook } from './Home';
import { Segmented } from './Onboarding';

// ───────────────────────── 14 Student profile
export function StudentDetail() {
  const { state, back, go, find, openRemind } = useStore();
  const { c, t } = useLook();
  const { top, width } = useSafe();
  const s = find(state.sel);
  const b = bal(s);
  const L = useStatusLook()(s);
  const canPay = b > 0;
  const rows = s.tx.map((x, i) => ({ ...x, after: bal({ ...s, tx: s.tx.slice(0, i + 1) }) })).reverse();
  const dues = s.tx.filter((x) => x.type === 'due').reduce((a, x) => a + x.amt, 0);
  const paid = s.tx.filter((x) => x.type === 'pay').reduce((a, x) => a + x.amt, 0);
  const action = (label: string, onPress: () => void, circle: React.ReactNode, disabled?: boolean, fg = c.text) => (
    <Tap onPress={onPress} disabled={disabled} label={label} scaleTo={0.92} style={{ flex: 1, alignItems: 'center', gap: 8, padding: 4 }}>
      {circle}
      <T size={14} weight={600} color={fg} center>{label}</T>
    </Tap>
  );
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
      <View style={{ marginHorizontal: -16, paddingTop: top + 2, paddingHorizontal: 16, paddingBottom: 30, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: 'hidden' }}>
        <LinearBg stops={grad.card} />
        <Anim type="glow" pointerEvents="none" style={{ position: 'absolute', top: -140, left: width / 2 - 230, width: 460, height: 360 }}>
          <RadialBg stops={[[0, 'rgba(180,198,255,0.5)'], [1, 'rgba(180,198,255,0)']]} />
        </Anim>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <BackBtn color="#FFFFFF" onPress={back} circle="rgba(255,255,255,0.18)" />
          <Tap onPress={() => go('edit', { editHostel: s.hostel, editRoom: s.room })} label="Edit details"
            style={{ height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center' }}>
            <T size={15} weight={600} color="#FFFFFF">Edit</T>
          </Tap>
        </View>
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <Anim type="pop">
            <Avatar ini={initials(s.name)} size={76} bg="rgba(255,255,255,0.2)" fg="#FFFFFF" fontSize={26} face="display" weight={800} ring="rgba(255,255,255,0.35)" />
          </Anim>
          <T size={28} weight={800} face="display" ls={-0.02} color="#FFFFFF" center style={{ marginTop: 12 }} accessibilityRole="header">{s.name}</T>
          <T size={15} color="rgba(255,255,255,0.8)" center style={{ marginTop: 4 }}>{s.id} · {s.hostel} · {s.room}</T>
          <Anim type="pop" delay={120} style={{ marginTop: 18 }}>
            <T size={56} weight={800} face="display" ls={-0.04} lh={1.1} color="#FFFFFF">{rs(b)}</T>
          </Anim>
          <View style={{ marginTop: 8, height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.18)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: L.dot }} />
            <T size={14} weight={700} color="#FFFFFF">{L.chip}</T>
          </View>
        </View>
      </View>

      <Anim type="rise" delay={160} style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
        {action(t.addDue, () => go('addDue', { amt: '', note: '' }),
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#2B4CFF', shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 10 } }}>
            <Icon name="plus" size={26} color="#FFFFFF" sw={2.2} />
          </View>)}
        {action(t.receive, () => canPay && go('pay', { amt: '', method: 'upi' }),
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: canPay ? c.green : c.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <T fixed size={26} weight={800} face="display" color={canPay ? '#FFFFFF' : c.text3}>₹</T>
          </View>, !canPay, canPay ? c.text : c.text3)}
        {action(t.remind, openRemind,
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={24} color={c.text} />
          </View>)}
      </Anim>

      <Anim type="rise" delay={220} style={{ flexDirection: 'row', marginTop: 22, backgroundColor: c.surface, borderRadius: 22, overflow: 'hidden' }}>
        <View style={{ flex: 1, padding: 16, gap: 4 }}>
          <T size={14} weight={600} color={c.text2}>Total dues</T>
          <T size={22} weight={800} face="display">{rs(dues)}</T>
        </View>
        <View style={{ flex: 1, padding: 16, gap: 4, borderLeftWidth: 1, borderLeftColor: c.line }}>
          <T size={14} weight={600} color={c.text2}>Total paid</T>
          <T size={22} weight={800} face="display" color={c.green}>{rs(paid)}</T>
        </View>
      </Anim>

      <T size={22} weight={700} face="display" style={{ marginTop: 26, marginBottom: 12, marginHorizontal: 4 }} accessibilityRole="header">{t.history}</T>
      {rows.length ? (
        <Anim type="rise" delay={280} style={{ backgroundColor: c.surface, borderRadius: 22, overflow: 'hidden' }}>
          {rows.map((x, i) => (
            <TxRow key={s.id + ':' + (s.tx.length - 1 - i)} first={i === 0} fresh={!!x.fresh}
              title={x.type === 'due' ? 'Due added' : 'Payment received'}
              sub={x.date + ' · ' + (x.type === 'due' ? x.note : x.method) + ' · ' + x.by}
              amt={rs(x.amt)} after={rs(x.after)} glyph={x.type === 'due' ? '+' : '₹'}
              avBg={x.type === 'due' ? c.amberSoft : c.greenSoft} avFg={x.type === 'due' ? c.amber : c.green}
              amtFg={x.type === 'due' ? c.text : c.green} />
          ))}
        </Anim>
      ) : (
        <View style={{ backgroundColor: c.surface, borderRadius: 22, padding: 28 }}>
          <T size={15} color={c.text2} center>No entries yet</T>
        </View>
      )}
    </ScrollView>
  );
}

function TxRow({ first, fresh, title, sub, amt, after, glyph, avBg, avFg, amtFg }: {
  first: boolean; fresh: boolean; title: string; sub: string; amt: string; after: string; glyph: string; avBg: string; avFg: string; amtFg: string;
}) {
  const { c } = useLook();
  // The new entry fades in a highlight (design: background transition 1.2s).
  const hl = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!fresh) { hl.setValue(0); return; }
    Animated.timing(hl, { toValue: 1, duration: reducedMotion() ? 0 : 1200, delay: 300, useNativeDriver: false }).start();
  }, [fresh, hl]);
  return (
    <Animated.View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16, minHeight: 72,
      borderTopWidth: first ? 0 : 1, borderTopColor: c.line,
      backgroundColor: hl.interpolate({ inputRange: [0, 1], outputRange: [c.surface, c.primarySoft] }),
    }}>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: avBg, alignItems: 'center', justifyContent: 'center' }}>
        <T fixed size={18} weight={800} face="display" color={avFg}>{glyph}</T>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <T size={16} weight={600}>{title}</T>
        <T size={13} color={c.text2} numberOfLines={1}>{sub}</T>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <T size={18} weight={700} face="display" color={amtFg}>{amt}</T>
        <T size={12} color={c.text2}>Left {after}</T>
      </View>
    </Animated.View>
  );
}

// ───────────────────────── 18 Edit details
export function HostelPicker({ value, onPick, h = 44 }: { value: string; onPick: (h: string) => void; h?: number }) {
  const { c } = useLook();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Hostel" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {HOSTELS.map((x) => {
        const on = value === x;
        return (
          <Tap key={x} onPress={() => { tapLight(); onPick(x); }} accessibilityRole="radio" accessibilityState={{ checked: on }} label={x} scaleTo={0.94}
            style={{ height: h, paddingHorizontal: h === 44 ? 18 : 16, borderRadius: h / 2, justifyContent: 'center', backgroundColor: on ? c.primarySoft : c.surface, borderWidth: 2, borderColor: on ? c.primary : 'transparent' }}>
            <T size={h === 44 ? 16 : 15} weight={600} color={on ? c.primaryInk : c.text}>{x}</T>
          </Tap>
        );
      })}
    </View>
  );
}

export function EditStudent() {
  const { state, set, back, find, landOnStudent } = useStore();
  const { c, fs } = useLook();
  const { top, bottom } = useSafe();
  const s = find(state.sel);
  const room = state.editRoom.trim();
  const changed = room.toUpperCase() !== s.room || state.editHostel !== s.hostel;
  const ok = !!room && changed;
  const save = () => {
    if (!ok) return;
    const students = state.students.map((x) => x.id !== s.id ? x : { ...x, hostel: state.editHostel, room: room.toUpperCase() });
    set({ students });
    landOnStudent(s.id, 'Details saved');
  };
  const locked: [string, string][] = [['Name', s.name], ['Student ID', s.id], ['Phone', prettyPhone(s.phone)]];
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1, paddingTop: top + 2, paddingHorizontal: 16, paddingBottom: Math.max(bottom - 2, 16) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <Tap onPress={back} label="Cancel" style={{ paddingVertical: 10, paddingHorizontal: 2 }}><T size={17} weight={600} color={c.primaryInk}>Cancel</T></Tap>
          <T size={17} weight={700} accessibilityRole="header">Edit details</T>
          <View style={{ width: 56 }} />
        </View>
        <ScrollView style={{ flex: 1, marginTop: 8, marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Anim type="rise" style={{ marginTop: 10, backgroundColor: c.surface, borderRadius: 22, overflow: 'hidden' }}>
            {locked.map(([k, v], i) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, minHeight: 58, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                <T size={15} color={c.text2}>{k}</T>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                  <T size={16} weight={600} color={v === 'Not on ID' ? c.text2 : c.text} style={{ textAlign: 'right', flexShrink: 1 }}>{v}</T>
                  <View accessibilityLabel="Locked"><Icon name="lock" size={16} color={c.text3} /></View>
                </View>
              </View>
            ))}
          </Anim>
          <T size={13} color={c.text2} style={{ marginTop: 8, marginHorizontal: 4 }}>{s.phone ? 'From 1Stop ID. Locked.' : 'Phone missing. Re-scan ID.'}</T>
          <T size={15} weight={600} style={{ marginTop: 22, marginBottom: 8, marginHorizontal: 4 }}>Hostel</T>
          <HostelPicker value={state.editHostel} onPick={(h) => set({ editHostel: h })} />
          <T size={15} weight={600} style={{ marginTop: 22, marginBottom: 8, marginHorizontal: 4 }}>Room</T>
          <TextInput accessibilityLabel="Room" value={state.editRoom} onChangeText={(v) => set({ editRoom: v.toUpperCase().slice(0, 6) })}
            placeholder="e.g. B-214" placeholderTextColor={c.text3} autoCapitalize="characters" autoCorrect={false} returnKeyType="done" onSubmitEditing={save}
            keyboardAppearance={c.bg === '#0A0C10' ? 'dark' : 'light'}
            style={{ height: 56, borderRadius: 16, backgroundColor: c.surface, color: c.text, fontFamily: 'Inter_600SemiBold', fontSize: fs(18), paddingHorizontal: 16, borderWidth: 2, borderColor: !room ? c.red : 'transparent' }} />
          {!room ? <T accessibilityRole="alert" size={14} weight={600} color={c.red} style={{ marginTop: 6, marginHorizontal: 4 }}>Enter a room</T> : null}
        </ScrollView>
        <PillButton title="Save" disabled={!ok} onPress={save} bg={ok ? c.primary : c.disBg} fg={ok ? '#FFFFFF' : c.disFg} style={{ marginTop: 12 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

// ───────────────────────── 16 Receive Payment / 17 Add due
export function Money() {
  const { state, set, back, find, addTx } = useStore();
  const { c, t, fs } = useLook();
  const { top, bottom } = useSafe();
  const scr = state.stack[state.stack.length - 1];
  const isPay = scr === 'pay';
  const s = find(state.sel);
  const cb = bal(s);
  const L = useStatusLook()(s);
  const n = parseInt(state.amt || '0', 10);
  const over = isPay ? n > cb : n > 10000;
  const okAmt = n > 0 && !over;
  const enabled = okAmt && !state.saving;
  const quick: [string, number][] = (isPay
    ? [['Full ' + rs(cb), cb], ['Half ' + rs(Math.round(cb / 2)), Math.round(cb / 2)], [rs(100), 100]]
    : [['₹20', 20], ['₹50', 50], ['₹100', 100], ['₹200', 200]]) as [string, number][];
  const hint = !n ? (isPay ? 'Enter amount received' : 'Enter amount owed')
    : over ? (isPay ? 'More than owed' : 'Max ₹10,000')
    : isPay ? (n === cb ? 'Clears full balance' : 'Part payment') : 'Looks good';

  // Bump the amount on every change, shake it when it goes over the limit.
  const bump = useState(() => new Animated.Value(1))[0];
  const shake = useState(() => new Animated.Value(0))[0];
  const prevOver = useRef(over);
  useEffect(() => {
    if (reducedMotion()) return;
    bump.setValue(1.06);
    Animated.spring(bump, { toValue: 1, useNativeDriver: true, bounciness: 14, speed: 30 }).start();
    if (over && !prevOver.current) {
      tapWarn();
      Animated.sequence([-8, 8, -6, 6, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true }))).start();
    }
    prevOver.current = over;
  }, [state.amt]); // eslint-disable-line react-hooks/exhaustive-deps

  const lineFg = isPay ? c.green : c.amber;
  const full = okAmt && n === cb;
  return (
    <View style={{ flex: 1, paddingTop: top, paddingHorizontal: 16, paddingBottom: Math.max(bottom - 10, 12), backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <BackBtn color={c.text} onPress={back} style={{ marginLeft: -6 }} />
        <T size={18} weight={700} accessibilityRole="header">{isPay ? t.receive : t.addDue}</T>
        <Tap onPress={back} label="Cancel" style={{ paddingVertical: 10, paddingHorizontal: 2 }}><T size={17} weight={600} color={c.primaryInk}>Cancel</T></Tap>
      </View>

      <ScrollView style={{ flex: 1, marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Anim type="pop" style={{ alignSelf: 'center', marginTop: 8, height: 38, paddingLeft: 4, paddingRight: 14, borderRadius: 19, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Avatar ini={initials(s.name)} size={30} bg={L.avBg} fg={L.avFg} fontSize={12} />
          <T size={15} weight={600}>{s.name}</T>
        </Anim>

        {isPay ? (
          <View style={{ marginTop: 14 }}>
            <Segmented label="Payment method" options={[['upi', 'UPI'], ['cash', 'Cash']]} value={state.method}
              onChange={(k) => { tapLight(); set({ method: k }); }} height={46} radius={12} track={c.surface2} thumb={c.surface} thumbShadow
              render={(_, l) => <T size={16} weight={700}>{l}</T>} />
          </View>
        ) : null}

        <Animated.View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, minHeight: 76, transform: [{ translateX: shake }] }}>
          <T size={40} weight={700} face="display" color={n ? c.text2 : c.text3} style={{ marginRight: 4 }}>₹</T>
          <Animated.View style={{ transform: [{ scale: bump }] }}>
            <T size={60} weight={800} face="display" ls={-0.04} color={!n ? c.text3 : over ? c.red : isPay ? c.green : c.text}>{n ? fmt(n) : '0'}</T>
          </Animated.View>
          <Anim type="blink" style={{ width: 3, height: 48, borderRadius: 2, backgroundColor: c.primary, marginLeft: 4 }} />
        </Animated.View>
        <T accessibilityRole="text" size={15} weight={600} color={over ? c.red : c.text2} center style={{ minHeight: 20 }}>{hint}</T>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {quick.filter((q) => q[1] > 0).map(([label, v]) => {
            const on = n === v;
            return (
              <Tap key={label} onPress={() => { tapLight(); set({ amt: String(v) }); }} label={label} scaleTo={0.94}
                style={{ flex: 1, minWidth: 0, height: 42, borderRadius: 21, backgroundColor: on ? c.text : c.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                <T size={15} weight={600} color={on ? c.bg : c.text} numberOfLines={1} adjustsFontSizeToFit>{label}</T>
              </Tap>
            );
          })}
        </View>

        {!isPay ? (
          <TextInput accessibilityLabel="Note, optional" placeholder="Note (optional)" placeholderTextColor={c.text3} value={state.note}
            onChangeText={(v) => set({ note: v.slice(0, 40) })} returnKeyType="done" keyboardAppearance={c.bg === '#0A0C10' ? 'dark' : 'light'}
            style={{ marginTop: 10, height: 48, borderRadius: 14, backgroundColor: c.surface, color: c.text, fontFamily: 'Inter_400Regular', fontSize: fs(16), paddingHorizontal: 14 }} />
        ) : null}

        <View style={{ marginTop: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20, backgroundColor: c.surface, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T size={16} color={c.text2}>Owes now</T><T size={16} weight={600}>{rs(cb)}</T>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T size={16} weight={600} color={lineFg}>{isPay ? '− Receiving (' + (state.method === 'upi' ? 'UPI' : 'Cash') + ')' : '+ Adding'}</T>
            <T size={16} weight={700} color={lineFg}>{rs(okAmt ? n : 0)}</T>
          </View>
          <View style={{ height: 1, backgroundColor: c.line }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T size={16} weight={700}>{isPay ? (full ? 'Fully paid' : 'Left to pay') : 'New total'}</T>
            <T size={22} weight={800} face="display" color={isPay && full ? c.green : c.text}>
              {isPay ? rs(Math.max(cb - (okAmt ? n : 0), 0)) : rs(cb + (okAmt ? n : 0))}
            </T>
          </View>
        </View>
      </ScrollView>

      <PillButton title={okAmt ? (isPay ? 'Confirm ' + rs(n) : 'Save ' + rs(n)) : (isPay ? 'Confirm' : 'Save')} disabled={!enabled}
        onPress={() => addTx(isPay ? 'pay' : 'due')} style={{ marginTop: 10 }}
        bg={enabled ? (isPay ? c.green : c.primary) : c.disBg} fg={enabled ? '#FFFFFF' : c.disFg} />
      <View style={{ marginTop: 10 }}><Keypad kind="amt" /></View>
    </View>
  );
}

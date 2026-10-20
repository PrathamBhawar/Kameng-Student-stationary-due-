import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutAnimation, PanResponder, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Anim, reducedMotion } from '../anim';
import { Avatar, Glass, Icon, LinearBg, OwnerAvatar, RadialBg, T, Tap } from '../components/ui';
import { bal, initials, rs, status, Student, DEMO_ID } from '../data';
import { grad, sizes } from '../theme';
import { Filter, firstName, tapLight, useLook, useStore } from '../store';
import { useSafe } from '../safe';
import { Segmented } from './Onboarding';

const smooth = () => { if (!reducedMotion()) LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity')); };

export function useStatusLook() {
  const { c, t } = useLook();
  return (s: Student) => {
    const k = status(s);
    if (k === 'overdue') return { k, chip: t.overdue + ' · ' + s.since + 'd', chipBg: c.redSoft, chipFg: c.red, avBg: c.redSoft, avFg: c.red, dot: '#FF8F86' };
    if (k === 'pending') return { k, chip: t.pending, chipBg: c.amberSoft, chipFg: c.amber, avBg: c.amberSoft, avFg: c.amber, dot: '#F7C26B' };
    return { k, chip: t.settled, chipBg: c.greenSoft, chipFg: c.green, avBg: c.greenSoft, avFg: c.green, dot: '#5FE091' };
  };
}

// ───────────────────────── 07 Overview
export function Overview() {
  const { state, set, tab } = useStore();
  const { t, lang } = useLook();
  const { top, width } = useSafe();
  const owing = state.students.filter((s) => bal(s) > 0);
  const od = owing.filter((s) => status(s) === 'overdue');
  const pd = owing.filter((s) => status(s) === 'pending');
  const sum = (a: Student[]) => a.reduce((x, s) => x + bal(s), 0);
  const goList = (f: Filter) => set({ stack: ['students'], dir: 1, f, q: '' });
  const owner = (state.ownerName || 'S').trim()[0]?.toUpperCase() || 'S';
  const row = (icon: 'clock' | 'warn', tint: string, fg: string, title: string, sub: string, amt: string, amtFg: string, f: Filter) => (
    <Tap onPress={() => goList(f)} label={title + ', ' + amt} scaleTo={0.98}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, minHeight: 80 }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={24} color={fg} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <T size={17} weight={600} color="#FFFFFF">{title}</T>
        <T size={14} weight={f === 'overdue' ? 600 : 400} color={f === 'overdue' ? '#FF9A91' : 'rgba(255,255,255,0.65)'}>{sub}</T>
      </View>
      <T size={22} weight={800} face="display" color={amtFg}>{amt}</T>
      <Icon name="chevron" size={20} color="rgba(255,255,255,0.5)" />
    </Tap>
  );
  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <LinearBg stops={grad.home} />
      <Anim type="glow" pointerEvents="none" style={{ position: 'absolute', top: -120, left: width / 2 - 260, width: 520, height: 420 }}>
        <RadialBg stops={[[0, 'rgba(170,190,255,0.55)'], [1, 'rgba(170,190,255,0)']]} />
      </Anim>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top + 4, paddingHorizontal: 16, paddingBottom: 130 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Anim type="rise" style={{ flex: 1 }}><T size={20} weight={600} color="#FFFFFF" numberOfLines={2}>{t.greet(firstName(state.ownerName))}</T></Anim>
          <Tap onPress={() => tab('profile')} label="Profile" scaleTo={0.9}><OwnerAvatar ini={owner} size={42} fontSize={16} ring /></Tap>
        </View>
        <View style={{ alignItems: 'center', marginTop: 92 }}>
          <Anim type="rise" delay={60}><T size={16} weight={500} color="rgba(255,255,255,0.85)">{t.total}</T></Anim>
          <Anim type="pop" delay={120} style={{ marginTop: 6 }}>
            <CountUp value={sum(owing)} size={60} />
          </Anim>
          <Anim type="rise" delay={220} style={{ marginTop: 14 }}>
            <Tap onPress={() => goList('all')} label="Show students who owe">
              <Glass tint="rgba(255,255,255,0.2)" radius={20} intensity={20} style={{ height: 40, paddingHorizontal: 18, justifyContent: 'center' }}>
                <T size={15} weight={600} color="#FFFFFF">{t.n(owing.length) + t.owe}</T>
              </Glass>
            </Tap>
          </Anim>
        </View>
        <Anim type="rise" delay={320} style={{ marginTop: 120 }}>
          <Glass tint="rgba(16,20,48,0.55)" radius={24} intensity={40} style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            {row('clock', 'rgba(243,179,83,0.18)', '#F3B353', t.pending, t.n(pd.length), rs(sum(pd)), '#FFFFFF', 'pending')}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginLeft: 76 }} />
            {row('warn', 'rgba(255,128,118,0.18)', '#FF8F86', t.overdue, t.n(od.length), rs(sum(od)), '#FF9A91', 'overdue')}
          </Glass>
        </Anim>
        <T size={13} color="rgba(255,255,255,0.55)" center style={{ marginTop: 16 }}>{lang === 'as' ? 'নমুনা তথ্য' : 'Sample data'}</T>
      </ScrollView>
    </View>
  );
}

/** Hero number that counts up when the screen opens and glides when the total changes. */
function CountUp({ value, size }: { value: number; size: number }) {
  const [shown, setShown] = useState(reducedMotion() ? value : Math.round(value * 0.6));
  const from = useRef(shown);
  useEffect(() => {
    if (reducedMotion()) return;
    const start = Date.now(), a = from.current, d = 900;
    let raf = 0;
    const step = () => {
      const p = Math.min(1, (Date.now() - start) / d);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(a + (value - a) * e);
      setShown(v); from.current = v;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    const timer = setTimeout(() => { raf = requestAnimationFrame(step); }, 120);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [value]);
  return <T size={size} weight={800} face="display" ls={-0.04} lh={1.1} color="#FFFFFF" accessibilityLabel={rs(value)}>{rs(reducedMotion() ? value : shown)}</T>;
}

// ───────────────────────── 08 Students
export function Students() {
  const { state, set, go } = useStore();
  const { c, t, fs } = useLook();
  const { top } = useSafe();
  const look = useStatusLook();
  const q = state.q.trim().toLowerCase();
  const byQ = state.students.filter((s) => !q || s.name.toLowerCase().includes(q) || s.id.includes(q) || s.room.toLowerCase().includes(q));
  const order = { overdue: 0, pending: 1, settled: 2 };
  const rows = byQ.filter((s) => state.f === 'all' || status(s) === state.f)
    .sort((a, b) => (order[status(a)] - order[status(b)]) || (b.since - a.since));
  const chips: [Filter, string][] = [['all', t.all], ['pending', t.pending], ['overdue', t.overdue], ['settled', t.settled]];
  return (
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: top + 8, paddingHorizontal: 16, paddingBottom: 130 }}>
      <Anim type="rise" style={{ marginHorizontal: 4 }}><T size={34} weight={800} face="display" ls={-0.03} accessibilityRole="header">{t.students}</T></Anim>
      <View style={{ marginTop: 14, justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: 14, zIndex: 1 }} pointerEvents="none"><Icon name="search" size={22} color={c.text2} /></View>
        <TextInput accessibilityLabel="Search students" placeholder={t.search} placeholderTextColor={c.text3} value={state.q}
          onChangeText={(v) => { smooth(); set({ q: v }); }} returnKeyType="search" autoCorrect={false} clearButtonMode="never"
          style={{ height: 52, borderRadius: 16, backgroundColor: c.surface2, color: c.text, fontFamily: 'Inter_400Regular', fontSize: fs(17), paddingLeft: 46, paddingRight: 44 }} />
        {q ? (
          <Tap onPress={() => { smooth(); set({ q: '' }); }} label="Clear search" scaleTo={0.85}
            style={{ position: 'absolute', right: 6, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={20} color={c.text2} sw={2.2} />
          </Tap>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {chips.map(([k, label]) => {
          const on = state.f === k;
          const n = byQ.filter((s) => k === 'all' || status(s) === k).length;
          return (
            <Tap key={k} onPress={() => { tapLight(); smooth(); set({ f: k }); }} accessibilityRole="tab" accessibilityState={{ selected: on }} label={label + ' ' + n}
              style={{ height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: on ? c.text : c.surface, justifyContent: 'center' }}>
              <T size={15} weight={600} color={on ? c.bg : c.text}>{label} {n}</T>
            </Tap>
          );
        })}
      </ScrollView>
      {rows.length > 0 ? (
        <Anim type="rise" delay={80} style={{ marginTop: 16, backgroundColor: c.surface, borderRadius: 24, overflow: 'hidden' }}>
          {rows.map((s, i) => {
            const L = look(s); const b = bal(s);
            return (
              <Tap key={s.id} onPress={() => go('student', { sel: s.id })} scaleTo={0.98} label={s.name + ', ' + rs(b) + ', ' + L.chip}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16, minHeight: 76, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                <Avatar ini={initials(s.name)} size={46} bg={L.avBg} fg={L.avFg} fontSize={16} />
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                  <T size={17} weight={600} numberOfLines={1}>{s.name}</T>
                  <T size={14} color={c.text2} numberOfLines={1}>{s.hostel} · {s.room}</T>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <T size={18} weight={700} face="display" color={b > 0 ? c.text : c.text2}>{rs(b)}</T>
                  <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, backgroundColor: L.chipBg }}>
                    <T size={12} weight={700} color={L.chipFg}>{L.chip}</T>
                  </View>
                </View>
              </Tap>
            );
          })}
        </Anim>
      ) : (
        <Anim type="pop" style={{ marginTop: 16, backgroundColor: c.surface, borderRadius: 24, paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center', gap: 8 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="search" size={28} color={c.text2} />
          </View>
          <T size={22} weight={700} face="display">No match</T>
          <T size={15} color={c.text2}>Try another name.</T>
          <Tap onPress={() => { smooth(); set({ q: '', f: 'all' }); }} label="Clear search"
            style={{ marginTop: 8, height: 48, paddingHorizontal: 22, borderRadius: 24, backgroundColor: c.primarySoft, justifyContent: 'center' }}>
            <T size={16} weight={600} color={c.primaryInk}>Clear search</T>
          </Tap>
        </Anim>
      )}
    </ScrollView>
  );
}

// ───────────────────────── 09 Profile
const THEMES: ['light' | 'dark' | 'system', string][] = [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']];

export function Profile() {
  const { state, set, resetDemo, signOut } = useStore();
  const { c } = useLook();
  const { top } = useSafe();
  const sizeIdx = Math.max(0, sizes.indexOf(state.size));
  const preview = state.students.find((s) => s.id === DEMO_ID);
  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top + 8, paddingHorizontal: 16, paddingBottom: 130 }}>
      <Anim type="rise" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 4 }}>
        <OwnerAvatar ini={(state.ownerName || 'S').trim()[0]?.toUpperCase() || 'S'} size={64} fontSize={26} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T size={28} weight={800} face="display" ls={-0.02} accessibilityRole="header" numberOfLines={2}>{state.ownerName || 'Sampath'}</T>
          <T size={15} color={c.text2}>Kameng Hostel Shop</T>
        </View>
      </Anim>

      <T size={15} weight={700} color={c.text2} style={{ marginTop: 26, marginBottom: 10, marginHorizontal: 4 }}>Display & Accessibility</T>
      <Anim type="rise" delay={80} style={{ backgroundColor: c.surface, borderRadius: 22, padding: 16, gap: 18 }}>
        <View style={{ gap: 10 }}>
          <T size={17} weight={600}>Theme</T>
          <Segmented label="Theme" options={THEMES} value={state.theme} onChange={(k) => { tapLight(); set({ theme: k }); }}
            height={48} radius={12} track={c.surface2} thumb={c.surface} thumbShadow
            render={(k, l) => (<><Icon name={k} size={18} color={c.text} /><T size={15} weight={600}>{l}</T></>)} />
        </View>
        <View style={{ height: 1, backgroundColor: c.line }} />
        <View style={{ gap: 10 }}>
          <T size={17} weight={600}>Text size</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <T fixed size={14} weight={700} color={c.text2}>A</T>
            <StepSlider value={sizeIdx} onChange={(i) => { tapLight(); set({ size: sizes[i] }); }} />
            <T fixed size={22} weight={700} color={c.text2}>A</T>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {['Regular', 'Medium', 'Large'].map((l, i) => (
              <Tap key={l} onPress={() => { tapLight(); set({ size: sizes[i] }); }} accessibilityState={{ selected: i === sizeIdx }} label={l + ' text'}
                style={{ flex: 1, paddingVertical: 6, alignItems: i === 0 ? 'flex-start' : i === 1 ? 'center' : 'flex-end' }}>
                <T size={14} weight={i === sizeIdx ? 700 : 500} color={i === sizeIdx ? c.primaryInk : c.text2}>{l}</T>
              </Tap>
            ))}
          </View>
          <View accessibilityLabel="Preview" style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: c.bg, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar ini="AB" size={42} bg={c.amberSoft} fg={c.amber} fontSize={16} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <T size={17} weight={600}>Ankur Bora</T>
              <T size={14} color={c.text2}>Kameng · B-214</T>
            </View>
            <T size={20} weight={800} face="display">{rs(preview ? bal(preview) : 380)}</T>
          </View>
        </View>
      </Anim>

      <T size={15} weight={700} color={c.text2} style={{ marginTop: 26, marginBottom: 10, marginHorizontal: 4 }}>Settings</T>
      <Anim type="rise" delay={140} style={{ backgroundColor: c.surface, borderRadius: 22, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 64 }}>
          <T size={17} weight={600}>Language</T>
          <View style={{ width: 200 }}>
            <Segmented label="Language" options={[['en', 'English'], ['as', 'অসমীয়া']]} value={state.lang} onChange={(k) => { tapLight(); set({ lang: k }); }}
              height={38} radius={10} track={c.surface2} thumb={c.surface} thumbShadow
              render={(_, l) => <T size={14} weight={600} numberOfLines={1}>{l}</T>} />
          </View>
        </View>
        <Tap onPress={resetDemo} label="Reset demo" scaleTo={0.98}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, minHeight: 60, borderTopWidth: 1, borderTopColor: c.line }}>
          <T size={17} weight={600}>Reset demo</T>
          <Icon name="chevron" size={20} color={c.text3} />
        </Tap>
      </Anim>
      <Tap onPress={signOut} label="Sign out" style={{ marginTop: 20, height: 56, borderRadius: 28, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
        <T size={17} weight={600} color={c.red}>Sign out</T>
      </Tap>
    </ScrollView>
  );
}

/** Three-step slider: drag or tap the track; the thumb springs to the nearest step. */
function StepSlider({ value, onChange }: { value: number; onChange: (i: number) => void }) {
  const { c } = useLook();
  const [w, setW] = useState(0);
  const x = useState(() => new Animated.Value(0))[0];
  const wRef = useRef(0);
  const valRef = useRef(value);
  const cb = useRef(onChange);
  useEffect(() => { valRef.current = value; cb.current = onChange; });
  const TH = 28;
  const usable = Math.max(0, w - TH);
  useEffect(() => {
    if (!usable) return;
    Animated.spring(x, { toValue: (value / 2) * usable, useNativeDriver: false, bounciness: 8, speed: 18 }).start();
  }, [value, usable, x]);
  // Refs are only read inside gesture callbacks, never during render.
  // eslint-disable-next-line react-hooks/refs
  const pan = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => { const u = wRef.current - TH; x.setValue(Math.min(Math.max(e.nativeEvent.locationX - TH / 2, 0), u)); },
    onPanResponderMove: (e) => { const u = wRef.current - TH; x.setValue(Math.min(Math.max(e.nativeEvent.locationX - TH / 2, 0), u)); },
    onPanResponderRelease: (e) => {
      const u = wRef.current - TH;
      const pos = Math.min(Math.max(e.nativeEvent.locationX - TH / 2, 0), u);
      const i = Math.round((pos / (u || 1)) * 2);
      if (i !== valRef.current) cb.current(i);
      else Animated.spring(x, { toValue: (i / 2) * u, useNativeDriver: false, bounciness: 8 }).start();
    },
  }))[0];
  const fillW = Animated.add(x, TH / 2);
  return (
    <View {...pan.panHandlers} onLayout={(e) => { wRef.current = e.nativeEvent.layout.width; setW(e.nativeEvent.layout.width); }}
      accessible accessibilityRole="adjustable" accessibilityLabel="Text size" accessibilityValue={{ text: ['Regular', 'Medium', 'Large'][value] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => { const d = e.nativeEvent.actionName === 'increment' ? 1 : -1; const n = Math.min(2, Math.max(0, value + d)); if (n !== value) onChange(n); }}
      style={{ flex: 1, height: 32, justifyContent: 'center' }}>
      <View pointerEvents="none" style={{ height: 4, borderRadius: 2, backgroundColor: c.surface2, marginHorizontal: TH / 2 }} />
      {[0, 1, 2].map((i) => (
        <View key={i} pointerEvents="none" style={{ position: 'absolute', left: TH / 2 - 3 + (i / 2) * usable, width: 6, height: 6, borderRadius: 3, backgroundColor: c.text3 }} />
      ))}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: c.primary, width: fillW }} />
      <Animated.View pointerEvents="none" style={{
        position: 'absolute', left: 0, width: TH, height: TH, borderRadius: TH / 2, backgroundColor: '#FFFFFF',
        shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)',
        transform: [{ translateX: x }],
      }} />
    </View>
  );
}

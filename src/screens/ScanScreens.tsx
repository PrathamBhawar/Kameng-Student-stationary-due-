import React, { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Path } from 'react-native-svg';
import { Anim } from '../anim';
import { Avatar, DismissKeyboard, Icon, PillButton, RadialBg, T, Tap } from '../components/ui';
import { BackBtn, Barcode } from '../components/parts';
import { bal, initials, prettyPhone, rs, NEW_ID } from '../data';
import { grad } from '../theme';
import { ScanState, tapLight, useLook, useStore } from '../store';
import { useSafe } from '../safe';
import { useStatusLook } from './Home';
import { HostelPicker } from './StudentScreens';

const ScanBg = ({ cy = '36%' }: { cy?: string }) => (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: '#06080C' }]} pointerEvents="none">
    <RadialBg stops={grad.scan} cx="50%" cy={cy} rx="90%" ry="60%" />
  </View>
);

const roundRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

const ERRS: Record<'invalid' | 'denied', [string, string, string]> = {
  invalid: ['Can’t read', 'Hold steady, try again.', 'Try again'],
  denied: ['Camera off', 'Allow camera in Settings.', 'Open Settings'],
};

// ───────────────────────── 10 Scan ID / 12 ID not found
export function Scan() {
  const { state, set, back, go, tab, startScanRead, handleScan } = useStore();
  const { c } = useLook();
  const { top, bottom, width, height, k } = useSafe();
  const ss = state.scanState;
  const live = ss === 'ready' || ss === 'reading';
  const reading = ss === 'reading';
  const fx = 36, fy = (top + 232) * k, fw = width - 72, fh = 140;
  const torch = useState(() => new Animated.Value(state.torch ? 1 : 0))[0];
  useEffect(() => { Animated.timing(torch, { toValue: state.torch ? 1 : 0, duration: 250, useNativeDriver: true }).start(); }, [state.torch, torch]);
  const frameGlow = useState(() => new Animated.Value(0))[0];
  useEffect(() => { Animated.timing(frameGlow, { toValue: reading ? 1 : 0, duration: 300, useNativeDriver: false }).start(); }, [reading, frameGlow]);

  // Real camera on iPhone; the web preview keeps the illustrated ID card.
  const [perm, requestPerm] = useCameraPermissions();
  const native = Platform.OS !== 'web';
  useEffect(() => {
    if (!native || !perm) return;
    if (!perm.granted && perm.canAskAgain) requestPerm();
    else if (!perm.granted) set({ scanState: 'denied' });
  }, [perm?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  const camOn = native && !!perm?.granted;

  const errAct = (s: ScanState) => {
    if (s === 'invalid') set({ scanState: 'ready' });
    else if (s === 'denied') {
      if (perm && !perm.granted && perm.canAskAgain) requestPerm().then((r) => r.granted && set({ scanState: 'ready' }));
      else Linking.openSettings().catch(() => {});
    }
  };
  /** Unreadable barcode: type the ID from the card instead. */
  const enterIdManually = () =>
    go('newStudent', { scanState: 'ready', scannedId: '', ns: { name: '', room: '', phone: '', hostel: state.shopHostel }, nsTouched: false, nsIdEditable: true });
  const er = !live ? ERRS[ss as keyof typeof ERRS] : null;
  // Demo IDs: a saved student, and an ID nobody has saved yet.
  const newDemoId = () => { let n = Number(NEW_ID); while (state.students.some((x) => x.id === String(n))) n += 1; return String(n); };
  const demo: [string, ScanState | 'known' | 'new'][] = [['Saved student', 'known'], ['New ID', 'new'], ['Unreadable', 'invalid'], ['No camera', 'denied']];

  return (
    <View style={{ flex: 1 }}>
      <ScanBg />
      {camOn ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" enableTorch={state.torch}
          barcodeScannerSettings={{ barcodeTypes: ['code128', 'code39', 'code93', 'codabar', 'ean13', 'ean8', 'itf14', 'upc_a', 'upc_e', 'qr', 'pdf417', 'datamatrix'] }}
          onBarcodeScanned={ss === 'ready' ? (r) => handleScan(r.data) : undefined} />
      ) : null}
      {/* The ID card being "seen" by the camera (shown when there is no live camera) */}
      {camOn ? null : <View pointerEvents="none" style={{ position: 'absolute', left: width / 2 - 120, top: (top + 96) * k, width: 240, height: 400, borderRadius: 40, backgroundColor: '#1A1F2A', borderWidth: 6, borderColor: '#252B37', opacity: live ? 0.85 : 0.3, alignItems: 'center', paddingTop: 30, gap: 12 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#343C4C' }} />
        <View style={{ width: 130, height: 12, borderRadius: 6, backgroundColor: '#343C4C' }} />
        <View style={{ marginTop: 26, width: 196, height: 92, borderRadius: 12, backgroundColor: '#E8EBF0', paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row' }}>
          <Barcode color="#1A1F2A" gap={3} />
        </View>
      </View>}
      {/* Torch light */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: camOn ? 0 : torch }]}>
        <RadialBg stops={[[0, 'rgba(255,250,235,0.32)'], [0.6, 'rgba(255,250,235,0.08)'], [1, 'rgba(255,250,235,0)']]} cx="50%" cy="40%" rx="70%" ry="45%" />
      </Animated.View>

      {live ? (
        <>
          <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
            <Path fillRule="evenodd" fill="rgba(6,8,12,0.55)" d={`M0 0H${width}V${height}H0Z ${roundRect(fx, fy, fw, fh, 20)}`} />
          </Svg>
          <Tap onPress={() => { if (ss === 'ready' && !camOn) startScanRead(); }} label={camOn ? 'Scanning. Point at the ID barcode' : 'Scan barcode (demo)'} scaleTo={0.98}
            style={{ position: 'absolute', left: fx, top: fy, width: fw, height: fh, borderRadius: 20 }}>
            <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, borderWidth: 3, borderColor: frameGlow.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#8FA8FF'] }) }} />
            <Anim type="laser" span={fw * 0.88} pointerEvents="none"
              style={{ position: 'absolute', top: 10, bottom: 10, left: fw / 2 - 1.5, width: 3, borderRadius: 2, backgroundColor: '#8FA8FF', shadowColor: '#8FA8FF', shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }} />
          </Tap>
          <View style={{ position: 'absolute', left: 24, right: 24, top: fy + fh + 22, alignItems: 'center', gap: 6 }}>
            <T size={20} weight={700} color="#FFFFFF" center>{reading ? 'Reading…' : 'Scan ID'}</T>
            <T size={16} color="rgba(255,255,255,0.8)" center>{reading ? 'Hold still' : 'Fit barcode in frame'}</T>
          </View>
        </>
      ) : null}

      {er ? (
        <Anim type="pop" replayKey={ss} style={{ position: 'absolute', left: 24, right: 24, top: (top + 166) * k, alignItems: 'center', gap: 10, paddingVertical: 28, paddingHorizontal: 20, borderRadius: 28, backgroundColor: 'rgba(18,22,31,0.96)' }}>
          <View accessibilityRole="alert" style={{ alignItems: 'center', gap: 10, alignSelf: 'stretch' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="alert" size={30} color="#FFB4AB" />
            </View>
            <T size={24} weight={800} face="display" color="#FFFFFF" center>{er[0]}</T>
            <T size={16} color="rgba(255,255,255,0.8)" center>{er[1]}</T>
            <PillButton title={er[2]} onPress={() => errAct(ss)} bg="#FFFFFF" fg="#0B0F19" height={54} style={{ marginTop: 8, alignSelf: 'stretch' }} />
            {ss === 'invalid' ? (
              <PillButton title="Enter ID manually" onPress={enterIdManually} bg="rgba(255,255,255,0.14)" fg="#FFFFFF" height={54} style={{ alignSelf: 'stretch' }} />
            ) : null}
          </View>
        </Anim>
      ) : null}

      <View style={{ position: 'absolute', top: top + 2, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tap onPress={back} label="Close scanner" scaleTo={0.9} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={22} color="#FFFFFF" sw={2.2} />
        </Tap>
        <T size={18} weight={700} color="#FFFFFF">Scan ID</T>
        <Tap onPress={() => { tapLight(); set({ torch: !state.torch }); }} label="Torch" accessibilityState={{ selected: state.torch }} scaleTo={0.9}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: state.torch ? '#FFFFFF' : 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="torch" size={22} color={state.torch ? '#0B0F19' : '#FFFFFF'} />
        </Tap>
      </View>

      <Anim type="sheet" span={200} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 14, paddingHorizontal: 16, paddingBottom: Math.max(bottom, 16), borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: c.bg, gap: 10 }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.line, alignSelf: 'center' }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: 6 }}>
          <T size={13} weight={700} color={c.text2} style={{ marginRight: 2 }}>Demo</T>
          {demo.map(([label, kk]) => (
            <Tap key={label} label={'Demo: ' + label} scaleTo={0.94}
              onPress={() => {
                if (state.scanState === 'reading') return;
                if (kk === 'known') startScanRead();
                else if (kk === 'new') startScanRead(newDemoId());
                else { tapLight(); set({ scanState: kk }); }
              }}
              style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: c.surface, justifyContent: 'center' }}>
              <T size={13} weight={600}>{label}</T>
            </Tap>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <PillButton title="Search" onPress={() => tab('students')} bg={c.surface} fg={c.text} height={54} style={{ flex: 1 }} label="Search students instead">
            <Icon name="search" size={20} color={c.text} />
          </PillButton>
          <PillButton title="Visitor" onPress={() => go('visitor')} bg={c.surface} fg={c.text} height={54} style={{ flex: 1 }} label="Add a visitor with no ID">
            <Icon name="profile" size={20} color={c.text} />
          </PillButton>
        </View>
      </Anim>
    </View>
  );
}

// ───────────────────────── 11 Student found
export function Verify() {
  const { state, back, find, landOnStudent } = useStore();
  const { c, t } = useLook();
  const { top, bottom, height, k } = useSafe();
  const s = find(state.sel);
  const b = bal(s);
  const L = useStatusLook()(s);
  const rows: [string, string, number, 600 | 700][] = [['Student ID', s.id, 16, 600], ['Hostel', s.hostel, 16, 600], ['Room', s.room, 16, 600], ['Phone', prettyPhone(s.phone), 18, 700]];
  const sheetTop = (top + 142) * k;
  return (
    <View style={{ flex: 1 }}>
      <ScanBg cy="30%" />
      <View pointerEvents="none" style={{ position: 'absolute', left: 36, right: 36, top: (top + 86) * k, height: 110, borderRadius: 20, borderWidth: 4, borderColor: '#8FA8FF' }} />
      <Anim type="sheet" span={height - sheetTop}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: sheetTop, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: c.bg, paddingTop: 14, paddingHorizontal: 16, paddingBottom: Math.max(bottom, 16) }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.line, alignSelf: 'center' }} />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <View>
              <Avatar ini={initials(s.name)} size={62} bg={L.avBg} fg={L.avFg} fontSize={22} face="display" weight={800} />
              <Anim type="pop" delay={300} style={{ position: 'absolute', right: -4, bottom: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: c.green, borderWidth: 3, borderColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={13} color="#FFFFFF" sw={3} />
              </Anim>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <T size={14} weight={700} color={c.green}>Student found</T>
              <T size={28} weight={800} face="display" ls={-0.02} accessibilityRole="header">{s.name}</T>
            </View>
          </View>
          <View style={{ marginTop: 16, backgroundColor: c.surface, borderRadius: 22, overflow: 'hidden' }}>
            {rows.map(([kk, v, size, w], i) => (
              <View key={kk} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, minHeight: 56, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                <T size={15} color={c.text2}>{kk}</T>
                <T size={size} weight={w} style={{ textAlign: 'right', flexShrink: 1 }}>{v}</T>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 20, backgroundColor: b > 0 ? c.amberSoft : c.greenSoft }}>
            <T size={15} weight={700} color={b > 0 ? c.amber : c.green}>Owes</T>
            <T size={26} weight={800} face="display" color={b > 0 ? c.amber : c.green}>{rs(b)}</T>
          </View>
        </ScrollView>
        <View style={{ gap: 10, marginTop: 12 }}>
          <PillButton title={t.addDue} onPress={() => landOnStudent(s.id, '', 'addDue')} bg={c.primary} fg="#FFFFFF" />
          <PillButton title="View profile" onPress={() => landOnStudent(s.id, '')} bg={c.surface2} fg={c.text} />
          <Tap onPress={back} label="Scan again" style={{ padding: 6, alignItems: 'center' }}>
            <T size={15} weight={600} color={c.primaryInk}>Scan again</T>
          </Tap>
        </View>
      </Anim>
    </View>
  );
}

// ───────────────────────── 13 New student
export function NewStudent() {
  const { state, set, back, tab, landOnStudent } = useStore();
  const { c, fs, isDark } = useLook();
  const { top, bottom } = useSafe();
  const ns = state.ns;
  // The ID is always editable: filled in from a scan (correct it if it's wrong) or typed after an unreadable one.
  const manual = state.nsIdEditable;
  const id = state.scannedId;
  const idOk = /^\d{6,12}$/.test(id);
  const already = idOk ? state.students.find((s) => s.id === id) : undefined;
  const ok = !!ns.name.trim() && !!ns.room.trim() && idOk && !already;
  const nameErr = state.nsTouched && !ns.name.trim();
  const idErr = (id.length > 0 || state.nsTouched) && !idOk ? 'Enter the 6–12 digit ID from the card' : null;
  const setNs = (p: Partial<typeof ns>) => set({ ns: { ...state.ns, ...p } });
  const save = () => {
    if (!ok) { set({ nsTouched: true }); return; }
    const exists = state.students.some((s) => s.id === id);
    const fresh = { id, name: ns.name.trim(), hostel: ns.hostel, room: ns.room.trim(), phone: ns.phone.length === 10 ? ns.phone : '', since: 0, tx: [] };
    const students = exists ? state.students.map((s) => s.id === id ? { ...s, ...fresh, tx: s.tx } : s) : state.students.concat([fresh]);
    set({ students });
    landOnStudent(id, 'Student saved', 'addDue');
  };
  const input = (extra: object = {}) => ({
    height: 54, borderRadius: 14, backgroundColor: c.surface, color: c.text, fontFamily: 'Inter_400Regular', fontSize: fs(17), paddingHorizontal: 16, ...extra,
  });
  const ka = isDark ? 'dark' : 'light';
  return (
    <DismissKeyboard>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1, paddingTop: top + 2, paddingHorizontal: 16, paddingBottom: Math.max(bottom - 2, 16) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          <BackBtn color={c.text} onPress={back} style={{ marginLeft: -6 }} />
          <Tap onPress={() => tab('overview')} label="Cancel" style={{ paddingVertical: 10, paddingHorizontal: 2 }}><T size={17} weight={600} color={c.primaryInk}>Cancel</T></Tap>
        </View>
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Anim type="rise" style={{ marginTop: 6 }}><T size={34} weight={800} face="display" ls={-0.03} accessibilityRole="header">New student</T></Anim>
          <T size={16} color={c.text2} style={{ marginTop: 6 }}>{manual ? 'Barcode unreadable. Type the ID.' : 'ID found, details missing.'}</T>
          <Anim type="rise" delay={80} style={{ marginTop: 18, gap: 14 }}>
            <View style={{ gap: 6 }}>
              <T size={15} weight={600}>Student ID</T>
              <TextInput accessibilityLabel="Student ID" value={state.scannedId} placeholder="e.g. 230101015" placeholderTextColor={c.text3}
                onChangeText={(v) => set({ scannedId: v.replace(/\D/g, '').slice(0, 12) })} keyboardType="number-pad" autoFocus={manual}
                keyboardAppearance={ka} style={input({ fontFamily: 'Inter_600SemiBold', borderWidth: 2, borderColor: idErr || already ? c.red : 'transparent' })} />
              {idErr ? <T accessibilityRole="alert" size={14} weight={600} color={c.red}>{idErr}</T> : null}
              {already ? (
                <View accessibilityRole="alert" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: c.primarySoft }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T size={14} weight={700} color={c.primaryInk}>Already saved</T>
                    <T size={14} color={c.text} numberOfLines={1}>{already.name} · {already.hostel} {already.room}</T>
                  </View>
                  <Tap onPress={() => landOnStudent(already.id, '')} label={'Open ' + already.name} style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: c.primary, justifyContent: 'center' }}>
                    <T size={14} weight={600} color="#FFFFFF">Open</T>
                  </Tap>
                </View>
              ) : null}
            </View>
            <View style={{ gap: 6 }}>
              <T size={15} weight={600}>Full name</T>
              <TextInput accessibilityLabel="Full name" placeholder="As on ID" placeholderTextColor={c.text3} value={ns.name}
                onChangeText={(v) => set({ ns: { ...state.ns, name: v }, nsTouched: true })} autoCapitalize="words" keyboardAppearance={ka}
                style={input({ borderWidth: 2, borderColor: nameErr ? c.red : 'transparent' })} />
              {nameErr ? <T accessibilityRole="alert" size={14} weight={600} color={c.red}>Name needed</T> : null}
            </View>
            <View style={{ gap: 6 }}>
              <T size={15} weight={600}>Hostel</T>
              <HostelPicker value={ns.hostel} onPick={(h) => setNs({ hostel: h })} h={42} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                <T size={15} weight={600}>Room</T>
                <TextInput accessibilityLabel="Room" placeholder="B-214" placeholderTextColor={c.text3} value={ns.room}
                  onChangeText={(v) => setNs({ room: v.toUpperCase().slice(0, 6) })} autoCapitalize="characters" autoCorrect={false} keyboardAppearance={ka} style={input()} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
                <T size={15} weight={600}>Phone</T>
                <TextInput accessibilityLabel="Phone" placeholder="10 digits" placeholderTextColor={c.text3} value={ns.phone} keyboardType="number-pad"
                  onChangeText={(v) => setNs({ phone: v.replace(/\D/g, '').slice(0, 10) })} keyboardAppearance={ka} style={input()} />
              </View>
            </View>
          </Anim>
        </ScrollView>
        {already ? (
          <PillButton title={'Open ' + already.name.split(' ')[0] + '’s profile'} onPress={() => landOnStudent(already.id, '')} bg={c.primary} fg="#FFFFFF" style={{ marginTop: 12 }} />
        ) : (
          <PillButton title="Save & add due" disabled={!ok} onPress={save} bg={ok ? c.primary : c.disBg} fg={ok ? '#FFFFFF' : c.disFg} style={{ marginTop: 12 }} />
        )}
      </View>
    </KeyboardAvoidingView>
    </DismissKeyboard>
  );
}


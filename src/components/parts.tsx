import React, { useEffect, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Linking, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafe } from '../safe';
import { Glass, Icon, T, Tap } from './ui';
import { Screen, firstName, useLook, useStore } from '../store';
import { bal, rs } from '../data';
import { reducedMotion, SHEET_EASE } from '../anim';

/** Back arrow. `onDark` = white on gradient screens. */
export function BackBtn({ color, onPress, circle, style }: { color: string; onPress: () => void; circle?: string; style?: any }) {
  return (
    <Tap onPress={onPress} label="Back" scaleTo={0.9}
      style={[{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: circle ?? 'transparent' }, style]}>
      <Icon name="back" size={circle ? 22 : 24} color={color} sw={2.2} />
    </Tap>
  );
}

const BAR_W = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2];
export function Barcode({ color, gap, scale = 1 }: { color: string; gap: number; scale?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', gap, flex: 1 }}>
      {BAR_W.map((w, i) => <View key={i} style={{ width: w * scale, backgroundColor: color }} />)}
    </View>
  );
}

const OTP_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
const AMT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'];

export function Keypad({ kind }: { kind: 'otp' | 'amt' }) {
  const { press } = useStore();
  const { c } = useLook();
  const keys = kind === 'otp' ? OTP_KEYS : AMT_KEYS;
  const key = (k: string, i: number) => {
    const plain = k === '' || k === 'del' || k === '00';
    const bg = kind === 'otp' ? (k === '' || k === 'del' ? 'transparent' : 'rgba(255,255,255,0.12)') : (plain ? 'transparent' : c.keyBg);
    const fg = kind === 'otp' ? '#FFFFFF' : c.text;
    return (
      <Tap key={i} disabled={k === ''} onPress={() => k && press(k)} scaleTo={0.92}
        label={k === 'del' ? 'Delete' : k || 'Blank'}
        style={{
          flex: 1, height: kind === 'otp' ? 54 : 50, borderRadius: kind === 'otp' ? 16 : 14,
          backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
          shadowColor: kind === 'amt' && !plain ? c.keySh : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 0,
        }}>
        {k === 'del' ? <Icon name="del" size={28} color={fg} sw={1.9} /> : <T fixed size={kind === 'otp' ? 26 : 24} weight={600} face="display" color={fg}>{k}</T>}
      </Tap>
    );
  };
  return (
    <View style={{ gap: 6 }}>
      {[0, 3, 6, 9].map((r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 6 }}>{keys.slice(r, r + 3).map((k, i) => key(k, r + i))}</View>
      ))}
    </View>
  );
}

/** Bottom toast: springs up, waits, fades away. */
export function Toast({ bottom }: { bottom: number }) {
  const { state } = useStore();
  const { c } = useLook();
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(v, { toValue: state.toastOn ? 1 : 0, duration: state.toastOn ? 400 : 250, easing: Easing.bezier(0.2, 0.9, 0.25, 1.15), useNativeDriver: true }).start();
  }, [state.toastOn, state.toastSeq, v]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center' }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        style={{
          marginBottom: bottom, maxWidth: 340, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 22,
          backgroundColor: c.toastBg, flexDirection: 'row', alignItems: 'center', gap: 8,
          shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15, shadowOffset: { width: 0, height: 10 },
          opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
        }}>
        <Icon name="check" size={18} color={c.toastIcon} sw={2.6} />
        <T size={15} weight={600} color={c.toastFg} numberOfLines={1} style={{ maxWidth: 290 }}>{state.toast}</T>
      </Animated.View>
    </View>
  );
}

const TABS: Screen[] = ['overview', 'students', 'profile'];

/** Floating glass tab bar with a sliding selection pill, plus the separate Scan circle. */
export function TabBar() {
  const { state, tab, go } = useStore();
  const { c, t, isDark } = useLook();
  const insets = useSafe();
  const scr = state.stack[state.stack.length - 1];
  const idx = Math.max(0, TABS.indexOf(scr));
  const onHome = scr === 'overview';
  const [w, setW] = useState(0);
  const x = useState(() => new Animated.Value(idx))[0];
  useEffect(() => {
    if (reducedMotion()) { x.setValue(idx); return; }
    Animated.spring(x, { toValue: idx, useNativeDriver: true, speed: 18, bounciness: 7 }).start();
  }, [idx, x]);
  const tb = onHome
    ? { bg: 'rgba(22,26,60,0.62)', onBg: 'rgba(255,255,255,0.16)', onFg: '#FFFFFF', offFg: 'rgba(255,255,255,0.7)', fabBg: '#FFFFFF', fabFg: '#1424B8', border: 'rgba(255,255,255,0.08)', darkBlur: true }
    : { bg: c.tabBg, onBg: c.primarySoft, onFg: c.primaryInk, offFg: c.text2, fabBg: c.primary, fabFg: '#FFFFFF', border: 'transparent', darkBlur: isDark };
  const bottom = Math.max(insets.bottom - 6, 16);
  const tabW = w ? (w - 10) / 3 : 0;
  return (
    <>
      <View style={{ position: 'absolute', left: 16, right: 96, bottom, height: 66, borderRadius: 33, shadowColor: '#000', shadowOpacity: onHome ? 0.45 : 0.14, shadowRadius: 15, shadowOffset: { width: 0, height: 10 } }}>
        <Glass tint={tb.bg} intensity={40} dark={tb.darkBlur} radius={33} style={{ flex: 1, borderWidth: 1, borderColor: tb.border }}>
          <View accessibilityRole="tablist" onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} style={{ flex: 1, flexDirection: 'row', padding: 5 }}>
            {tabW > 0 && (
              <Animated.View pointerEvents="none" style={{
                position: 'absolute', top: 5, bottom: 5, left: 5, width: tabW, borderRadius: 28, backgroundColor: tb.onBg,
                transform: [{ translateX: x.interpolate({ inputRange: [0, 2], outputRange: [0, tabW * 2] }) }],
              }} />
            )}
            {TABS.map((k) => {
              const on = scr === k;
              return (
                <Tap key={k} onPress={() => tab(k)} scaleTo={0.92} label={t[k as 'overview']} accessibilityRole="tab" accessibilityState={{ selected: on }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 28 }}>
                  <Icon name={k as 'overview'} size={24} color={on ? tb.onFg : tb.offFg} sw={1.9} />
                  <T size={12} weight={600} color={on ? tb.onFg : tb.offFg} numberOfLines={1}>{t[k as 'overview']}</T>
                </Tap>
              );
            })}
          </View>
        </Glass>
      </View>
      <Tap onPress={() => go('scan', { scanState: 'ready' })} label="Scan student ID" scaleTo={0.9}
        style={{
          position: 'absolute', right: 16, bottom, width: 66, height: 66, borderRadius: 33, backgroundColor: tb.fabBg,
          alignItems: 'center', justifyContent: 'center', gap: 1,
          shadowColor: onHome ? '#000' : '#2B4CFF', shadowOpacity: onHome ? 0.45 : 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 12 },
        }}>
        <Icon name="scan" size={26} color={tb.fabFg} sw={1.9} />
        <T size={11} weight={700} color={tb.fabFg}>{t.scan}</T>
      </Tap>
    </>
  );
}

/** "Remind Student" bottom sheet: WhatsApp or Call. Drag down or tap outside to close. */
export function RemindSheet() {
  const { state, closeRemind, find, toast } = useStore();
  const { c } = useLook();
  const insets = useSafe();
  const open = state.sheet;
  const [mounted, setMounted] = useState(open);
  // Mount as soon as it opens (state adjusted during render); unmount after the close animation.
  if (open && !mounted) setMounted(true);
  const v = useState(() => new Animated.Value(0))[0];
  const drag = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (open) {
      drag.setValue(0);
      Animated.timing(v, { toValue: 1, duration: reducedMotion() ? 0 : 380, easing: SHEET_EASE, useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(v, { toValue: 0, duration: reducedMotion() ? 0 : 280, easing: Easing.in(Easing.ease), useNativeDriver: true })
        .start(() => setMounted(false));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pan = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
    onPanResponderRelease: (_, g) => {
      if (g.dy > 90 || g.vy > 0.8) closeRemind();
      else Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    },
  }))[0];

  if (!mounted) return null;
  const s = find(state.sel);
  const ph = s.phone;
  const msg = 'Hi ' + s.name.split(' ')[0] + ', this is ' + firstName(state.ownerName) + ' from Kameng Hostel shop. Your balance is ' + rs(bal(s)) + '. Please check. Thank you.';
  const openUrl = async (url: string, fallback: string | null, ok: string, fail: string) => {
    closeRemind();
    try {
      await Linking.openURL(url);
      toast(ok);
    } catch {
      if (fallback) {
        try { await Linking.openURL(fallback); toast(ok); return; } catch {}
      }
      toast(fail);
    }
  };
  const row = (label: string, icon: 'whatsapp' | 'call', circle: string, onPress: () => void) => (
    <Tap onPress={onPress} label={label} scaleTo={0.97}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, minHeight: 68, borderRadius: 20, backgroundColor: c.bg }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: circle, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={icon === 'call' ? 22 : 24} color="#FFFFFF" />
      </View>
      <T size={18} weight={600}>{label}</T>
    </Tap>
  );
  const ty = Animated.add(v.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }), drag);
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: v }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={closeRemind} style={[StyleSheet.absoluteFill, { backgroundColor: c.dim }]} />
      </Animated.View>
      <Animated.View {...pan.panHandlers} accessibilityViewIsModal
        style={{
          position: 'absolute', left: 8, right: 8, bottom: Math.max(insets.bottom - 26, 8), borderRadius: 34, backgroundColor: c.surface,
          paddingTop: 12, paddingHorizontal: 16, paddingBottom: 24, transform: [{ translateY: ty }],
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: -10 },
        }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.line, alignSelf: 'center' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <T size={24} weight={800} face="display" ls={-0.02} accessibilityRole="header">Remind Student</T>
          <Tap onPress={closeRemind} label="Close" scaleTo={0.9} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={20} color={c.text} sw={2.2} />
          </Tap>
        </View>
        {!ph ? (
          <View accessibilityRole="alert" style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.redSoft }}>
            <T size={15} weight={600} color={c.red}>No phone number saved</T>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 16 }}>
            {row('WhatsApp', 'whatsapp', '#25D366', () => openUrl(
              'whatsapp://send?phone=91' + ph + '&text=' + encodeURIComponent(msg),
              'https://wa.me/91' + ph + '?text=' + encodeURIComponent(msg),
              'WhatsApp opened', 'Couldn’t open WhatsApp'))}
            {row('Call', 'call', c.primary, () => openUrl('tel:+91' + ph, null, 'Dialler opened', 'Calling not available'))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}


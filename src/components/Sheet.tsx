import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { reducedMotion, SHEET_EASE } from '../anim';
import { useSafe } from '../safe';
import { useLook } from '../store';
import { Icon, T, Tap } from './ui';

/**
 * Bottom sheet in the Remind sheet's style: slides up, closes on drag down or a tap outside.
 * Stays mounted through its close animation, then unmounts.
 */
export function Sheet({ open, onClose, title, children, dismissable = true }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; dismissable?: boolean;
}) {
  const { c } = useLook();
  const insets = useSafe();
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const v = useState(() => new Animated.Value(0))[0];
  const drag = useState(() => new Animated.Value(0))[0];
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  // The second tap of a double tap that opened the sheet must not land on the backdrop and close it.
  const openedAt = useRef(0);
  const onBackdrop = () => { if (dismissable && Date.now() - openedAt.current > 400) onClose(); };

  useEffect(() => {
    if (open) {
      openedAt.current = Date.now();
      drag.setValue(0);
      Animated.timing(v, { toValue: 1, duration: reducedMotion() ? 0 : 380, easing: SHEET_EASE, useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(v, { toValue: 0, duration: reducedMotion() ? 0 : 260, easing: Easing.in(Easing.ease), useNativeDriver: true })
        .start(() => setMounted(false));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/refs -- refs are read in gesture callbacks only
  const pan = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
    onPanResponderRelease: (_, g) => {
      if (g.dy > 90 || g.vy > 0.8) closeRef.current();
      else Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    },
  }))[0];

  if (!mounted) return null;
  const ty = Animated.add(v.interpolate({ inputRange: [0, 1], outputRange: [520, 0] }), drag);
  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: v }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onBackdrop}
          style={[StyleSheet.absoluteFill, { backgroundColor: c.dim }]} />
      </Animated.View>
      <Animated.View {...(dismissable ? pan.panHandlers : {})} accessibilityViewIsModal
        style={{
          position: 'absolute', left: 8, right: 8, bottom: Math.max(insets.bottom - 26, 8), borderRadius: 34, backgroundColor: c.surface,
          paddingTop: 12, paddingHorizontal: 16, paddingBottom: 20, transform: [{ translateY: ty }], maxHeight: '88%',
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: -10 },
        }}>
        <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.line, alignSelf: 'center' }} />
        {title ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
            <T size={24} weight={800} face="display" ls={-0.02} accessibilityRole="header" style={{ flex: 1 }}>{title}</T>
            {dismissable ? (
              <Tap onPress={onClose} label="Close" scaleTo={0.9} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="close" size={20} color={c.text} sw={2.2} />
              </Tap>
            ) : null}
          </View>
        ) : null}
        {children}
      </Animated.View>
    </View>
  );
}

/** Two stacked pill buttons, primary on top, as used by every confirm sheet. */
export function SheetButtons({ primary, onPrimary, secondary, onSecondary, primaryBg, primaryFg = '#FFFFFF' }: {
  primary: string; onPrimary: () => void; secondary?: string; onSecondary?: () => void; primaryBg?: string; primaryFg?: string;
}) {
  const { c } = useLook();
  return (
    <View style={{ gap: 4, marginTop: 16 }}>
      <Tap onPress={onPrimary} label={primary} style={{ height: 56, borderRadius: 28, backgroundColor: primaryBg ?? c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
        <T size={17} weight={600} color={primaryFg} numberOfLines={1}>{primary}</T>
      </Tap>
      {secondary ? (
        <Tap onPress={onSecondary} label={secondary} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <T size={16} weight={600} color={c.primaryInk}>{secondary}</T>
        </Tap>
      ) : null}
    </View>
  );
}

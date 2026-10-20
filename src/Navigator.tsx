import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { EASE, reducedMotion } from './anim';
import { Screen, useLook, useStore } from './store';
import { useSafe } from './safe';
import { RemindSheet, TabBar, Toast } from './components/parts';
import { Auth, Intro1, Intro2, Language, Name, Otp, SignIn, Splash } from './screens/Onboarding';
import { Overview, Profile, Students } from './screens/Home';
import { EditStudent, Money, StudentDetail } from './screens/StudentScreens';
import { NewStudent, Scan, Verify } from './screens/ScanScreens';
import { HostelPick } from './screens/Hostel';

const SCREENS: Record<Screen, React.ComponentType> = {
  splash: Splash, intro1: Intro1, intro2: Intro2, lang: Language, auth: Auth, signin: SignIn, otp: Otp, name: Name,
  hostel: HostelPick, overview: Overview, students: Students, profile: Profile, scan: Scan, verify: Verify, newStudent: NewStudent,
  student: StudentDetail, pay: Money, addDue: Money, edit: EditStudent,
};

// Screens drawn on a dark/blue ground get a light status bar.
const LIGHT_BAR: Screen[] = ['hostel', 'splash', 'intro1', 'intro2', 'lang', 'auth', 'signin', 'otp', 'name', 'overview', 'scan', 'verify', 'student'];
const TAB_SCREENS: Screen[] = ['overview', 'students', 'profile'];

export function Navigator() {
  const { state, back } = useStore();
  const { c, isDark } = useLook();
  const { bottom } = useSafe();
  const top = state.stack[state.stack.length - 1];
  const key = state.stack.length + ':' + top;
  const Comp = SCREENS[top];

  // Entering screen slides 18px from the side it came from and fades in (design: 300ms).
  const v = useState(() => new Animated.Value(1))[0];
  useEffect(() => {
    if (reducedMotion()) { v.setValue(1); return; }
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 300, easing: EASE, useNativeDriver: true }).start();
  }, [key, v]);
  const dir = state.dir;

  // iOS-style edge swipe to go back.
  const canBack = useRef(false);
  const backRef = useRef(back);
  useEffect(() => {
    canBack.current = state.stack.length > 1 && !state.sheet;
    backRef.current = back;
  });
  const drag = useState(() => new Animated.Value(0))[0];
  // Refs are only read inside gesture callbacks, never during render.
  // eslint-disable-next-line react-hooks/refs
  const pan = useState(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: (e) => canBack.current && e.nativeEvent.pageX < 24,
    onMoveShouldSetPanResponderCapture: (e, g) => canBack.current && e.nativeEvent.pageX - g.dx < 24 && g.dx > 8 && Math.abs(g.dy) < g.dx,
    onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dx)),
    onPanResponderRelease: (_, g) => {
      if (g.dx > 90 || g.vx > 0.6) { drag.setValue(0); backRef.current(); }
      else Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    },
    onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start(),
  }))[0];

  const showTabs = TAB_SCREENS.includes(top);
  const toastBottom = showTabs ? Math.max(bottom - 6, 16) + 82 : (top === 'pay' || top === 'addDue') ? 330 : top === 'hostel' ? Math.max(bottom, 16) + 76 : Math.max(bottom, 16) + 6;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }} {...pan.panHandlers}>
      <StatusBar style={LIGHT_BAR.includes(top) || isDark ? 'light' : 'dark'} animated />
      <Animated.View key={key} style={[StyleSheet.absoluteFill, {
        backgroundColor: c.bg,
        opacity: v,
        transform: [
          { translateX: Animated.add(v.interpolate({ inputRange: [0, 1], outputRange: [dir * 18, 0] }), drag.interpolate({ inputRange: [0, 400], outputRange: [0, 120], extrapolate: 'clamp' })) },
        ],
      }]}>
        <Comp />
      </Animated.View>
      {showTabs ? <TabBar /> : null}
      <RemindSheet />
      <Toast bottom={toastBottom} />
    </View>
  );
}

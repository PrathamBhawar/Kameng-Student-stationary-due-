import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass, Icon, T } from './ui';
import { reducedMotion } from '../anim';
import { tapLight, tapSuccess } from '../store';

const H = 64, PAD = 6, KNOB = H - PAD * 2;
const W = '#FFFFFF';

/**
 * "Slide to start": drag the knob to the end of the glass track. Chevrons ripple and the knob nudges
 * right to show the direction; past 75% it snaps home, turns green with a tick, then calls onDone.
 * Screen readers get it as a plain button (activate = start), since they can't slide.
 */
export function SlideToStart({ label, width, onDone }: { label: string; width: number; onDone: () => void }) {
  const max = width - PAD * 2 - KNOB;
  const x = useState(() => new Animated.Value(0))[0];     // the drag
  const hint = useState(() => new Animated.Value(0))[0];  // idle nudge
  const wave = useState(() => new Animated.Value(0))[0];  // chevron ripple, 0 → 1 looping
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);
  const cb = useRef(onDone);
  useEffect(() => { cb.current = onDone; });

  // Idle hints: chevrons light up left to right; the knob nudges right every ~2.4 s.
  const hintLoop = useRef<Animated.CompositeAnimation | null>(null);
  const startHints = () => {
    if (reducedMotion()) return;
    hintLoop.current?.stop();
    hint.setValue(0);
    hintLoop.current = Animated.loop(Animated.sequence([
      Animated.delay(900),
      Animated.timing(hint, { toValue: 16, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hint, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 14 }),
      Animated.delay(1100),
    ]));
    hintLoop.current.start();
  };
  useEffect(() => {
    if (reducedMotion()) return;
    const w = Animated.loop(Animated.timing(wave, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }));
    w.start();
    startHints();
    return () => { w.stop(); hintLoop.current?.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    hintLoop.current?.stop();
    hint.setValue(0);
    tapSuccess();
    setDone(true);
    Animated.timing(x, { toValue: max, duration: reducedMotion() ? 0 : 160, easing: Easing.out(Easing.quad), useNativeDriver: true })
      .start(() => setTimeout(() => cb.current(), reducedMotion() ? 0 : 380));
  };

  // eslint-disable-next-line react-hooks/refs -- refs are read in gesture callbacks only
  const pan = useState(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !doneRef.current,
    onMoveShouldSetPanResponder: (_, g) => !doneRef.current && Math.abs(g.dx) > 2,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { hintLoop.current?.stop(); hint.setValue(0); tapLight(); },
    onPanResponderMove: (_, g) => x.setValue(Math.min(Math.max(g.dx, 0), max)),
    onPanResponderRelease: (_, g) => {
      if (g.dx >= max * 0.75 || (g.vx > 1.2 && g.dx > max * 0.4)) finish();
      else Animated.spring(x, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 9 }).start(() => startHints());
    },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(() => startHints()),
  }))[0];

  const knobX = Animated.add(x, hint);
  const progress = x.interpolate({ inputRange: [0, max], outputRange: [0, 1], extrapolate: 'clamp' });
  const labelOpacity = progress.interpolate({ inputRange: [0, 0.55], outputRange: [1, 0], extrapolate: 'clamp' });
  // The blue fill grows with the knob: a full-width bar scaled from the left edge.
  const fillW = width - PAD * 2;
  const fillScale = knobX.interpolate({ inputRange: [0, max], outputRange: [KNOB / fillW, 1], extrapolate: 'clamp' });

  return (
    <View
      accessible accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Slide right, or double-tap, to start"
      accessibilityActions={[{ name: 'activate' }]} onAccessibilityAction={finish}
      style={{ width, height: H }}>
      <Glass tint="rgba(120,140,255,0.13)" radius={H / 2} intensity={24}
        style={{ height: H, borderWidth: 1, borderColor: 'rgba(143,168,255,0.28)', justifyContent: 'center' }}>
        <Animated.View pointerEvents="none" style={{
          position: 'absolute', left: PAD, top: PAD, width: fillW, height: KNOB, borderRadius: KNOB / 2, overflow: 'hidden',
          transformOrigin: 'left', transform: [{ scaleX: fillScale }],
          opacity: x.interpolate({ inputRange: [0, 10], outputRange: [0, 1], extrapolate: 'clamp' }), // hidden at rest
        }}>
          <LinearGradient colors={done ? ['#11803A', '#16A34A'] : ['#2E46F5', '#5C78FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>

        <Animated.View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingLeft: KNOB, opacity: labelOpacity }}>
          <T size={16} weight={600} color={W}>{label}</T>
          <View style={{ flexDirection: 'row', marginLeft: -2 }}>
            {[0, 1, 2].map((i) => (
              <Animated.View key={i} style={{
                marginLeft: -8,
                opacity: reducedMotion() ? 0.7 : wave.interpolate({
                  inputRange: [0, (i + 0.2) / 4, (i + 1) / 4, (i + 1.8) / 4, 1],
                  outputRange: [0.3, 0.3, 1, 0.3, 0.3], extrapolate: 'clamp',
                }),
              }}>
                <Icon name="chevron" size={20} color={W} sw={2.4} />
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View {...pan.panHandlers} style={{
          position: 'absolute', left: PAD, top: PAD, width: KNOB, height: KNOB, borderRadius: KNOB / 2,
          backgroundColor: done ? '#16A34A' : W, alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
          transform: [{ translateX: knobX }],
        }}>
          {done ? <Icon name="check" size={24} color={W} sw={2.8} /> : (
            <View style={{ flexDirection: 'row' }}>
              <Icon name="chevron" size={22} color="#1A2BE8" sw={2.6} />
            </View>
          )}
        </Animated.View>
      </Glass>
    </View>
  );
}

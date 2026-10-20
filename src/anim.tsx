import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleProp, ViewStyle } from 'react-native';

// Ports of the design's data-anim keyframes onto the native-driver Animated API.

export const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
export const SHEET_EASE = Easing.bezier(0.2, 0.9, 0.25, 1.05);
const IN_OUT = Easing.inOut(Easing.ease);

let reducedCache = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { reducedCache = !!v; }).catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => { reducedCache = !!v; });
export const reducedMotion = () => reducedCache;

export function useReduced() {
  const [r, setR] = useState(reducedCache);
  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => setR(!!v));
    return () => sub?.remove?.();
  }, []);
  return r;
}

export type AnimType =
  | 'rise' | 'pop' | 'float' | 'fill' | 'glow' | 'laser' | 'blink'
  | 'sheet' | 'coin' | 'bar' | 'tick' | 'ring' | 'ringOnce' | 'sheen' | 'fade';

type Spec = { duration: number; easing: (t: number) => number; loop?: 'alternate' | 'restart' };
const SPECS: Record<AnimType, Spec> = {
  rise: { duration: 650, easing: EASE },
  pop: { duration: 700, easing: EASE },
  float: { duration: 2600, easing: IN_OUT, loop: 'alternate' },
  fill: { duration: 5200, easing: Easing.linear },
  glow: { duration: 4200, easing: IN_OUT, loop: 'alternate' },
  laser: { duration: 1600, easing: IN_OUT, loop: 'alternate' },
  blink: { duration: 1000, easing: Easing.linear, loop: 'restart' },
  sheet: { duration: 480, easing: SHEET_EASE },
  coin: { duration: 1150, easing: EASE },
  bar: { duration: 520, easing: EASE },
  tick: { duration: 520, easing: EASE },
  ring: { duration: 2400, easing: Easing.bezier(0.1, 0.6, 0.3, 1), loop: 'restart' },
  ringOnce: { duration: 1100, easing: Easing.bezier(0.1, 0.6, 0.3, 1) }, // the splash radar: one pulse, then stops
  sheen: { duration: 3400, easing: IN_OUT, loop: 'restart' },
  fade: { duration: 600, easing: EASE },
};

/** Drives a 0→1 value for one keyframe type, honouring delay, looping and Reduce Motion. */
export function useKeyframe(type: AnimType, delay = 0, replayKey?: unknown) {
  const spec = SPECS[type];
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (reducedMotion()) { v.setValue(spec.loop ? 0 : 1); return; }
    v.setValue(0);
    const t = (to: number) => Animated.timing(v, { toValue: to, duration: spec.duration, easing: spec.easing, useNativeDriver: true });
    let anim: Animated.CompositeAnimation;
    if (spec.loop === 'alternate') anim = Animated.loop(Animated.sequence([t(1), t(0)]));
    else if (spec.loop === 'restart') anim = Animated.loop(t(1), { iterations: -1, resetBeforeIteration: true });
    else anim = t(1);
    const seq = delay ? Animated.sequence([Animated.delay(delay), anim]) : anim;
    seq.start();
    return () => seq.stop();
  }, [replayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

const lerp = (v: Animated.Value, inputRange: number[], outputRange: (number | string)[]) =>
  v.interpolate({ inputRange, outputRange: outputRange as any, extrapolate: 'clamp' });

/** Style for a keyframe value. `span` is the travel distance in px for laser / sheen / sheet. */
export function keyframeStyle(type: AnimType, v: Animated.Value, span = 0): any {
  switch (type) {
    case 'rise':
      return { opacity: v, transform: [{ translateY: lerp(v, [0, 1], [22, 0]) }] };
    case 'pop':
      return {
        opacity: lerp(v, [0, 0.7, 1], [0, 1, 1]),
        transform: [{ translateY: lerp(v, [0, 0.7, 1], [14, 0, 0]) }, { scale: lerp(v, [0, 0.7, 1], [0.86, 1.03, 1]) }],
      };
    case 'float':
      return { transform: [{ translateY: lerp(v, [0, 1], [0, -7]) }] };
    case 'fill':
      return { transformOrigin: 'left', transform: [{ scaleX: v }] };
    case 'glow':
      return { opacity: lerp(v, [0, 1], [0.6, 1]), transform: [{ scale: lerp(v, [0, 1], [1, 1.12]) }] };
    case 'laser':
      return { transform: [{ translateX: lerp(v, [0, 1], [-span / 2, span / 2]) }] };
    case 'blink':
      return { opacity: lerp(v, [0, 0.5, 0.51, 1], [1, 1, 0, 0]) };
    case 'sheet':
      return { opacity: lerp(v, [0, 1], [0.4, 1]), transform: [{ translateY: lerp(v, [0, 1], [span * 0.6, 0]) }] };
    case 'coin':
      return {
        opacity: lerp(v, [0, 0.72, 1], [0, 1, 1]),
        transform: [
          { perspective: 700 },
          { translateY: lerp(v, [0, 0.72, 1], [-70, 8, 0]) },
          { rotateY: lerp(v, [0, 0.72, 1], ['-200deg', '12deg', '0deg']) },
          { scale: lerp(v, [0, 0.72, 1], [0.45, 1.05, 1]) },
        ],
      };
    case 'bar':
      return { transformOrigin: 'bottom', transform: [{ scaleY: lerp(v, [0, 0.7, 1], [0, 1.12, 1]) }] };
    case 'tick':
      return { transform: [{ scale: lerp(v, [0, 0.6, 1], [0, 1.25, 1]) }] };
    case 'ring':
    case 'ringOnce':
      return { opacity: lerp(v, [0, 0.08, 1], [0, 0.8, 0]), transform: [{ scale: lerp(v, [0, 0.08, 1], [0.85, 0.95, 2.1]) }] };
    case 'fade':
      return { opacity: v };
    case 'sheen':
      return { transform: [{ translateX: lerp(v, [0, 0.4, 1], [0, span, span]) }, { skewX: '-12deg' }] };
  }
}

type AnimProps = {
  type: AnimType; delay?: number; span?: number; replayKey?: unknown;
  style?: StyleProp<ViewStyle>; children?: React.ReactNode; pointerEvents?: 'none' | 'auto' | 'box-none';
};

/** <Anim type="rise" delay={80}> — the RN equivalent of data-anim / data-delay. */
export function Anim({ type, delay = 0, span = 0, replayKey, style, children, pointerEvents }: AnimProps) {
  const v = useKeyframe(type, delay, replayKey);
  return <Animated.View pointerEvents={pointerEvents} style={[style, keyframeStyle(type, v, span)]}>{children}</Animated.View>;
}

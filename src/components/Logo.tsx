import React, { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Anim, reducedMotion } from '../anim';

const BARS = [
  { x: 8, w: 4.5, h: 28, rx: 1.6 },
  { x: 15.5, w: 2.2, h: 28, rx: 1.1 },
  { x: 20.7, w: 5, h: 28, rx: 1.6 },
  { x: 28.7, w: 2.2, h: 15, rx: 1.1 },
];
const CHECK = 'M30.2 33.2l2.6 2.6 5-5.2';

/** Static barcode-and-tick mark. `four` = include the short fourth bar. */
export function LogoMark({ size, bar, dot, check, four = true }: { size: number; bar: string; dot: string; check?: string; four?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {(four ? BARS : BARS.slice(0, 3)).map((b, i) => <Rect key={i} x={b.x} y={10} width={b.w} height={b.h} rx={b.rx} fill={bar} />)}
      <Circle cx={34} cy={33} r={8.5} fill={dot} />
      {check ? <Path d={CHECK} stroke={check} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </Svg>
  );
}

const APath = Animated.createAnimatedComponent(Path);

/** Splash mark: bars grow up one by one, the green dot pops, then the tick draws itself. */
export function AnimatedLogo({ size = 92 }: { size?: number }) {
  const k = size / 48;
  const draw = useState(() => new Animated.Value(reducedMotion() ? 0 : 12))[0];
  useEffect(() => {
    if (reducedMotion()) return;
    const a = Animated.timing(draw, { toValue: 0, duration: 420, delay: 1250, easing: Easing.out(Easing.ease), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [draw]);
  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel="Student Dues logo">
      {BARS.map((b, i) => (
        <Anim key={i} type="bar" delay={650 + i * 80}
          style={{ position: 'absolute', left: b.x * k, top: (38 - b.h) * k, width: b.w * k, height: b.h * k, borderRadius: b.rx * k, backgroundColor: '#2346F5' }} />
      ))}
      <Anim type="tick" delay={1000}
        style={{ position: 'absolute', left: (34 - 8.5) * k, top: (33 - 8.5) * k, width: 17 * k, height: 17 * k, borderRadius: 8.5 * k, backgroundColor: '#16A34A' }} />
      <Svg width={size} height={size} viewBox="0 0 48 48" style={{ position: 'absolute', left: 0, top: 0 }}>
        <APath d={CHECK} stroke="#FFFFFF" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={[12, 12]} strokeDashoffset={draw as any} />
      </Svg>
    </View>
  );
}

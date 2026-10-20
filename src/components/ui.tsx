import React, { useState } from 'react';
import { Animated, Keyboard, Pressable, PressableProps, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinear, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Face, fontFamily, Stop as GStop } from '../theme';
import { useLook } from '../store';

const BENGALI = /[ঀ-৿]/;
const flatText = (c: React.ReactNode): string =>
  typeof c === 'string' || typeof c === 'number' ? String(c) : Array.isArray(c) ? c.map(flatText).join('') : '';

type TProps = TextProps & {
  size?: number; weight?: 400 | 500 | 600 | 700 | 800 | 900; face?: Face; color?: string;
  fixed?: boolean; // ignore the in-app text size setting
  ls?: number; // letter-spacing in em, like the design
  lh?: number; // line-height multiplier
  upper?: boolean; center?: boolean;
  style?: StyleProp<TextStyle>;
};

/** Text that picks Inter / Inter Tight / Noto Sans Bengali and applies the in-app text scale. */
export function T({ size = 17, weight = 400, face = 'text', color, fixed, ls, lh, upper, center, style, children, ...rest }: TProps) {
  const { fs, c } = useLook();
  const px = fixed ? size : fs(size);
  const bengali = BENGALI.test(flatText(children));
  return (
    <Text
      maxFontSizeMultiplier={1.15}
      {...rest}
      style={[{
        fontFamily: fontFamily(face, weight, bengali), fontSize: px, color: color ?? c.text,
        letterSpacing: ls ? ls * px : 0, textTransform: upper ? 'uppercase' : 'none',
        lineHeight: lh ? Math.round(px * lh) : bengali ? Math.round(px * 1.45) : undefined,
        textAlign: center ? 'center' : undefined,
      }, style]}
    >{children}</Text>
  );
}

const APressable = Animated.createAnimatedComponent(Pressable);

type TapProps = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle>; scaleTo?: number; label?: string };

/** Pressable with a springy press-down, used for every button in the app. */
export function Tap({ style, scaleTo = 0.96, label, disabled, children, onPressIn, onPressOut, ...rest }: TapProps) {
  const s = useState(() => new Animated.Value(1))[0];
  const to = (v: number) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: v === 1 ? 8 : 0 }).start();
  return (
    <APressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e) => { to(scaleTo); onPressIn?.(e); }}
      onPressOut={(e) => { to(1); onPressOut?.(e); }}
      style={[style, { transform: [{ scale: s }] }]}
      {...rest}
    >{children as React.ReactNode}</APressable>
  );
}

export const ICONS = {
  back: ['M19 12H5M11 6l-6 6 6 6'],
  close: ['M6 6l12 12M18 6L6 18'],
  plus: ['M12 5v14M5 12h14'],
  bell: ['M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z', 'M10 20.5a2 2 0 0 0 4 0'],
  chevron: ['M9 6l6 6-6 6'],
  clock: ['M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0', 'M12 7.5V12l3 2'],
  warn: ['M12 3.5l9 16H3z', 'M12 10v4M12 17h.01'],
  search: ['M4.5 11a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0', 'M16 16l4.5 4.5'],
  lock: ['M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  torch: ['M13 3L5 14h6l-1 7 8-11h-6z'],
  alert: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 7.5v5.5M12 16.5h.01'],
  device: ['M9.5 3h5A2.5 2.5 0 0 1 17 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 18.5v-13A2.5 2.5 0 0 1 9.5 3z', 'M11 18h2'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', 'M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0'],
  eyeOff: ['M3 3l18 18', 'M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.7-1.3', 'M9.9 9.9a3 3 0 0 0 4.2 4.2'],
  del: ['M9 5h11v14H9l-6-7z', 'M12.5 9.5l5 5M17.5 9.5l-5 5'],
  whatsapp: ['M4 20l1.3-3.9A8 8 0 1 1 8 19z', 'M9 11.5h.01M12 11.5h.01M15 11.5h.01'],
  call: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z'],
  scan: ['M3 7V4h3M18 4h3v3M21 17v3h-3M6 20H3v-3', 'M7.5 8v8M10.5 8v8M13.5 8v8M16.5 8v8'],
  overview: ['M3.5 10.5L12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z'],
  students: ['M9 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M17 6.5a2.5 2.5 0 1 1 0 5M17 14.5c2.2 0 3.9 1.5 4.5 4'],
  profile: ['M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c1-4.2 4.2-6.5 8-6.5s7 2.3 8 6.5'],
  light: ['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  dark: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  system: ['M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2'],
} as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 24, color = '#000', sw = 2 }: { name: IconName; size?: number; color?: string; sw?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {ICONS[name].map((d, i) => (
        <Path key={i} d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
    </Svg>
  );
}

/** Vertical linear gradient filling its parent. */
export function LinearBg({ stops, style }: { stops: GStop[]; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={stops.map((s) => s[1]) as any}
      locations={stops.map((s) => s[0]) as any}
      style={[StyleSheet.absoluteFill, style]}
    />
  );
}

let gid = 0;
const useGid = () => useState(() => 'g' + ++gid)[0];

/** Elliptical radial gradient filling its parent (CSS radial-gradient(rx ry at cx cy, ...)). */
export function RadialBg({ stops, cx = '50%', cy = '50%', rx = '50%', ry = '50%', style }: {
  stops: GStop[]; cx?: string; cy?: string; rx?: string; ry?: string; style?: StyleProp<ViewStyle>;
}) {
  const id = useGid();
  // Neither rx/ry (non-standard) nor gradientTransform renders the same on iOS, Android and web.
  // Instead draw a plain circular gradient in a viewBox sized 1/rx × 1/ry and let
  // preserveAspectRatio="none" stretch it to the box: the circle of radius 1 becomes an
  // ellipse of rx × width by ry × height, centred at (cx, cy) — identical on every platform.
  const f = (p: string) => parseFloat(p) / 100;
  const vw = 1 / f(rx), vh = 1 / f(ry);
  const gx = f(cx) * vw, gy = f(cy) * vh;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} cx={gx} cy={gy} r={1} fx={gx} fy={gy} gradientUnits="userSpaceOnUse">
            {stops.map(([o, col], i) => <Stop key={i} offset={o} stopColor={toHex(col)} stopOpacity={alphaOf(col)} />)}
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={vw} height={vh} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Diagonal sheen used on the splash coin. */
export function SheenBar({ width, height }: { width: number; height: number }) {
  const id = useGid();
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinear id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </SvgLinear>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill={`url(#${id})`} />
    </Svg>
  );
}

function alphaOf(col: string) {
  const m = col.match(/rgba?\(([^)]+)\)/);
  if (!m) return 1;
  const p = m[1].split(',').map((x) => x.trim());
  return p.length > 3 ? parseFloat(p[3]) : 1;
}
function toHex(col: string) {
  const m = col.match(/rgba?\(([^)]+)\)/);
  if (!m) return col;
  const [r, g, b] = m[1].split(',').map((x) => parseInt(x.trim(), 10));
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

/** Frosted glass: blur behind plus a tint, like backdrop-filter in the design. */
export function Glass({ tint, intensity = 30, dark = true, style, children, radius = 0 }: {
  tint: string; intensity?: number; dark?: boolean; style?: StyleProp<ViewStyle>; children?: React.ReactNode; radius?: number;
}) {
  return (
    // zIndex 0 makes this its own layer; the blur and tint sit at -1 so the content always paints on top.
    <View style={[{ borderRadius: radius, overflow: 'hidden', zIndex: 0 }, style]}>
      <BlurView intensity={intensity} tint={dark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { zIndex: -1 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint, zIndex: -1 }]} />
      {children}
    </View>
  );
}

/** Circular avatar with initials. */
export function Avatar({ ini, size, bg, fg, fontSize, face = 'text', weight = 700, ring }: {
  ini: string; size: number; bg: string; fg: string; fontSize: number; face?: Face; weight?: 700 | 800; ring?: string;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 2 : 0, borderColor: ring }}>
      <T fixed size={fontSize} weight={weight} face={face} color={fg}>{ini}</T>
    </View>
  );
}

/** Peach gradient avatar used for the shop owner. */
export function OwnerAvatar({ ini, size, fontSize, ring }: { ini: string; size: number; fontSize: number; ring?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 2 : 0, borderColor: 'rgba(255,255,255,0.35)' }}>
      <LinearGradient colors={['#FFD9B8', '#F2A971']} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
      <T fixed size={fontSize} weight={800} face="display" color="#5A2A04">{ini}</T>
    </View>
  );
}

/** Full-width pill button (56px) with animated colour when enabled state changes. */
export function PillButton({ title, onPress, bg, fg, disabled, style, height = 56, size = 17, children, label }: {
  title?: string; onPress: () => void; bg: string; fg: string; disabled?: boolean; style?: StyleProp<ViewStyle>;
  height?: number; size?: number; children?: React.ReactNode; label?: string;
}) {
  return (
    <Tap onPress={onPress} disabled={disabled} label={label ?? title}
      style={[{ height, borderRadius: height / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, style]}>
      {children}
      {title ? <T size={size} weight={600} color={fg}>{title}</T> : null}
    </Tap>
  );
}

/** Closes the on-screen keyboard when the user taps anywhere outside a text field. */
export function DismissKeyboard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessible={false} onPress={Keyboard.dismiss} style={[{ flex: 1 }, style]}>
      {children}
    </Pressable>
  );
}

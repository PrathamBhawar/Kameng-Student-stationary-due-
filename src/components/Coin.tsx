import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

let n = 0;

// Fraction of a blurred disc's colour at k standard deviations outside its edge (normal CDF of -k).
// CSS box-shadow blur is Gaussian with σ = blur / 2, so sampling this reproduces its soft falloff.
const PHI: [number, number][] = [[-2, 0.977], [-1, 0.841], [-0.5, 0.691], [0, 0.5], [0.5, 0.309], [1, 0.159], [1.5, 0.067], [2, 0.023], [2.5, 0.006], [3, 0]];

/** Gradient stops for a CSS-style blurred shadow of a disc of radius r, blur b, peak opacity a. */
function shadowStops(r: number, b: number, a: number, color: string) {
  const s = b / 2, outer = r + 3 * s;
  return PHI.filter(([k]) => r + k * s >= 0).map(([k, f], i) => (
    <Stop key={i} offset={(r + k * s) / outer} stopColor={color} stopOpacity={a * f} />
  ));
}

/** The coin's blue glow (0 0 blur) and drop shadow (0 40px 80px -10px), as in the design's CSS. */
function HaloShapes({ id, c, R, glow, blur }: { id: string; c: number; R: number; glow: number; blur: number }) {
  const glowR = R + 1.5 * blur, sr = R - 10, shadowR = sr + 120;
  return (
    <>
      <Defs>
        <RadialGradient id={id + 'g'} cx={c} cy={c} r={glowR} fx={c} fy={c} gradientUnits="userSpaceOnUse">
          {shadowStops(R, blur, glow, '#3A55FF')}
        </RadialGradient>
        <RadialGradient id={id + 'd'} cx={c} cy={c + 40} r={shadowR} fx={c} fy={c + 40} gradientUnits="userSpaceOnUse">
          {shadowStops(sr, 80, 0.8, '#000000')}
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={glowR} fill={`url(#${id}g)`} />
      <Circle cx={c} cy={c + 40} r={shadowR} fill={`url(#${id}d)`} />
    </>
  );
}

const pad = (blur: number) => Math.max(1.5 * blur, 130) + 12;

/**
 * The chrome coin from the design, drawn as a single SVG so it looks the same on iOS, Android and web.
 * It reproduces the design's CSS: radial shading at 34% 28%, inset top highlight and bottom shade,
 * a 7px faint outer ring, a soft drop shadow and a blue glow, plus the engraved inner ring.
 */
export function Coin({ size, inner, glow, blur, children, halo = true }: {
  size: number; inner: number; glow: number; blur: number; children?: React.ReactNode;
  /** false draws only the disc, for a coin animated over a separate, still CoinHalo. */
  halo?: boolean;
}) {
  const id = useState(() => 'coin' + ++n)[0];
  const S = size, R = S / 2;
  const P = halo ? pad(blur) : 12;
  const W = S + P * 2, H = S + P * 2 + (halo ? 40 : 0);
  const c = P + R; // centre in canvas coordinates
  return (
    <View style={{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={W} height={H} style={{ position: 'absolute', left: -P, top: -P }} pointerEvents="none">
        {halo ? <HaloShapes id={id} c={c} R={R} glow={glow} blur={blur} /> : null}
        <Defs>
          <RadialGradient id={id + 'f'} cx={c - R + S * 0.34} cy={c - R + S * 0.28} r={S * 0.977} fx={c - R + S * 0.34} fy={c - R + S * 0.28} gradientUnits="userSpaceOnUse">
            <Stop offset={0} stopColor="#FFFFFF" />
            <Stop offset={0.3} stopColor="#E4E7EF" />
            <Stop offset={0.64} stopColor="#B3B9C9" />
            <Stop offset={1} stopColor="#7F8699" />
          </RadialGradient>
          <LinearGradient id={id + 'i'} x1={0} y1={c - R} x2={0} y2={c + R} gradientUnits="userSpaceOnUse">
            <Stop offset={0} stopColor="#FFFFFF" stopOpacity={0.6} />
            <Stop offset={0.09} stopColor="#FFFFFF" stopOpacity={0.18} />
            <Stop offset={0.2} stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset={0.76} stopColor="#000000" stopOpacity={0} />
            <Stop offset={0.92} stopColor="#000000" stopOpacity={0.12} />
            <Stop offset={1} stopColor="#000000" stopOpacity={0.3} />
          </LinearGradient>
          <LinearGradient id={id + 'r'} x1={0} y1={c - inner / 2} x2={0} y2={c + inner / 2} gradientUnits="userSpaceOnUse">
            <Stop offset={0} stopColor="#000000" stopOpacity={0.24} />
            <Stop offset={0.5} stopColor="#000000" stopOpacity={0.04} />
            <Stop offset={0.8} stopColor="#FFFFFF" stopOpacity={0.3} />
            <Stop offset={1} stopColor="#FFFFFF" stopOpacity={0.85} />
          </LinearGradient>
          <LinearGradient id={id + 's'} x1={0} y1={c - inner / 2} x2={0} y2={c + inner / 2} gradientUnits="userSpaceOnUse">
            <Stop offset={0} stopColor="#000000" stopOpacity={0.14} />
            <Stop offset={0.12} stopColor="#000000" stopOpacity={0} />
            <Stop offset={1} stopColor="#000000" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Circle cx={c} cy={c} r={R + 3.5} fill="none" stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={7} />
        <Circle cx={c} cy={c} r={R} fill={`url(#${id}f)`} />
        <Circle cx={c} cy={c} r={R} fill={`url(#${id}i)`} />
        <Circle cx={c} cy={c} r={inner / 2} fill={`url(#${id}s)`} />
        <Circle cx={c} cy={c} r={inner / 2} fill="none" stroke={`url(#${id}r)`} strokeWidth={1.5} />
      </Svg>
      {/* Its own positioned layer, so the mark always paints above the coin on every platform. */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

/** The coin's blue glow and drop shadow on their own, as a still layer under an animated coin. */
export function CoinHalo({ size, glow, blur }: { size: number; glow: number; blur: number }) {
  const id = useState(() => 'halo' + ++n)[0];
  const R = size / 2, P = pad(blur);
  const W = size + P * 2, H = size + P * 2 + 40, c = P + R;
  return (
    <Svg width={W} height={H} style={{ position: 'absolute', left: -P, top: -P }} pointerEvents="none">
      <HaloShapes id={id} c={c} R={R} glow={glow} blur={blur} />
    </Svg>
  );
}

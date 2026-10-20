import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

let n = 0;

/**
 * The chrome coin from the design, drawn as a single SVG so it looks the same on iOS, Android and web.
 * It reproduces the design's CSS: radial shading at 34% 28%, inset top highlight and bottom shade,
 * a 7px faint outer ring, a soft drop shadow and a blue glow, plus the engraved inner ring.
 */
export function Coin({ size, inner, glow, blur, children, halo = true }: {
  size: number; inner: number; glow: number; blur: number; children?: React.ReactNode;
  /** false draws only the disc, for a coin that flips in 3D over a separate, still CoinHalo. */
  halo?: boolean;
}) {
  const id = useState(() => 'coin' + ++n)[0];
  const S = size, R = S / 2;
  const P = blur + 12; // room for the glow
  const W = S + P * 2, H = S + P * 2 + 40; // + room for the drop shadow below
  const c = P + R; // centre in canvas coordinates
  const glowR = R + blur;
  const shadowR = R - 10 + 80;
  return (
    <View style={{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={W} height={H} style={{ position: 'absolute', left: -P, top: -P }} pointerEvents="none">
        <Defs>
          <RadialGradient id={id + 'g'} cx={c} cy={c} r={glowR} fx={c} fy={c} gradientUnits="userSpaceOnUse">
            <Stop offset={R / glowR} stopColor="#3A55FF" stopOpacity={glow} />
            <Stop offset={(R + blur * 0.35) / glowR} stopColor="#3A55FF" stopOpacity={glow * 0.45} />
            <Stop offset={1} stopColor="#3A55FF" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={id + 'd'} cx={c} cy={c + 40} r={shadowR} fx={c} fy={c + 40} gradientUnits="userSpaceOnUse">
            <Stop offset={(R - 50) / shadowR} stopColor="#000" stopOpacity={0.8} />
            <Stop offset={(R - 10) / shadowR} stopColor="#000" stopOpacity={0.45} />
            <Stop offset={1} stopColor="#000" stopOpacity={0} />
          </RadialGradient>
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
        {/* CSS paints the first-listed shadow on top, so draw glow, then drop shadow, then the ring. */}
        {halo ? <Circle cx={c} cy={c} r={glowR} fill={`url(#${id}g)`} /> : null}
        {halo ? <Circle cx={c} cy={c + 40} r={shadowR} fill={`url(#${id}d)`} /> : null}
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

/**
 * The coin's blue glow and drop shadow on their own. Kept outside the flipping coin: on iOS a
 * 3D-rotated view flattens and clips an oversized child like this, which broke the splash flip-in.
 */
export function CoinHalo({ size, glow, blur }: { size: number; glow: number; blur: number }) {
  const id = useState(() => 'halo' + ++n)[0];
  const R = size / 2, P = blur + 12;
  const W = size + P * 2, H = size + P * 2 + 40, c = P + R;
  const glowR = R + blur, shadowR = R - 10 + 80;
  return (
    <Svg width={W} height={H} style={{ position: 'absolute', left: -P, top: -P }} pointerEvents="none">
      <Defs>
        <RadialGradient id={id + 'g'} cx={c} cy={c} r={glowR} fx={c} fy={c} gradientUnits="userSpaceOnUse">
          <Stop offset={R / glowR} stopColor="#3A55FF" stopOpacity={glow} />
          <Stop offset={(R + blur * 0.35) / glowR} stopColor="#3A55FF" stopOpacity={glow * 0.45} />
          <Stop offset={1} stopColor="#3A55FF" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id + 'd'} cx={c} cy={c + 40} r={shadowR} fx={c} fy={c + 40} gradientUnits="userSpaceOnUse">
          <Stop offset={(R - 50) / shadowR} stopColor="#000" stopOpacity={0.8} />
          <Stop offset={(R - 10) / shadowR} stopColor="#000" stopOpacity={0.45} />
          <Stop offset={1} stopColor="#000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={glowR} fill={`url(#${id}g)`} />
      <Circle cx={c} cy={c + 40} r={shadowR} fill={`url(#${id}d)`} />
    </Svg>
  );
}

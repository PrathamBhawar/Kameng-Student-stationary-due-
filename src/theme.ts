// Design tokens from the "Clear Blue" design language.

export type Palette = {
  bg: string; surface: string; surface2: string; text: string; text2: string; text3: string; line: string;
  primary: string; primarySoft: string; primaryInk: string;
  green: string; greenSoft: string; amber: string; amberSoft: string; red: string; redSoft: string;
  tabBg: string; dim: string; keyBg: string; keySh: string; toastBg: string; toastFg: string; toastIcon: string;
  disBg: string; disFg: string;
};

export const light: Palette = {
  bg: '#F2F4F7', surface: '#FFFFFF', surface2: '#E9ECF1', text: '#0B0F19', text2: '#566070', text3: '#8A93A3', line: '#E4E7EC',
  primary: '#2B4CFF', primarySoft: '#E8ECFF', primaryInk: '#1F35C9',
  green: '#11803A', greenSoft: '#E2F4E8', amber: '#9A5B00', amberSoft: '#FFF0D6', red: '#C2261B', redSoft: '#FDE6E3',
  tabBg: 'rgba(255,255,255,0.88)', dim: 'rgba(11,15,25,0.45)', keyBg: '#FFFFFF', keySh: '#D6DAE1',
  toastBg: '#0B0F19', toastFg: '#FFFFFF', toastIcon: '#4ACB7C',
  disBg: '#E3E6EB', disFg: '#6B7484',
};

export const dark: Palette = {
  bg: '#0A0C10', surface: '#151922', surface2: '#1F2430', text: '#F3F5F9', text2: '#A6AEBD', text3: '#6E7787', line: '#262C38',
  primary: '#3D57FF', primarySoft: '#161D4A', primaryInk: '#AFBDFF',
  green: '#4ACB7C', greenSoft: '#10301D', amber: '#F3B353', amberSoft: '#382810', red: '#FF8076', redSoft: '#3E1714',
  tabBg: 'rgba(31,36,48,0.88)', dim: 'rgba(0,0,0,0.6)', keyBg: '#1F2430', keySh: 'transparent',
  toastBg: '#F3F5F9', toastFg: '#0B0F19', toastIcon: '#11803A',
  disBg: '#262C38', disFg: '#7D8594',
};

export type Stop = [number, string];

export const grad = {
  // linear-gradient(180deg, ...)
  home: [[0, '#8FA9FF'], [0.16, '#4A63FF'], [0.32, '#2236F0'], [0.46, '#1424B8'], [0.6, '#0B1270'], [0.74, '#060A3A'], [0.88, '#03051C'], [1, '#020312']] as Stop[],
  card: [[0, '#5C78FF'], [0.38, '#2E46F5'], [0.7, '#1A29C9'], [1, '#121C96']] as Stop[],
  // radial-gradient(140% 72% at 50% 0%, ...)
  onb: [[0, '#3346F0'], [0.2, '#1E2BC4'], [0.42, '#0E1676'], [0.64, '#050830'], [0.86, '#000000'], [1, '#000000']] as Stop[],
  // radial-gradient(closest-side, ...)
  glow: [[0, 'rgba(58,85,255,0.75)'], [0.45, 'rgba(34,54,240,0.35)'], [1, 'rgba(0,0,0,0)']] as Stop[],
  scan: [[0, '#2A3140'], [0.55, '#12161F'], [1, '#06080C']] as Stop[],
};

export const sizes = ['regular', 'medium', 'large'] as const;
export type SizeKey = typeof sizes[number];
export const scaleOf = (s: SizeKey) => (s === 'large' ? 1.25 : s === 'medium' ? 1.12 : 1);

type W = 400 | 500 | 600 | 700 | 800 | 900;
const interW: Record<number, string> = { 400: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold', 700: 'Inter_700Bold', 800: 'Inter_800ExtraBold', 900: 'Inter_800ExtraBold' };
const tightW: Record<number, string> = { 400: 'InterTight_600SemiBold', 500: 'InterTight_600SemiBold', 600: 'InterTight_600SemiBold', 700: 'InterTight_700Bold', 800: 'InterTight_800ExtraBold', 900: 'InterTight_900Black' };
const bengW: Record<number, string> = { 400: 'NotoSansBengali_400Regular', 500: 'NotoSansBengali_400Regular', 600: 'NotoSansBengali_600SemiBold', 700: 'NotoSansBengali_700Bold', 800: 'NotoSansBengali_700Bold', 900: 'NotoSansBengali_700Bold' };

export type Face = 'text' | 'display';
export const fontFamily = (face: Face, w: W, bengali: boolean) =>
  bengali ? bengW[w] : (face === 'display' ? tightW : interW)[w];

export const fonts = {
  Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  Inter_500Medium: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  Inter_600SemiBold: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  Inter_700Bold: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  Inter_800ExtraBold: require('@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf'),
  InterTight_600SemiBold: require('@expo-google-fonts/inter-tight/600SemiBold/InterTight_600SemiBold.ttf'),
  InterTight_700Bold: require('@expo-google-fonts/inter-tight/700Bold/InterTight_700Bold.ttf'),
  InterTight_800ExtraBold: require('@expo-google-fonts/inter-tight/800ExtraBold/InterTight_800ExtraBold.ttf'),
  InterTight_900Black: require('@expo-google-fonts/inter-tight/900Black/InterTight_900Black.ttf'),
  NotoSansBengali_400Regular: require('@expo-google-fonts/noto-sans-bengali/400Regular/NotoSansBengali_400Regular.ttf'),
  NotoSansBengali_600SemiBold: require('@expo-google-fonts/noto-sans-bengali/600SemiBold/NotoSansBengali_600SemiBold.ttf'),
  NotoSansBengali_700Bold: require('@expo-google-fonts/noto-sans-bengali/700Bold/NotoSansBengali_700Bold.ttf'),
};

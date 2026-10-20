import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Safe-area insets, with iPhone-like values in the web preview so layouts match the design. */
export function useSafe() {
  const i = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const web = Platform.OS === 'web';
  return {
    top: web ? 54 : Math.max(i.top, 20),
    bottom: web ? 34 : i.bottom,
    width, height,
    k: Math.min(1, height / 874), // vertical squeeze for shorter iPhones
  };
}

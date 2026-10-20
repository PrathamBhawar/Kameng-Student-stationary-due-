import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Safe-area insets, with iPhone-like values in the web preview so layouts match the design. */
export function useSafe() {
  const i = useSafeAreaInsets();
  const win = useWindowDimensions();
  const web = Platform.OS === 'web';
  // In a browser the app may sit inside a phone-sized frame, so lay out for the frame, not the window.
  const root = web && typeof document !== 'undefined' ? document.getElementById('root') : null;
  const width = root?.clientWidth || win.width;
  const height = root?.clientHeight || win.height;
  return {
    top: web ? 54 : Math.max(i.top, 20),
    bottom: web ? 34 : i.bottom,
    width, height,
    k: Math.min(1, height / 874), // vertical squeeze for shorter iPhones
  };
}

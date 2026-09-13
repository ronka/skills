import { I18nManager, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * RTL utilities for consistent layout direction across the app.
 *
 * `isRTL` is the product direction (what the user should see).
 * `I18nManager.isRTL` is the native direction (what React Native already mirrors).
 * When native RTL is on, React Native mirrors `flexDirection: 'row'`, `flex-start`/`flex-end`,
 * `textAlign: 'left'/'right'`, and (with `doLeftAndRightSwapInRTL`) margin/padding/position
 * left/right. The helpers mirror by hand only when the two directions differ, so they render
 * correctly in dev/EAS builds, in Expo Go, and in LTR apps.
 */

// Expo Go can't apply native RTL settings (they need a native rebuild), so I18nManager.isRTL
// stays false there even in an RTL-only app. Force the product direction to RTL in Expo Go and
// trust I18nManager everywhere else, where RTL is enforced at build time via expo-localization.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isRTL = isExpoGo ? true : I18nManager.isRTL;

const nativeIsRTL = I18nManager.isRTL;
const mirror = isRTL !== nativeIsRTL;
const swapsLeftAndRight = nativeIsRTL && I18nManager.doLeftAndRightSwapInRTL;

// Style-key side that renders on the reading-start edge, after any native left/right swap.
const startSide = isRTL !== swapsLeftAndRight ? 'Right' : 'Left';
const endSide = startSide === 'Right' ? 'Left' : 'Right';

export const rtlFlexDirection = {
  row: (mirror ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
  rowReverse: (mirror ? 'row' : 'row-reverse') as 'row' | 'row-reverse',
};

export const rtlTextAlign = {
  start: (mirror ? 'right' : 'left') as 'left' | 'right',
  end: (mirror ? 'left' : 'right') as 'left' | 'right',
  center: 'center' as const,
};

// Only for alignItems/alignSelf in column containers (horizontal cross axis). Inside
// rtlFlexDirection.row, use plain flex-start/flex-end — the row direction already mirrors.
export const rtlAlign = {
  start: (mirror ? 'flex-end' : 'flex-start') as 'flex-start' | 'flex-end',
  end: (mirror ? 'flex-start' : 'flex-end') as 'flex-start' | 'flex-end',
  center: 'center' as const,
};

export const rtlMargin = {
  marginStart: (value: number | 'auto') => ({ [`margin${startSide}`]: value }),
  marginEnd: (value: number | 'auto') => ({ [`margin${endSide}`]: value }),
};

export const rtlPadding = {
  paddingStart: (value: number) => ({ [`padding${startSide}`]: value }),
  paddingEnd: (value: number) => ({ [`padding${endSide}`]: value }),
};

export const rtlPosition = {
  start: (value: number) => ({ [startSide.toLowerCase()]: value }),
  end: (value: number) => ({ [endSide.toLowerCase()]: value }),
};

/**
 * Debug helper to check RTL state across environments.
 */
export const getRTLDebugInfo = () => ({
  isRTL, // Product direction (forced true in Expo Go)
  i18nIsRTL: nativeIsRTL, // Native direction React Native mirrors by
  doLeftAndRightSwapInRTL: I18nManager.doLeftAndRightSwapInRTL,
  mirror, // true when helpers flip values by hand
  startSide,
  isExpoGo,
  platform: Platform.OS,
});

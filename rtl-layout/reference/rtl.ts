import { I18nManager, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * RTL Utility functions for consistent RTL support across the app
 * Since the app is RTL-only, these functions currently force RTL values,
 * but are structured to support LTR switching in the future.
 */

// Expo Go can't apply I18nManager.forceRTL (it requires a native rebuild), so
// I18nManager.isRTL stays false there even though the app is RTL-only. Fall
// back to a hardcoded true in Expo Go and trust I18nManager everywhere else,
// where RTL is enforced at build time via expo-localization's `extra.forcesRTL`.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isRTL = isExpoGo ? true : I18nManager.isRTL;

/**
 * Returns RTL-appropriate margin styles
 */
export const rtlMargin = {
  marginStart: (value: number) => ({ [isRTL ? 'marginRight' : 'marginLeft']: value }),
  marginEnd: (value: number) => ({ [isRTL ? 'marginLeft' : 'marginRight']: value }),
  marginHorizontal: (value: number) => ({ marginHorizontal: value }),
};

/**
 * Returns RTL-appropriate padding styles
 */
export const rtlPadding = {
  paddingStart: (value: number) => ({ [isRTL ? 'paddingRight' : 'paddingLeft']: value }),
  paddingEnd: (value: number) => ({ [isRTL ? 'paddingLeft' : 'paddingRight']: value }),
  paddingHorizontal: (value: number) => ({ paddingHorizontal: value }),
};

/**
 * Returns RTL-appropriate text alignment
 */
export const rtlTextAlign = {
  start: (isRTL ? 'left' : 'right') as 'right' | 'left',
  end: (isRTL ? 'right' : 'left') as 'left' | 'right',
  center: 'center' as const,
};

/**
 * Returns RTL-appropriate flex alignment
 */
export const rtlAlign = {
  start: (isRTL ? 'flex-end' : 'flex-start') as 'flex-end' | 'flex-start',
  end: (isRTL ? 'flex-start' : 'flex-end') as 'flex-start' | 'flex-end',
  center: 'center' as const,
};

/**
 * Returns RTL-appropriate border radius for chat bubbles
 */
export const rtlBorderRadius = {
  fromMe: {
    borderBottomLeftRadius: isRTL ? 16 : 4,
    borderBottomRightRadius: isRTL ? 4 : 16,
  },
  fromOther: {
    borderBottomLeftRadius: isRTL ? 4 : 16,
    borderBottomRightRadius: isRTL ? 16 : 4,
  },
};

/**
 * Returns RTL-appropriate positioning styles
 */
export const rtlPosition = {
  left: (value: number) => ({ [isRTL ? 'right' : 'left']: value }),
  right: (value: number) => ({ [isRTL ? 'left' : 'right']: value }),
};

/**
 * Returns consistent flex direction for RTL layouts
 * Use this instead of hardcoded flexDirection values for consistency
 */
export const rtlFlexDirection = {
  row: (isRTL ? 'row' : 'row-reverse') as 'row' | 'row-reverse',
  rowReverse: (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse',
  column: 'column' as const,
  columnReverse: 'column-reverse' as const,
};

/**
 * Initialize RTL settings globally
 * Call this once in your app's root component
 * This app is RTL-only, so we always force RTL mode
 */
export const initializeRTL = () => {
  if (Platform.OS !== 'web' && !isExpoGo) {
    try {
      if (!I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      }
    } catch (e) {
      console.error('Failed to initialize RTL:', e);
    }
  }
};

/**
 * Debug helper to check current RTL state
 * Useful for troubleshooting RTL issues across devices
 */
export const getRTLDebugInfo = () => {
  return {
    isRTL: isRTL, // Our hardcoded flag
    i18nIsRTL: I18nManager.isRTL, // React Native's actual flag
    doLeftAndRightSwapInRTL: I18nManager.doLeftAndRightSwapInRTL,
    allowRTL: I18nManager.allowRTL,
    platform: Platform.OS,
    recommendedFlexDirection: rtlFlexDirection.row,
  };
};

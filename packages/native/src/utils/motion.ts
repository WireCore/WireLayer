import { Platform } from 'react-native';

/** The native driver exists only on iOS/Android – on the web Animated runs in JS anyway (no warning). */
export const nativeDriver = Platform.OS !== 'web';

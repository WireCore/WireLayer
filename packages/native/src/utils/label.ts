import { Platform } from 'react-native';

/**
 * Name of a control whose visible text is laid out in several parts (title, time, value): iOS and Android read the
 * given name; the web takes the name from the visible text, so it always contains it (WCAG 2.5.3 – axe joins the parts
 * without spaces and would not find them in an own name).
 */
export const contentName = (name: string): object => (Platform.OS === 'web' ? {} : { 'aria-label': name });

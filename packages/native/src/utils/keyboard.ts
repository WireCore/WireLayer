import { Platform } from 'react-native';

/**
 * react-native-web presses only role="button" with Space; checkboxes and switches toggle with it as well
 * (web keyboard convention). Spread onto the Pressable – `onKeyDown` exists only on the web.
 */
export const toggleOnSpace = (toggle: () => void): object =>
    Platform.OS === 'web'
        ? {
              onKeyDown: (event: { key: string; preventDefault(): void }) => {
                  if (event.key !== ' ') return;
                  event.preventDefault();
                  toggle();
              },
          }
        : {};

/**
 * State of a toggle button: `aria-pressed` on the web; React Native has no pressed state – iOS and Android read it
 * as selected.
 */
export const pressedProps = (pressed: boolean): object =>
    Platform.OS === 'web' ? { 'aria-pressed': pressed } : { accessibilityState: { selected: pressed } };

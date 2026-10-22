import type { ReactNode } from 'react';
import { useLandmarks } from '../../hooks/hotkeys.js';

export interface LandmarkNavigationProps {
    /** Which elements count as landmarks (default: header, nav, main, aside, footer, named regions, search, [data-landmark]) */
    selector?: string;
    /** Key that jumps forward; with Shift backward (default F6) */
    keyName?: string;
    /** Switched off for now */
    disabled?: boolean;
    children?: ReactNode;
}

/** Renders nothing itself: F6 / Shift+F6 move the focus between the landmarks of the page while mounted */
export function LandmarkNavigation({ selector, keyName, disabled, children }: LandmarkNavigationProps) {
    useLandmarks({ selector, key: keyName, enabled: !disabled });
    return <>{children}</>;
}

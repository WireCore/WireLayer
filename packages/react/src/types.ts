import type { ComponentType } from 'react';

/** Any icon component that accepts a className, e.g. a lucide-react icon. */
export type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;

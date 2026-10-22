import type { AvatarSize } from '@wirecore/wirelayer-recipes';
import { createContext } from 'react';

/** Provided by AvatarGroup: the size its avatars inherit. */
export const AvatarGroupContext = createContext<AvatarSize | null>(null);

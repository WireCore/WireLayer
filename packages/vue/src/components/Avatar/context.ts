import type { AvatarSize } from '@wirecore/wirelayer-recipes';
import type { ComputedRef, InjectionKey } from 'vue';

/** Provided by AvatarGroup: the size its avatars inherit. */
export const avatarGroupKey: InjectionKey<ComputedRef<AvatarSize>> = Symbol('AvatarGroup');

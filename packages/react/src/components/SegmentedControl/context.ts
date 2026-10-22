import type { SegmentedControlSize } from '@wirecore/wirelayer-recipes';
import { createContext } from 'react';

/** Provided by SegmentedControl: the size its items use. */
export const SegmentedControlContext = createContext<SegmentedControlSize | null>(null);

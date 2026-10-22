import { spinner, type Size } from '@wirecore/wirelayer-recipes/native';
import { ActivityIndicator, View, type ViewProps } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useTranslations } from '../../locale.js';
import { usePalette } from '../../utils/palette.js';
import { Ring } from '../../utils/Ring.js';

export interface SpinnerProps extends ViewProps {
    size?: Size;
    /** Announced to assistive tech */
    label?: string;
    /** Fixed progress 0–100: draws a filling ring instead (role progressbar with the value) */
    value?: number;
}

/** Loading indicator (role progressbar, busy) with an accessible label – with `value` a small progress ring */
export function Spinner({ size, label: labelProp, value, className, ...props }: SpinnerProps) {
    const styles = spinner({ size });
    const translations = useTranslations();
    const label = labelProp ?? translations.common.loading;
    const icon = useResolveClassNames(styles.icon());
    const palette = usePalette();
    const pixels = typeof icon.width === 'number' ? icon.width : 16;

    if (value !== undefined) {
        const clamped = Math.min(100, Math.max(0, value));
        return (
            <View
                {...props}
                className={styles.base({ class: className })}
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={clamped}
                aria-valuetext={`${Math.round(clamped)} %`}
            >
                <Ring
                    size={pixels}
                    thickness={14}
                    track={palette.track}
                    roundCaps={clamped > 0}
                    segments={[
                        {
                            start: 0,
                            length: clamped / 100,
                            color: typeof icon.color === 'string' ? icon.color : undefined,
                        },
                    ]}
                />
            </View>
        );
    }

    return (
        <View {...props} className={styles.base({ class: className })} role="progressbar" aria-label={label} aria-busy>
            <ActivityIndicator
                color={typeof icon.color === 'string' ? icon.color : undefined}
                size={typeof icon.width === 'number' ? icon.width : 'small'}
                aria-hidden
            />
        </View>
    );
}

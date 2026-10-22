import { formatNumber, formatValue } from '@wirecore/wirelayer-recipes/native';
import { Text, type TextProps } from 'react-native';
import { useLocale } from '../../locale.js';

export interface NumberFormatterProps extends Omit<TextProps, 'children'> {
    value: number | bigint | null | undefined;
    /** Intl options, e.g. `{ style: 'currency', currency: 'EUR' }` */
    formatOptions?: Intl.NumberFormatOptions;
    /** Default: the LocaleProvider's */
    locale?: string;
    className?: string;
}

/** A number in the format of the locale (Intl.NumberFormat): grouping, decimals, currency, percent, units */
export function NumberFormatter({ value, formatOptions, locale, className, ...props }: NumberFormatterProps) {
    const context = useLocale();
    return (
        <Text {...props} className={formatValue({ class: className })}>
            {formatNumber(value, locale ?? context.locale, formatOptions)}
        </Text>
    );
}

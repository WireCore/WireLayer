import {
    formatNumber,
    funnel,
    funnelStages,
    type FunnelStage,
    type VisualTone,
} from '@wirecore/wirelayer-recipes/native';
import { Fragment } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { ChartData, nativeAccessible } from '../../chart/parts.js';
import { useLocale } from '../../locale.js';

export interface FunnelProps extends Omit<ViewProps, 'children'> {
    /** The stages, widest first */
    stages: FunnelStage[];
    /** Title, also the start of the accessible name of the funnel */
    title: string;
    /** The title only for screen readers */
    hideTitle?: boolean;
    /** Colour of the bars (default primary) */
    tone?: VisualTone;
    /** Conversion from the previous stage between the bars (default true) */
    conversion?: boolean;
    /** The stages as a list below (opens on demand) – the text alternative (default true) */
    table?: boolean;
    /** Formats the values (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    className?: string;
}

/** Bars narrowing with the value (an image named by the title and the stages); the list is the text alternative */
export function Funnel({
    stages,
    title,
    hideTitle = false,
    tone = 'primary',
    conversion = true,
    table = true,
    formatValue,
    className,
    ...props
}: FunnelProps) {
    const { locale, translations } = useLocale();
    const t = translations.chart;
    const styles = funnel({ tone });
    const format = formatValue ?? ((value: number) => formatNumber(value, locale));
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
    const rows = funnelStages(stages).map((stage) => ({
        ...stage,
        text: format(stage.value),
        conversionText: stage.fromPrevious === undefined ? undefined : percent.format(stage.fromPrevious),
    }));
    const summary = `${title}: ${rows.map((row) => `${row.label} ${row.text}`).join(', ')}`;
    return (
        <View {...props} className={styles.base({ class: className })}>
            {!hideTitle && (
                <Text className={styles.title()} aria-hidden>
                    {title}
                </Text>
            )}
            <View role="img" aria-label={summary} {...nativeAccessible} className={styles.stages()}>
                {rows.map((row, index) => (
                    <Fragment key={`${row.label}-${index}`}>
                        {conversion && !!row.conversionText && (
                            <View className={styles.conversionRow()}>
                                <View className={styles.conversionStart()} />
                                <Text className={styles.conversion()}>{t.fromPrevious(row.conversionText)}</Text>
                                <View className={styles.conversionEnd()} />
                            </View>
                        )}
                        <View className={styles.stage()}>
                            <Text className={styles.label()} numberOfLines={2}>
                                {row.label}
                            </Text>
                            <View className={styles.track()}>
                                <View className={styles.bar()} style={{ width: `${row.width}%` }} />
                            </View>
                            <Text className={styles.value()} numberOfLines={1}>
                                {row.text}
                            </Text>
                        </View>
                    </Fragment>
                ))}
            </View>
            {table && (
                <ChartData
                    label={title}
                    rows={rows.map((row) => ({
                        label: row.label,
                        values: [
                            { name: t.value, value: row.text },
                            { name: t.conversion, value: row.conversionText ?? '–' },
                        ],
                    }))}
                />
            )}
        </View>
    );
}

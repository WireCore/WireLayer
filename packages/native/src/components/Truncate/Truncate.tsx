import { truncate } from '@wirecore/wirelayer-recipes/native';
import { useId, useState } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useControllable } from '../../utils/useControllable.js';
import { Tooltip } from '../Tooltip/Tooltip.js';

export interface TruncateProps extends ViewProps {
    text: string;
    /** Lines before the text is cut (default 1) */
    lines?: number;
    /** The full text on a long press (or hover/focus on the web), only while cut (default true) */
    tooltip?: boolean;
    /** "Show more" below the cut text instead of the tooltip */
    expandable?: boolean;
    expanded?: boolean;
    defaultExpanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    /** Text of the button while cut (default "Show more") */
    moreLabel?: string;
    /** Text of the button while expanded (default "Show less") */
    lessLabel?: string;
    className?: string;
}

/**
 * Cuts a text after a number of lines (numberOfLines) – with "Show more" or the full text as tooltip. Measures
 * whether it is really cut; screen readers always read the full text.
 */
export function Truncate({
    text,
    lines = 1,
    tooltip = true,
    expandable = false,
    expanded: expandedProp,
    defaultExpanded = false,
    onExpandedChange,
    moreLabel,
    lessLabel,
    className,
    ...props
}: TruncateProps) {
    const translations = useTranslations();
    const styles = truncate();
    const id = `${useId()}text`;
    const [expanded, setExpanded] = useControllable(expandedProp, defaultExpanded, onExpandedChange);
    const [heights, setHeights] = useState({ full: 0, shown: 0 });
    const cut = heights.full > heights.shown + 1;
    const open = expandable && expanded;

    const shown = (
        <Text
            nativeID={id}
            className={styles.text()}
            numberOfLines={open ? undefined : lines}
            // Screen readers get the whole text even while it is cut
            aria-label={cut && !open ? text : undefined}
            onLayout={(event) => {
                const height = event.nativeEvent.layout.height;
                if (height !== heights.shown) setHeights((current) => ({ ...current, shown: height }));
            }}
        >
            {text}
        </Text>
    );

    return (
        <View {...props} className={styles.base({ class: className })}>
            <View>
                {/* The whole text, invisible – its height says whether the shown one is cut */}
                <Text
                    className={styles.text({ class: styles.measure() })}
                    aria-hidden
                    pointerEvents="none"
                    onLayout={(event) => {
                        const height = event.nativeEvent.layout.height;
                        if (height !== heights.full) setHeights((current) => ({ ...current, full: height }));
                    }}
                >
                    {text}
                </Text>
                {tooltip && !expandable && cut ? <Tooltip content={text}>{shown}</Tooltip> : shown}
            </View>
            {expandable && (cut || open) && (
                <Pressable
                    role="button"
                    aria-expanded={open}
                    {...({ 'aria-controls': id } as object)}
                    className={styles.toggle()}
                    onPress={() => setExpanded(!open)}
                >
                    <Text className={styles.toggleLabel()}>
                        {open ? (lessLabel ?? translations.truncate.less) : (moreLabel ?? translations.truncate.more)}
                    </Text>
                </Pressable>
            )}
        </View>
    );
}

import { formatCount, tabs } from '@wirecore/wirelayer-recipes/native';
import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type PressableProps, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';

interface TabsContextValue {
    value: string | null;
    select: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue>({ value: null, select: () => {} });

export interface TabsProps extends ViewProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string | null) => void;
    /** Accessible name of the tab list */
    label?: string;
    /** TabsList with the triggers, then one TabsContent per tab */
    children?: ReactNode;
}

/** Tab panels: TabsList with TabsTrigger buttons (role tab) and one TabsContent per tab; only the selected one is rendered */
export function Tabs({ value, defaultValue, onValueChange, label, className, children, ...props }: TabsProps) {
    const [current, setCurrent] = useControllable<string | null>(value, defaultValue ?? null, onValueChange);

    return (
        <TabsContext.Provider value={{ value: current, select: setCurrent }}>
            <View {...props} className={tabs().base({ class: className })} aria-label={label}>
                {children}
            </View>
        </TabsContext.Provider>
    );
}

export interface TabsListProps extends ViewProps {
    /** Scrolls sideways when the tabs do not fit (many tabs on a narrow screen) */
    scrollable?: boolean;
}

/** The row of tab buttons */
export function TabsList({ scrollable = false, className, children, ...props }: TabsListProps) {
    const styles = tabs();
    if (!scrollable)
        return (
            <View role="tablist" {...props} className={styles.list({ class: className })}>
                {children}
            </View>
        );
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className={styles.scroller({ class: className })}
            contentContainerClassName={styles.scrollList()}
        >
            <View role="tablist" {...props} className={styles.scrollList()}>
                {children}
            </View>
        </ScrollView>
    );
}

export interface TabsTriggerProps extends Omit<PressableProps, 'children'> {
    value: string;
    /** Icon component before the label */
    icon?: IconComponent;
    /** Count (99+) or short text after the label, e.g. open items – part of the accessible name */
    badge?: number | string;
    className?: string;
    children?: ReactNode;
}

/** A tab button (role tab, aria-selected) with optional icon and badge */
export function TabsTrigger({ value, icon, badge, className, children, ...props }: TabsTriggerProps) {
    const context = useContext(TabsContext);
    const selected = context.value === value;
    const styles = tabs({ selected });
    const shownBadge = typeof badge === 'number' ? (badge > 0 ? formatCount(badge) : '') : (badge ?? '');

    return (
        <Pressable
            role="tab"
            {...props}
            className={styles.trigger({ class: className })}
            aria-selected={selected}
            onPress={() => context.select(value)}
        >
            {icon && <Icon icon={icon} className={styles.icon()} />}
            {typeof children === 'string' ? <Text className={styles.label()}>{children}</Text> : children}
            {!!shownBadge && (
                <View className={styles.badge()}>
                    <Text className={styles.badgeLabel()}>{shownBadge}</Text>
                </View>
            )}
        </Pressable>
    );
}

export interface TabsContentProps extends ViewProps {
    value: string;
}

/** Only the selected panel is rendered */
export function TabsContent({ value, className, ...props }: TabsContentProps) {
    const context = useContext(TabsContext);
    if (context.value !== value) return null;
    return <View role="tabpanel" {...props} className={tabs().content({ class: className })} />;
}

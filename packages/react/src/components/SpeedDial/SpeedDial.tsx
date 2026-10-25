import { Menu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import {
    speedDial as speedDialRecipe,
    speedDialPositions,
    type RecipeClasses,
    type SpeedDialDirection,
    type SpeedDialLayout,
} from '@wirecore/wirelayer-recipes';
import { Plus } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { IconComponent } from '../../types.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SpeedDialItem {
    value: string;
    label: string;
    icon: IconComponent;
    disabled?: boolean;
}

export interface SpeedDialProps {
    items: readonly SpeedDialItem[];
    /** Accessible name of the main button */
    label?: string;
    /**
     * `column` (default): above the button with visible labels; `circle`, `semicircle`, `quarter`: around it, the
     * labels show as tooltips on hover and focus
     */
    layout?: SpeedDialLayout;
    /** Where the actions open: up (default), down; for semicircle and quarter also left or right */
    direction?: SpeedDialDirection;
    /** Distance of the actions from the centre of the button in px (circle layouts, default 80) */
    radius?: number;
    onSelect?: (value: string) => void;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof speedDialRecipe>;
}

/**
 * A menu button: the actions open above it (or in a circle around it) as menu items with their labels (arrow keys,
 * Escape)
 */
export function SpeedDial({
    classes,
    items,
    label: labelProp,
    layout = 'column',
    direction = 'up',
    radius = 80,
    onSelect,
    className,
    style,
}: SpeedDialProps) {
    const speedDial = useRecipe('speedDial', speedDialRecipe, classes);
    const styles = speedDial(layout === 'column' ? undefined : { layout });
    const translations = useTranslations();
    const { dir } = useLocale();
    const label = labelProp ?? translations.speedDial.label;
    // Around the button: the content is a point on its centre (placement top, gutter minus half the 56px button)
    const positioning =
        layout === 'column'
            ? { placement: direction === 'down' ? ('bottom-end' as const) : ('top-end' as const), gutter: 12 }
            : { placement: 'top' as const, gutter: -28 };
    const offsets =
        layout === 'column' ? [] : speedDialPositions(items.length, layout, direction, radius, dir === 'rtl');
    return (
        <Menu.Root positioning={positioning} lazyMount unmountOnExit onSelect={(details) => onSelect?.(details.value)}>
            <Menu.Trigger className={styles.trigger({ class: className })} style={style} aria-label={label}>
                <Menu.Context>
                    {(api) => (
                        <Plus
                            className={styles.triggerIcon()}
                            data-state={api.open ? 'open' : 'closed'}
                            aria-hidden="true"
                        />
                    )}
                </Menu.Context>
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content className={styles.content()}>
                        {items.map((item, index) => {
                            const Icon = item.icon;
                            const offset = offsets[index];
                            return (
                                <Menu.Item
                                    key={item.value}
                                    value={item.value}
                                    disabled={item.disabled}
                                    className={styles.item()}
                                    style={
                                        offset
                                            ? ({
                                                  '--wc-x': `${offset.x}px`,
                                                  '--wc-y': `${offset.y}px`,
                                              } as CSSProperties)
                                            : undefined
                                    }
                                >
                                    <span className={styles.label()}>{item.label}</span>
                                    <span className={styles.action()} aria-hidden="true">
                                        <Icon className={styles.actionIcon()} />
                                    </span>
                                </Menu.Item>
                            );
                        })}
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    );
}

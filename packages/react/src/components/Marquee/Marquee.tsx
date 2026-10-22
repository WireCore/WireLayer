import { Marquee as ArkMarquee } from '@ark-ui/react/marquee';
import { marquee as marqueeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Pause, Play } from 'lucide-react';
import { useState, type ComponentProps, type FocusEvent } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface MarqueeProps extends ComponentProps<'div'> {
    /** Accessible name of the region, e.g. "Partners" (default "Ticker") */
    label?: string;
    /** Direction the content moves to: start (default), end, top or bottom */
    side?: 'start' | 'end' | 'top' | 'bottom';
    /** Speed in px per second (default 50) */
    speed?: number;
    /** Space between the items, a CSS length (default "1rem") */
    spacing?: string;
    /** Repeats the content until the band is full (default true) */
    autoFill?: boolean;
    reverse?: boolean;
    /** Paused (controlled) – the pause button sets it, hover/focus pause on top of it */
    paused?: boolean;
    onPausedChange?: (paused: boolean) => void;
    /** Stops while the pointer is over the band or the focus is in it (default true) */
    pauseOnHover?: boolean;
    /** Button to pause and resume (WCAG 2.2.2, default true) */
    pauseButton?: boolean;
    /** Fades the content out at the edges */
    fade?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof marqueeRecipe>;
}

/**
 * Moving band (region, named by the label): moves only without reduced motion; the pause button comes first,
 * hover and focus stop it, too. The items are repeated (copies hidden from screen readers) – no links or buttons.
 */
export function Marquee({
    classes,
    label,
    side = 'start',
    speed = 50,
    spacing = '1rem',
    autoFill = true,
    reverse,
    paused,
    onPausedChange,
    pauseOnHover = true,
    pauseButton = true,
    fade,
    className,
    children,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...props
}: MarqueeProps) {
    const marquee = useRecipe('marquee', marqueeRecipe, classes);
    const styles = marquee();
    const t = useTranslations().marquee;
    const [internal, setInternal] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const userPaused = paused ?? internal;
    const stopped = userPaused || (pauseOnHover && (hovered || focused));
    const horizontal = side === 'start' || side === 'end';
    const toggle = () => {
        setInternal(!userPaused);
        onPausedChange?.(!userPaused);
    };
    return (
        <div
            {...props}
            className={styles.base({ class: className })}
            onMouseEnter={(event) => {
                setHovered(true);
                onMouseEnter?.(event);
            }}
            onMouseLeave={(event) => {
                setHovered(false);
                onMouseLeave?.(event);
            }}
            onFocus={(event) => {
                setFocused(true);
                onFocus?.(event);
            }}
            onBlur={(event: FocusEvent<HTMLDivElement>) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
                onBlur?.(event);
            }}
        >
            {pauseButton && (
                <IconButton
                    icon={userPaused ? Play : Pause}
                    label={userPaused ? t.play : t.pause}
                    variant="text"
                    size="sm"
                    onClick={toggle}
                />
            )}
            <ArkMarquee.Root
                className={styles.root()}
                paused={stopped}
                side={side}
                speed={speed}
                spacing={spacing}
                autoFill={autoFill}
                reverse={reverse}
                translations={{ root: label ?? t.label }}
            >
                {fade && horizontal && <ArkMarquee.Edge side="start" className={styles.edge()} />}
                <ArkMarquee.Viewport className={styles.viewport()}>
                    <ArkMarquee.Content className={styles.content()}>{children}</ArkMarquee.Content>
                </ArkMarquee.Viewport>
                {fade && horizontal && <ArkMarquee.Edge side="end" className={styles.edge()} />}
            </ArkMarquee.Root>
        </div>
    );
}

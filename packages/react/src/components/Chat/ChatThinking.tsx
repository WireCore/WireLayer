import { chatDetails as chatDetailsRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Brain, ChevronRight, LoaderCircle } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ChatThinkingProps extends Omit<ComponentProps<'details'>, 'children'> {
    /** Still thinking: "Thinking …" with a spinner, aria-busy */
    active?: boolean;
    /** The reasoning (plain text; children replace it) */
    text?: string;
    /** Seconds it took – shown when done */
    duration?: number;
    /** Open at first */
    defaultOpen?: boolean;
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatDetailsRecipe>;
}

/** The reasoning of an answer: collapsed by default, "Thinking …" while it is being written */
export function ChatThinking({
    active,
    text,
    duration,
    defaultOpen,
    children,
    classes,
    className,
    ...props
}: ChatThinkingProps) {
    const chatDetails = useRecipe('chatDetails', chatDetailsRecipe, classes);
    const t = useLocale().translations.chatThinking;
    const styles = chatDetails({ status: active ? 'running' : 'none' });
    const Icon = active ? LoaderCircle : Brain;
    return (
        <details
            {...props}
            className={styles.base({ class: className })}
            open={defaultOpen || undefined}
            aria-busy={active || undefined}
        >
            <summary className={styles.summary()}>
                <ChevronRight className={styles.chevron()} aria-hidden="true" />
                <Icon className={styles.icon()} aria-hidden="true" />
                <span className={styles.title()}>{active ? t.active : t.done}</span>
                {!active && duration !== undefined && <span className={styles.badge()}>{t.duration(duration)}</span>}
            </summary>
            {(text || children) && (
                <div className={styles.content()}>{children ?? <p className={styles.text()}>{text}</p>}</div>
            )}
        </details>
    );
}

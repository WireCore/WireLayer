import { chatDetails as chatDetailsRecipe, sourceHost, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronRight, Link } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

/** A source of an answer */
export interface ChatSource {
    title: string;
    href: string;
    /** Short excerpt or description */
    description?: string;
}

export interface ChatSourcesProps extends Omit<ComponentProps<'details'>, 'children' | 'title'> {
    sources: ChatSource[];
    /** Summary text (default "3 sources") */
    title?: string;
    /** Open at first */
    defaultOpen?: boolean;
    /** target of the links, e.g. "_blank" */
    linkTarget?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatDetailsRecipe>;
}

/** Sources of an answer: a disclosure (<details>) with a list of links */
export function ChatSources({
    sources,
    title,
    defaultOpen,
    linkTarget,
    classes,
    className,
    ...props
}: ChatSourcesProps) {
    const chatDetails = useRecipe('chatDetails', chatDetailsRecipe, classes);
    const locale = useLocale();
    const styles = chatDetails();
    return (
        <details {...props} className={styles.base({ class: className })} open={defaultOpen || undefined}>
            <summary className={styles.summary()}>
                <ChevronRight className={styles.chevron()} aria-hidden="true" />
                <Link className={styles.icon()} aria-hidden="true" />
                <span className={styles.title()}>{title ?? locale.translations.chatSources.title(sources.length)}</span>
            </summary>
            <div className={styles.content()}>
                <ol className={styles.list()}>
                    {sources.map((source) => (
                        <li key={source.href}>
                            <a
                                href={source.href}
                                className={styles.link()}
                                target={linkTarget}
                                rel={linkTarget ? 'noopener noreferrer' : undefined}
                            >
                                {source.title}
                            </a>
                            <span className={styles.host()}>{` · ${sourceHost(source.href)}`}</span>
                            {source.description && <p className={styles.description()}>{source.description}</p>}
                        </li>
                    ))}
                </ol>
            </div>
        </details>
    );
}

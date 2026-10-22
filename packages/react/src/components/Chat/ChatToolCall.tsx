import { chatDetails as chatDetailsRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronRight, CircleCheck, CircleX, LoaderCircle, Wrench } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ChatToolCallProps extends Omit<ComponentProps<'details'>, 'children'> {
    /** Name of the tool, e.g. "Get weather" */
    name: string;
    /** running, done or error – shown as icon and text */
    status?: 'running' | 'done' | 'error';
    /** Arguments of the call (objects are shown as JSON) */
    input?: unknown;
    /** Result of the call (objects are shown as JSON) */
    output?: unknown;
    /** Open at first */
    defaultOpen?: boolean;
    /** More content inside */
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatDetailsRecipe>;
}

const icons = { running: LoaderCircle, done: CircleCheck, error: CircleX };
const show = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value, null, 2));

/** A tool call of an assistant: name and status in the summary, arguments and result inside */
export function ChatToolCall({
    name,
    status = 'done',
    input,
    output,
    defaultOpen,
    children,
    classes,
    className,
    ...props
}: ChatToolCallProps) {
    const chatDetails = useRecipe('chatDetails', chatDetailsRecipe, classes);
    const t = useLocale().translations.chatToolCall;
    const styles = chatDetails({ status });
    const StatusIcon = icons[status];
    return (
        <details {...props} className={styles.base({ class: className })} open={defaultOpen || undefined}>
            <summary className={styles.summary()}>
                <ChevronRight className={styles.chevron()} aria-hidden="true" />
                <Wrench className={chatDetails().icon()} aria-hidden="true" />
                <span className={styles.title()}>{t.title(name)}</span>
                <StatusIcon className={styles.icon()} aria-hidden="true" />
                <span className={styles.badge()}>{t.status[status]}</span>
            </summary>
            {(input !== undefined || output !== undefined || children) && (
                <div className={styles.content()}>
                    {input !== undefined && (
                        <>
                            <div className={styles.label()}>{t.input}</div>
                            <pre className={styles.pre()}>{show(input)}</pre>
                        </>
                    )}
                    {output !== undefined && (
                        <>
                            <div className={styles.label()}>{t.output}</div>
                            <pre className={styles.pre()}>{show(output)}</pre>
                        </>
                    )}
                    {children}
                </div>
            )}
        </details>
    );
}

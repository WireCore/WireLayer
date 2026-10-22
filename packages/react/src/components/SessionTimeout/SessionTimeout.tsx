import {
    formatRemaining,
    sessionTimeout as sessionTimeoutRecipe,
    sessionTimeoutState,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../Button/Button.js';
import { Dialog, DialogContent } from '../Dialog/Dialog.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SessionTimeoutProps {
    /** When the session ends: ISO text, timestamp or Date – set it anew after extending */
    expiresAt: string | number | Date;
    /** Seconds before the end the warning opens (default 120 – WCAG 2.2.1 asks for at least 20) */
    warnBefore?: number;
    /** Heading of the warning */
    title?: string;
    /** Text of the warning */
    description?: string;
    /** "Stay signed in": extend the session and pass the new expiresAt */
    onExtend?: () => void;
    /** "Sign out" in the warning */
    onSignOut?: () => void;
    /** The time ran out */
    onExpire?: () => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sessionTimeoutRecipe>;
}

/**
 * Session timeout warning (WCAG 2.2.1): an alert dialog shortly before the session ends, with the time left and one
 * action to stay signed in; after the end it says so.
 */
export function SessionTimeout({
    expiresAt,
    warnBefore = 120,
    title,
    description,
    onExtend,
    onSignOut,
    onExpire,
    classes,
}: SessionTimeoutProps) {
    const sessionTimeout = useRecipe('sessionTimeout', sessionTimeoutRecipe, classes);
    const t = useLocale().translations.sessionTimeout;
    const styles = sessionTimeout();
    // The clock runs only in the browser – the server renders nothing
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => {
        const tick = () => setNow(Date.now());
        const first = setTimeout(tick);
        const timer = setInterval(tick, 1000);
        return () => {
            clearTimeout(first);
            clearInterval(timer);
        };
    }, []);
    const expires = new Date(expiresAt).getTime();
    const state = now === null ? null : sessionTimeoutState(expires, now, warnBefore * 1000);
    // Closed by the user (Escape, "Close") – opens again for the next expiry time
    const [dismissed, setDismissed] = useState(false);
    const [lastExpires, setLastExpires] = useState(expires);
    if (lastExpires !== expires) {
        setLastExpires(expires);
        setDismissed(false);
    }
    const open = !!state && (state.warn || state.expired) && !dismissed;
    const expireRef = useRef(onExpire);
    useEffect(() => {
        expireRef.current = onExpire;
    });
    const expired = !!state?.expired;
    useEffect(() => {
        if (expired) expireRef.current?.();
    }, [expired]);

    return (
        <Dialog open={open} role="alertdialog" onOpenChange={(value) => !value && setDismissed(true)}>
            {state && (
                <DialogContent
                    title={state.expired ? t.expiredTitle : (title ?? t.title)}
                    description={state.expired ? t.expired : (description ?? t.description)}
                    icon={Clock}
                    status={state.expired ? 'danger' : 'warn'}
                    size="sm"
                    footer={
                        state.expired ? (
                            <Button size="sm" onClick={() => setDismissed(true)}>
                                {t.close}
                            </Button>
                        ) : (
                            <>
                                {/* The safe action first: it takes the focus when the warning opens */}
                                <Button size="sm" onClick={() => onExtend?.()}>
                                    {t.extend}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setDismissed(true);
                                        onSignOut?.();
                                    }}
                                >
                                    {t.signOut}
                                </Button>
                            </>
                        )
                    }
                >
                    {!state.expired && (
                        <div className={styles.base()}>
                            <span className={styles.text()}>{t.remaining}</span>
                            <span role="timer" className={styles.remaining()}>
                                {formatRemaining(state.remaining)}
                            </span>
                        </div>
                    )}
                </DialogContent>
            )}
        </Dialog>
    );
}

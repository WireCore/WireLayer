import { formatRemaining, sessionTimeout, sessionTimeoutState, toDate } from '@wirecore/wirelayer-recipes/native';
import { Clock } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, Text } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Button } from '../Button/Button.js';
import { Dialog } from '../Dialog/Dialog.js';

export interface SessionTimeoutProps {
    /** End of the session – set it anew after extending (e.g. from the server's session) */
    expiresAt: string | number | Date;
    /** Seconds before the end the warning opens (default 120; WCAG 2.2.1 asks for at least 20) */
    warnBefore?: number;
    /** Heading of the warning */
    title?: string;
    /** Text of the warning */
    description?: string;
    /** "Stay signed in" – extend the session and pass the new `expiresAt` */
    onExtend?: () => void;
    /** "Sign out" */
    onSignOut?: () => void;
    /** The time ran out (once per `expiresAt`) */
    onExpire?: () => void;
}

/**
 * Warns before the session ends (WCAG 2.2.1) with the time left and the choice to stay signed in – an alertdialog
 * whose first button is the safe choice. The time is measured from the clock, so it is right after the app was in
 * the background, too.
 */
export function SessionTimeout({
    expiresAt,
    warnBefore = 120,
    title,
    description,
    onExtend,
    onSignOut,
    onExpire,
}: SessionTimeoutProps) {
    const translations = useTranslations();
    const texts = translations.sessionTimeout;
    const styles = sessionTimeout();
    const end = toDate(expiresAt).getTime();
    const [now, setNow] = useState<number | null>(null);
    const [dismissed, setDismissed] = useState<number | null>(null);
    const expiredFor = useRef<number | null>(null);
    const extend = useRef<ComponentRef<typeof Pressable>>(null);

    useEffect(() => {
        const tick = () => setNow(Date.now());
        const first = setTimeout(tick, 0);
        const timer = setInterval(tick, 1000);
        return () => {
            clearTimeout(first);
            clearInterval(timer);
        };
    }, []);

    const state = now === null ? null : sessionTimeoutState(end, now, warnBefore * 1000);
    useEffect(() => {
        if (!state?.expired || expiredFor.current === end) return;
        expiredFor.current = end;
        onExpire?.();
    }, [state?.expired, end, onExpire]);

    if (!state) return null;
    const open = (state.warn || state.expired) && dismissed !== end;
    const close = () => setDismissed(end);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) close();
            }}
            role="alertdialog"
            status={state.expired ? 'danger' : 'warn'}
            icon={Clock}
            size="sm"
            closeOnInteractOutside={false}
            closeLabel={texts.close}
            title={state.expired ? texts.expiredTitle : (title ?? texts.title)}
            description={state.expired ? texts.expired : (description ?? texts.description)}
            initialFocusRef={state.expired ? undefined : extend}
            footer={
                state.expired ? (
                    <Button variant="primary" size="sm" onPress={close}>
                        {texts.close}
                    </Button>
                ) : (
                    <>
                        <Button ref={extend} variant="primary" size="sm" onPress={() => onExtend?.()}>
                            {texts.extend}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onPress={() => {
                                close();
                                onSignOut?.();
                            }}
                        >
                            {texts.signOut}
                        </Button>
                    </>
                )
            }
        >
            {!state.expired && (
                <>
                    <Text className={styles.remaining()}>{texts.remaining}</Text>
                    <Text role="timer" className={styles.timer()}>
                        {formatRemaining(state.remaining)}
                    </Text>
                </>
            )}
        </Dialog>
    );
}

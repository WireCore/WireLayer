import { saveStatus, type SaveStatusState } from '@wirecore/wirelayer-recipes/native';
import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { ActivityIndicator, Text, View, type ViewProps } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';

export type SaveStatusTranslations = Record<SaveStatusState, string>;

export interface SaveStatusProps extends ViewProps {
    /** idle (nothing shown), saving, saved or error */
    status?: SaveStatusState;
    /** Own text per state */
    translations?: Partial<SaveStatusTranslations>;
    className?: string;
}

/** State of an autosave ("Saving …", "Saved") – a live region, so changes are announced */
export function SaveStatus({ status = 'idle', translations: texts, className, ...props }: SaveStatusProps) {
    const translations = useTranslations();
    const styles = saveStatus({ status });
    const spinner = useResolveClassNames(styles.icon());
    const label = texts?.[status] ?? translations.saveStatus[status];
    return (
        <View role="status" {...props} className={styles.base({ class: className })}>
            {status === 'saving' && (
                <ActivityIndicator
                    size="small"
                    color={typeof spinner.color === 'string' ? spinner.color : undefined}
                    aria-hidden
                />
            )}
            {status === 'saved' && <Icon icon={CircleCheck} className={styles.icon()} />}
            {status === 'error' && <Icon icon={CircleAlert} className={styles.icon()} />}
            {!!label && <Text className={styles.label()}>{label}</Text>}
        </View>
    );
}

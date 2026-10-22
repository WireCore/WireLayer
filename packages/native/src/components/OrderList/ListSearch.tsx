import { listSearch } from '@wirecore/wirelayer-recipes/native';
import { Search } from 'lucide-react-native';
import { TextInput, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';

/** Search field above a list of OrderList and PickList; its name says which list it searches */
export function ListSearch({
    value,
    onChangeText,
    label,
    disabled = false,
}: {
    value: string;
    onChangeText: (text: string) => void;
    /** Accessible name, e.g. "Search Available" */
    label: string;
    disabled?: boolean;
}) {
    const styles = listSearch();
    const t = useTranslations();
    const muted = useResolveClassNames('text-muted');
    return (
        <View className={styles.base()}>
            <Icon icon={Search} className={styles.icon()} />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                aria-label={label}
                placeholder={t.combobox.search}
                placeholderTextColor={typeof muted.color === 'string' ? muted.color : undefined}
                autoCorrect={false}
                autoCapitalize="none"
                editable={!disabled}
                className={styles.control()}
            />
        </View>
    );
}

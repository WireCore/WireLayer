// A labeled box for the layout stories
import { View } from 'react-native';
import { Text } from '../src/components/Text/Text.js';

export function Box({ label }: { label: string }) {
    return (
        <View className="rounded-lg border border-line bg-card p-3">
            <Text>{label}</Text>
        </View>
    );
}

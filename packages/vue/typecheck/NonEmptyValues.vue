<script setup lang="ts">
// Type test, checked by vue-tsc in `pnpm typecheck` (not part of the package): choices that cannot be empty
// (required, no placeholder, emptyFallback, emptyValue) give v-model their value type without null or ''
import { ref } from 'vue';
import NativeSelect from '../src/components/NativeSelect/NativeSelect.vue';
import NumberInput from '../src/components/NumberInput/NumberInput.vue';
import RadioGroup from '../src/components/RadioGroup/RadioGroup.vue';
import RadioGroupItem from '../src/components/RadioGroup/RadioGroupItem.vue';
import SegmentedControl from '../src/components/SegmentedControl/SegmentedControl.vue';
import SegmentedControlItem from '../src/components/SegmentedControl/SegmentedControlItem.vue';
import Select from '../src/components/Select/Select.vue';

type Protocol = 'ssh' | 'sftp';
const protocol = ref<Protocol>('ssh');
const port = ref(22);
const service = ref('');
const protocols: { value: Protocol; label: string }[] = [
    { value: 'ssh', label: 'SSH' },
    { value: 'sftp', label: 'SFTP' },
];
const setProtocol = (value: Protocol) => (protocol.value = value);
const setPort = (value: number) => (port.value = value);
const setService = (value: string) => (service.value = value);
</script>

<template>
    <RadioGroup required label="Protocol" :model-value="protocol" @update:model-value="setProtocol">
        <RadioGroupItem value="ssh">SSH</RadioGroupItem>
    </RadioGroup>
    <SegmentedControl required label="Protocol" :model-value="protocol" @update:model-value="setProtocol">
        <SegmentedControlItem value="ssh">SSH</SegmentedControlItem>
    </SegmentedControl>
    <NativeSelect aria-label="Protocol" :items="protocols" :model-value="protocol" @update:model-value="setProtocol" />
    <NumberInput aria-label="Port" empty-fallback="previous" :model-value="port" @update:model-value="setPort" />
    <Select
        aria-label="Service"
        :items="['web', 'mail']"
        empty-value=""
        :model-value="service"
        @update:model-value="setService"
    />
    <!-- Without the opt-ins the empty value stays in the type -->
    <!-- @vue-expect-error null is not a Protocol -->
    <RadioGroup label="Protocol" :model-value="protocol" @update:model-value="setProtocol" />
    <!-- @vue-expect-error '' is not a Protocol -->
    <NativeSelect placeholder="Choose" :items="protocols" :model-value="protocol" @update:model-value="setProtocol" />
    <!-- @vue-expect-error null is not a number -->
    <NumberInput aria-label="Port" :model-value="port" @update:model-value="setPort" />
    <!-- @vue-expect-error null is not a string -->
    <Select aria-label="Service" :items="['web', 'mail']" :model-value="service" @update:model-value="setService" />
</template>

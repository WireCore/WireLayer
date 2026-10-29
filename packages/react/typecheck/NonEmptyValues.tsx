// Type test, checked by tsc in `pnpm typecheck` (not part of the package): choices that cannot be empty (required, no
// placeholder, emptyFallback, emptyValue) give onValueChange their value type without null or ''
import { useState } from 'react';
import { NativeSelect } from '../src/components/NativeSelect/NativeSelect.js';
import { NumberInput } from '../src/components/NumberInput/NumberInput.js';
import { RadioGroup } from '../src/components/RadioGroup/RadioGroup.js';
import { SegmentedControl } from '../src/components/SegmentedControl/SegmentedControl.js';
import { Select } from '../src/components/Select/Select.js';

type Protocol = 'ssh' | 'sftp';
const protocols: { value: Protocol; label: string }[] = [
    { value: 'ssh', label: 'SSH' },
    { value: 'sftp', label: 'SFTP' },
];

export function NonEmptyValues() {
    const [protocol, setProtocol] = useState<Protocol>('ssh');
    const [port, setPort] = useState(22);
    const [service, setService] = useState('');
    return (
        <>
            <RadioGroup required label="Protocol" value={protocol} onValueChange={setProtocol} />
            <SegmentedControl required label="Protocol" value={protocol} onValueChange={setProtocol} />
            <NativeSelect aria-label="Protocol" items={protocols} value={protocol} onValueChange={setProtocol} />
            <NumberInput aria-label="Port" emptyFallback="previous" value={port} onValueChange={setPort} />
            <Select
                aria-label="Service"
                items={['web', 'mail']}
                emptyValue=""
                value={service}
                onValueChange={setService}
            />
            {/* Without the opt-ins the empty value stays in the type */}
            {/* @ts-expect-error null is not a Protocol */}
            <RadioGroup label="Protocol" value={protocol} onValueChange={setProtocol} />
            {/* @ts-expect-error '' is not a Protocol */}
            <NativeSelect placeholder="Choose" items={protocols} value={protocol} onValueChange={setProtocol} />
            {/* @ts-expect-error null is not a number */}
            <NumberInput aria-label="Port" value={port} onValueChange={setPort} />
            {/* @ts-expect-error null is not a string */}
            <Select aria-label="Service" items={['web', 'mail']} value={service} onValueChange={setService} />
        </>
    );
}

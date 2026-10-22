import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { PhoneInput, type PhoneInputProps } from './PhoneInput.js';

/** A number of the story's country, so value and country match */
const sample = (country?: string) => (country === 'CH' ? '+41441234567' : '+4930123456');

function Demo(args: PhoneInputProps) {
    const [value, setValue] = useState(sample(args.defaultCountry));
    const [country, setCountry] = useState(args.defaultCountry ?? 'DE');
    const [valid, setValid] = useState(true);
    return (
        <div className="flex w-[420px] flex-col gap-3">
            <Field
                label="Phone"
                helperText="With country code, e.g. +43 …"
                error={valid ? undefined : 'Enter a valid phone number'}
            >
                <PhoneInput
                    {...args}
                    value={value}
                    onValueChange={setValue}
                    country={country}
                    onCountryChange={setCountry}
                    onValidChange={setValid}
                />
            </Field>
            <span className="font-mono text-xs text-muted">
                E.164: {value || '–'} · Country: {country}
            </span>
        </div>
    );
}

const meta = {
    title: 'Forms/PhoneInput',
    component: PhoneInput,
    args: { defaultCountry: 'DE', disabled: false },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof PhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Country with flag and calling code (searchable), the number formatted for it; the value is E.164 */
export const Playground: Story = {};

/** Own list of countries */
export const CountryList: Story = {
    name: 'Country list',
    args: {
        defaultCountry: 'CH',
        countries: [
            { code: 'DE', dial: '49', pattern: 'xxx xxxxxxxx', length: [6, 11] },
            { code: 'AT', dial: '43', pattern: 'xxx xxxxxxx', length: [6, 13] },
            { code: 'CH', dial: '41', pattern: 'xx xxx xx xx', length: [9, 9] },
        ],
    },
};

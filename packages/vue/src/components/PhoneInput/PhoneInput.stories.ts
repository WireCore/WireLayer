import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import PhoneInput from './PhoneInput.vue';

/** A number of the story's country, so value and country match */
const sample = (country?: string) => (country === 'CH' ? '+41441234567' : '+4930123456');

const meta = {
    title: 'Forms/PhoneInput',
    component: PhoneInput,
    args: { defaultCountry: 'DE', disabled: false },
    render: (args) => ({
        components: { Field, PhoneInput },
        setup: () => ({
            args,
            value: ref(sample(args.defaultCountry)),
            country: ref(args.defaultCountry ?? 'DE'),
            valid: ref(true),
        }),
        template: `
            <div class="flex w-[420px] flex-col gap-3">
                <Field label="Phone" helper-text="With country code, e.g. +43 …" :error="valid ? undefined : 'Enter a valid phone number'">
                    <PhoneInput v-bind="args" v-model="value" v-model:country="country" @valid-change="valid = $event" />
                </Field>
                <span class="font-mono text-xs text-muted">E.164: {{ value || '–' }} · Country: {{ country }}</span>
            </div>`,
    }),
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

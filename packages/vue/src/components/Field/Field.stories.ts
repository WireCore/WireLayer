import { Mail, Search } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, useTemplateRef } from 'vue';
import Button from '../Button/Button.vue';
import PasswordInput from '../PasswordInput/PasswordInput.vue';
import type { TextFieldHandle } from '../../utils/text-field.js';
import ChipGroup from '../ChipGroup/ChipGroup.vue';
import Checkbox from '../Checkbox/Checkbox.vue';
import Chip from '../ChipGroup/Chip.vue';
import ColorPicker from '../ColorPicker/ColorPicker.vue';
import Combobox from '../Combobox/Combobox.vue';
import Input from '../Input/Input.vue';
import MultiSelect from '../MultiSelect/MultiSelect.vue';
import NumberInput from '../NumberInput/NumberInput.vue';
import RadioGroup from '../RadioGroup/RadioGroup.vue';
import RadioGroupItem from '../RadioGroup/RadioGroupItem.vue';
import SegmentedControl from '../SegmentedControl/SegmentedControl.vue';
import SegmentedControlItem from '../SegmentedControl/SegmentedControlItem.vue';
import Select from '../Select/Select.vue';
import Textarea from '../Textarea/Textarea.vue';
import TreeSelect from '../TreeSelect/TreeSelect.vue';
import Field from './Field.vue';

const meta = {
    title: 'Forms/Field',
    component: Field,
    args: { label: 'Name', helperText: 'First and last name', error: '', required: false, disabled: false },
    render: (args) => ({
        components: { Field, Input },
        setup: () => ({ args, value: ref('') }),
        template: `
            <Field v-bind="args" class="w-[380px]">
                <Input v-model="value" placeholder="Jane Doe" />
            </Field>`,
    }),
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TextFields: Story = {
    name: 'Text fields',
    parameters: { layout: 'padded' },
    render: () => ({
        components: { Field, Input, Textarea },
        setup: () => ({ Mail, Search, email: ref('max@company') }),
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <Field label="Name">
                    <Input placeholder="Jane Doe" />
                </Field>
                <Field label="Email" error="Please enter a valid address.">
                    <Input v-model="email" type="email" :leading-icon="Mail" />
                </Field>
                <Field label="Search">
                    <Input type="search" :leading-icon="Search" placeholder="Search services or topics" />
                </Field>
                <Field label="Domain">
                    <Input prefix="https://" suffix=".com" placeholder="customer-portal" />
                </Field>
                <Field label="Company (disabled)" disabled>
                    <Input placeholder="—" />
                </Field>
                <Field label="Your message">
                    <Textarea rows="3" placeholder="What would you like to build? Is there a timeline?" />
                </Field>
            </div>`,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Field, Input },
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <Field label="Small"><Input size="sm" placeholder="32 px" /></Field>
                <Field label="Default"><Input placeholder="40 px" /></Field>
                <Field label="Large"><Input size="lg" placeholder="48 px" /></Field>
            </div>`,
    }),
};

/** Success (green border, check icon, text in the description), loading, clear button and "(optional)" */
export const States: Story = {
    name: 'States',
    render: () => ({
        components: { Field, Input },
        setup: () => ({ user: ref('jklein'), search: ref('Server'), domain: ref('customer-portal') }),
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <Field label="Username" success="This name is available.">
                    <Input v-model="user" />
                </Field>
                <Field label="Domain" helper-text="Checking …">
                    <Input v-model="domain" loading suffix=".com" />
                </Field>
                <Field label="Search">
                    <Input v-model="search" clearable placeholder="Search services or topics" />
                </Field>
                <Field label="Company" optional>
                    <Input placeholder="Acme Inc." />
                </Field>
            </div>`,
    }),
};

/**
 * Own content instead of a text: the slots `#helper-text`, `#success`, `#error` (and `#label`) – e.g. a hint with a
 * link. It stays part of the control's description (aria-describedby)
 */
export const RichTexts: Story = {
    name: 'Helper text with a link',
    render: () => ({
        components: { Field, Input },
        setup: () => ({ iban: ref('') }),
        template: `
            <Field label="IBAN" class="w-[380px]">
                <Input v-model="iban" />
                <template #helper-text>
                    On your bank card or in online banking – <a href="#help" class="underline">where to find it</a>
                </template>
            </Field>`,
    }),
};

/**
 * SegmentedControl, RadioGroup and ChipGroup inside a Field: the Field's label names the group (visible), its helper
 * and error texts describe it – no `label` of their own needed
 */
export const Groups: Story = {
    name: 'Groups in a Field',
    render: () => ({
        components: { Field, SegmentedControl, SegmentedControlItem, RadioGroup, RadioGroupItem, ChipGroup, Chip },
        template: `
            <div class="flex w-[380px] flex-col gap-4">
                <Field label="View" helper-text="How the list is shown">
                    <SegmentedControl default-value="list">
                        <SegmentedControlItem value="list">List</SegmentedControlItem>
                        <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
                    </SegmentedControl>
                </Field>
                <Field label="Plan" error="Choose a plan" required>
                    <RadioGroup name="plan">
                        <RadioGroupItem value="basic">Basic</RadioGroupItem>
                        <RadioGroupItem value="pro">Pro</RadioGroupItem>
                    </RadioGroup>
                </Field>
                <Field label="Services" helper-text="Any number">
                    <ChipGroup :default-value="['web']">
                        <Chip value="web">Web</Chip>
                        <Chip value="ai">AI</Chip>
                    </ChipGroup>
                </Field>
            </div>`,
    }),
};

const services = [
    { value: 'web', label: 'Software & Web' },
    { value: 'hosting', label: 'Hosting' },
    { value: 'support', label: 'Support' },
];
const folders = [
    { id: 'documents', label: 'Documents', children: [{ id: 'report', label: 'Report.pdf' }] },
    { id: 'notes', label: 'Notes.txt' },
];
const labelClass = 'text-[13px] font-medium text-fg';

/**
 * Without a Field: a native `<label for>` names the control through its own `id` – the id goes to the element the
 * label points to (trigger or input). A Field is the better choice: it links description and error, too.
 */
export const NativeLabels: Story = {
    name: 'Native labels',
    parameters: { layout: 'padded' },
    render: () => ({
        components: { Select, MultiSelect, Combobox, NumberInput, TreeSelect, ColorPicker, Checkbox },
        setup: () => ({ services, folders, labelClass }),
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <div class="flex flex-col gap-1.5">
                    <label for="native-service" :class="labelClass">Service</label>
                    <Select id="native-service" :items="services" />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label for="native-services" :class="labelClass">Services</label>
                    <MultiSelect id="native-services" :items="services" />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label for="native-search" :class="labelClass">Search a service</label>
                    <Combobox id="native-search" :items="services" />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label for="native-seats" :class="labelClass">Seats</label>
                    <NumberInput id="native-seats" :default-value="3" :min="1" />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label for="native-folder" :class="labelClass">Folder</label>
                    <TreeSelect id="native-folder" :items="folders" />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label for="native-colour" :class="labelClass">Accent colour</label>
                    <ColorPicker id="native-colour" default-value="#1e66f5" />
                </div>
                <div class="flex items-center gap-2">
                    <Checkbox id="native-terms" />
                    <label for="native-terms" :class="labelClass">I accept the terms</label>
                </div>
            </div>`,
    }),
};

/**
 * Input, PasswordInput, NumberInput, Textarea and MaskInput expose `focus()`, `blur()`, `select()`,
 * `setSelectionRange()` and the native input as `element` – a template ref is enough, no `$el.querySelector`.
 * In a dialog, mark the field with `data-autofocus` instead of focusing it in `onMounted` (see Dialog › Initial focus).
 */
export const FocusFromCode: Story = {
    name: 'Focus from code',
    render: () => ({
        components: { Field, Input, Button },
        setup() {
            const path = useTemplateRef<TextFieldHandle>('path');
            const selectAll = () => path.value?.select();
            const selectName = () => {
                path.value?.focus();
                path.value?.setSelectionRange(6, 16);
            };
            return { selectAll, selectName };
        },
        template: `
            <div class="flex w-[380px] flex-col gap-3">
                <Field label="Key file">
                    <Input ref="path" model-value="~/.ssh/id_ed25519.pub" mono />
                </Field>
                <div class="flex gap-2">
                    <Button size="sm" variant="outline" @click="selectAll">Select all</Button>
                    <Button size="sm" variant="outline" @click="selectName">Select the file name</Button>
                </div>
            </div>`,
    }),
};

/** `mono`: the monospace font of the theme (JetBrains Mono) – for paths, tokens, recovery codes, URLs and keys */
export const Monospace: Story = {
    render: () => ({
        components: { Field, Input, PasswordInput, Textarea },
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <Field label="Server URL"><Input model-value="ssh://deploy@10.0.4.12:2222" mono /></Field>
                <Field label="API token"><PasswordInput default-value="wl_9f2c41d7e0b8" mono autocomplete="off" /></Field>
                <Field label="Public key">
                    <Textarea
                        mono
                        :rows="3"
                        default-value="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK0wmN/Cr3JXqmLW7u+g9pTh+wyqDHpSQEQnBAEcu8w0 deploy@web-01"
                    />
                </Field>
            </div>`,
    }),
};

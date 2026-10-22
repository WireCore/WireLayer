<script setup lang="ts">
import { Switch } from '@ark-ui/vue/switch';
import { type RecipeClasses, switchControl as switchControlRecipe } from '@wirecore/wirelayer-recipes';
import { computed, inject, useAttrs, useId, type Component } from 'vue';
import { switchGroupKey } from '../SwitchGroup/context.js';
import { splitAttrs } from '../../utils/attrs.js';
import { useRecipe } from '../../recipes.js';

export interface SwitchProps {
    /** Controlled state – use with v-model:checked */
    checked?: boolean;
    defaultChecked?: boolean;
    /** Second line below the label, also read as the switch's description */
    description?: string;
    /** Icon component before the label */
    icon?: Component;
    /** Icon in the thumb while on */
    checkedIcon?: Component;
    /** Icon in the thumb while off */
    uncheckedIcon?: Component;
    /** Short text in the track while on, e.g. "On" (decoration – the state is announced by the switch) */
    onLabel?: string;
    /** Short text in the track while off, e.g. "Off" */
    offLabel?: string;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Value of the switch – inside a SwitchGroup its state comes from the group's value */
    value?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof switchControlRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SwitchProps>(), {
    checked: undefined,
    defaultChecked: undefined,
    disabled: undefined,
    invalid: undefined,
    required: undefined,
});
const switchControl = useRecipe('switchControl', switchControlRecipe, () => props.classes);
const emit = defineEmits<{ 'update:checked': [checked: boolean] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const withTrackLabel = computed(() => !!(props.onLabel || props.offLabel));
const styles = computed(() =>
    switchControl({
        withThumbIcon: !!(props.checkedIcon || props.uncheckedIcon),
        withTrackLabel: withTrackLabel.value,
    })
);

const descriptionId = useId();
// Inside a SwitchGroup (with a value): state, name and disabled state come from the group
const group = inject(switchGroupKey, null);
const inGroup = computed(() => !!group && props.value !== undefined);
const groupProps = computed(() => {
    if (!group || props.value === undefined) return {};
    const state = group.value;
    return {
        checked: state.isChecked(props.value),
        disabled: props.disabled ?? (state.disabled || state.blocked(props.value) || undefined),
        invalid: props.invalid ?? state.invalid,
        readOnly: state.readOnly,
        name: props.name ?? state.name,
    };
});
function onChecked(checked: boolean) {
    if (inGroup.value) group!.value.setChecked(props.value!, checked);
    emit('update:checked', checked);
}

const describedBy = computed(
    () =>
        [props.description && descriptionId, split.value.rest['aria-describedby']].filter(Boolean).join(' ') ||
        undefined
);
</script>

<template>
    <Switch.Root
        :class="styles.base({ class: split.className })"
        :style="split.style"
        :checked="checked"
        :default-checked="defaultChecked"
        :disabled="disabled"
        :invalid="invalid"
        :required="required"
        :name="name"
        :value="value"
        v-bind="groupProps"
        @update:checked="onChecked"
    >
        <span :class="styles.content()">
            <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
            <span :class="styles.text()">
                <Switch.Label :class="styles.label()"><slot /></Switch.Label>
                <span v-if="description" :id="descriptionId" :class="styles.description()">{{ description }}</span>
            </span>
        </span>
        <Switch.Control :class="styles.control()">
            <Switch.Context v-if="checkedIcon || uncheckedIcon || withTrackLabel" v-slot="api">
                <Switch.Thumb :class="styles.thumb()">
                    <component
                        :is="api.checked ? checkedIcon : uncheckedIcon"
                        v-if="api.checked ? checkedIcon : uncheckedIcon"
                        :class="styles.thumbIcon()"
                        :data-state="api.checked ? 'checked' : 'unchecked'"
                        aria-hidden="true"
                    />
                </Switch.Thumb>
                <span
                    v-if="api.checked ? onLabel : offLabel"
                    :class="styles.trackLabel()"
                    :data-state="api.checked ? 'checked' : 'unchecked'"
                    aria-hidden="true"
                    >{{ api.checked ? onLabel : offLabel }}</span
                >
            </Switch.Context>
            <Switch.Thumb v-else :class="styles.thumb()" />
        </Switch.Control>
        <!-- Ark renders a plain checkbox; role="switch" makes screen readers announce it as a switch -->
        <Switch.HiddenInput v-bind="split.rest" role="switch" :aria-describedby="describedBy" />
    </Switch.Root>
</template>

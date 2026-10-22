<script setup lang="ts">
import { useFieldContext } from '@ark-ui/vue/field';
import { SignaturePad, useSignaturePad } from '@ark-ui/vue/signature-pad';
import { Eraser, Keyboard, PenLine, Undo2 } from '@lucide/vue';
import {
    announce,
    signaturePad as signaturePadRecipe,
    typedSignature,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, ref, useAttrs, useId } from 'vue';
import Button from '../Button/Button.vue';
import Input from '../Input/Input.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface SignaturePadProps {
    /** The signature as data URL ("" when empty) – use with v-model */
    modelValue?: string;
    /** The strokes as SVG paths – use with v-model:paths (to restore or store them) */
    paths?: string[];
    defaultPaths?: string[];
    /** Format of the data URL: png (default) or svg; a typed signature is always svg */
    format?: 'png' | 'svg';
    /** Visible label, also the name of the field (default "Signature"; a surrounding Field names it, too) */
    label?: string;
    /** Ink colour – a real colour (it is exported), default black on the light sheet */
    color?: string;
    /** Stroke width in px (default 2) */
    strokeWidth?: number;
    /** Offers typing the name instead of drawing (accessible alternative) */
    typedAlternative?: boolean;
    /** The typed name – use with v-model:typedName */
    typedName?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** Name of the hidden form field (its value is the data URL) */
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof signaturePadRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SignaturePadProps>(), {
    modelValue: undefined,
    paths: undefined,
    format: 'png',
    color: '#000000',
    strokeWidth: 2,
    typedName: undefined,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
    required: undefined,
});
const emit = defineEmits<{
    'update:modelValue': [value: string];
    'update:paths': [paths: string[]];
    'update:typedName': [name: string];
}>();
const signaturePad = useRecipe('signaturePad', signaturePadRecipe, () => props.classes);
const attrs = useAttrs();
const field = useFieldContext();
const t = useTranslations().signaturePad;
const styles = signaturePad();
const id = useId();
const labelId = `${id}label`;
const internalPaths = ref<string[]>(props.defaultPaths ?? []);
const strokes = computed(() => props.paths ?? internalPaths.value);
const internalName = ref('');
const name = computed(() => props.typedName ?? internalName.value);
const typing = ref(false);
const current = ref(props.modelValue ?? '');
const value = computed(() => props.modelValue ?? current.value);
const disabled = computed(() => props.disabled ?? field?.value.disabled);
const readOnly = computed(() => props.readOnly ?? field?.value.readOnly);
const nameText = computed(() => props.label ?? t.label);
const mime = computed(() => (props.format === 'svg' ? 'image/svg+xml' : 'image/png'));

const api = useSignaturePad(
    computed(() => ({
        id,
        ids: { label: labelId },
        paths: strokes.value,
        drawing: { fill: props.color, size: props.strokeWidth, simulatePressure: true },
        disabled: disabled.value,
        readOnly: readOnly.value,
        required: props.required ?? field?.value.required,
        name: props.name,
        translations: { control: nameText.value, clearTrigger: t.clear },
        onDrawEnd: (details: {
            paths: string[];
            getDataUrl: (type: 'image/png' | 'image/svg+xml') => Promise<string>;
        }) => {
            void setPaths(details.paths, false);
            details.getDataUrl(mime.value).then(setValue, () => undefined);
        },
    }))
);

function setValue(next: string) {
    current.value = next;
    emit('update:modelValue', next);
}
/** New strokes; `render`: the image is made from them once they are rendered (undo, clear) */
async function setPaths(next: string[], render = true) {
    internalPaths.value = next;
    emit('update:paths', next);
    if (!render) return;
    await nextTick();
    setValue(next.length ? await api.value.getDataUrl(mime.value) : '');
}
function undo() {
    void setPaths(strokes.value.slice(0, -1));
}
function clear() {
    if (typing.value) setName('');
    else void setPaths([]);
    announce(t.cleared);
}
function setName(next: string) {
    internalName.value = next;
    emit('update:typedName', next);
    setValue(next.trim() ? typedSignature(next.trim(), { color: props.color }) : '');
}
function toggleTyping() {
    typing.value = !typing.value;
    if (typing.value) setName(name.value);
    else void setPaths(strokes.value);
}
</script>

<template>
    <!--
        Signature field (role="application"): draw with mouse, pen or finger; "Undo" removes the last stroke.
        With typedAlternative the name can be typed instead – the field shows it in a handwriting font.
    -->
    <SignaturePad.RootProvider
        :value="api"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :data-invalid="(invalid ?? field?.invalid) || undefined"
    >
        <SignaturePad.Label v-if="label || !field" :class="styles.label()">{{ nameText }}</SignaturePad.Label>
        <SignaturePad.Control
            v-if="!typing"
            :class="styles.control()"
            :aria-labelledby="label || !field ? labelId : field.ids.label"
            :aria-roledescription="t.roleDescription"
            :aria-describedby="field?.ariaDescribedby"
            :aria-invalid="(invalid ?? field?.invalid) || undefined"
            :data-invalid="(invalid ?? field?.invalid) || undefined"
        >
            <SignaturePad.Segment :class="styles.segment()" aria-hidden="true" />
            <SignaturePad.Guide :class="styles.guide()" />
            <span v-if="!strokes.length" :class="styles.placeholder()" aria-hidden="true">{{ t.placeholder }}</span>
        </SignaturePad.Control>
        <div v-else :class="styles.typed()">
            <Input
                :model-value="name"
                :aria-label="t.typedLabel"
                :aria-describedby="field?.ariaDescribedby"
                :disabled="disabled"
                :readonly="readOnly"
                autocomplete="name"
                @update:model-value="setName($event ?? '')"
            />
            <div :class="styles.preview()" aria-hidden="true">{{ name }}</div>
        </div>
        <div v-if="!readOnly" :class="styles.toolbar()">
            <Button
                v-if="!typing"
                variant="outline"
                size="sm"
                :leading-icon="Undo2"
                :disabled="disabled || !strokes.length"
                @click="undo"
            >
                {{ t.undo }}
            </Button>
            <Button variant="outline" size="sm" :leading-icon="Eraser" :disabled="disabled || !value" @click="clear">
                {{ t.clear }}
            </Button>
            <Button
                v-if="typedAlternative"
                variant="text"
                size="sm"
                :leading-icon="typing ? PenLine : Keyboard"
                :disabled="disabled"
                @click="toggleTyping"
            >
                {{ typing ? t.draw : t.type }}
            </Button>
        </div>
        <SignaturePad.HiddenInput v-if="props.name" :value="value" />
    </SignaturePad.RootProvider>
</template>

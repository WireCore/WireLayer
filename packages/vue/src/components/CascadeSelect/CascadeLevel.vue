<script setup lang="ts">
import { Menu } from '@ark-ui/vue/menu';
import { Check, ChevronRight, LoaderCircle, RotateCw } from '@lucide/vue';
import {
    cascadeSelect as cascadeSelectRecipe,
    isLazyNode,
    type ChildrenStatus,
    SUBMENU_GUTTER,
} from '@wirecore/wirelayer-recipes';
import { inject } from 'vue';
import { cascadeKey, type CascadeOption } from './types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

defineOptions({ name: 'CascadeLevel' });
defineProps<{
    options: readonly CascadeOption<unknown>[];
    value: string | null;
    /** The option this level belongs to (`changeOnSelect`: it can be chosen here) */
    parent?: CascadeOption<unknown>;
    /** Loading state of the level's options */
    status?: ChildrenStatus;
}>();
const cascadeSelect = useRecipe('cascadeSelect', cascadeSelectRecipe);
const emit = defineEmits<{ choose: [value: string] }>();
const styles = cascadeSelect();
const translations = useTranslations();
const context = inject(cascadeKey)!;
const branch = (option: CascadeOption<unknown>) => !!option.children || isLazyNode(option);
// Click mode: hovering does not open a level (the pointer move never reaches Ark's handler)
const stopHover = (event: PointerEvent) => event.stopImmediatePropagation();
function onOpenChange(option: CascadeOption<unknown>, open: boolean) {
    if (open) context.open(option);
}
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const submenuPositioning = { placement: 'right-start', offset: { mainAxis: SUBMENU_GUTTER } } as const;
</script>

<template>
    <Menu.RadioItemGroup :model-value="value ?? ''" @update:model-value="emit('choose', $event)">
        <Menu.RadioItem
            v-if="parent && context.changeOnSelect.value"
            :value="context.keyOf(parent)"
            :class="styles.item()"
        >
            <Menu.ItemText :class="styles.text()">{{ translations.cascadeSelect.choose(parent.label) }}</Menu.ItemText>
            <Menu.ItemIndicator>
                <Check :class="styles.check()" aria-hidden="true" />
            </Menu.ItemIndicator>
        </Menu.RadioItem>
        <Menu.Item v-if="status === 'loading'" value="" disabled :class="styles.item()">
            <LoaderCircle :class="styles.loadingIcon()" aria-hidden="true" />
            <span :class="styles.text()">{{ translations.common.loading }}</span>
        </Menu.Item>
        <!-- The options of the level failed to load: activating this entry loads them again -->
        <Menu.Item
            v-else-if="status === 'error' && parent"
            :value="`${context.keyOf(parent)}\u0000retry`"
            :close-on-select="false"
            :class="styles.item({ class: styles.retry() })"
            @select="context.retry(parent)"
        >
            <RotateCw :class="styles.icon({ class: styles.retry() })" aria-hidden="true" />
            <span :class="styles.text()">{{ translations.tree.retry }}</span>
        </Menu.Item>
        <template v-for="option in options" :key="context.keyOf(option)">
            <Menu.Root
                v-if="branch(option)"
                :positioning="submenuPositioning"
                @open-change="onOpenChange(option, $event.open)"
            >
                <Menu.TriggerItem
                    :class="styles.item()"
                    v-bind="context.clickOnly.value ? { onPointermoveCapture: stopHover } : {}"
                >
                    <component :is="option.icon" v-if="option.icon" :class="styles.icon()" aria-hidden="true" />
                    <span :class="styles.text()">{{ option.label }}</span>
                    <ChevronRight :class="styles.submenuIcon()" aria-hidden="true" />
                </Menu.TriggerItem>
                <Teleport to="body">
                    <Menu.Positioner>
                        <Menu.Content :class="styles.content()">
                            <CascadeLevel
                                :options="option.children ?? []"
                                :value="value"
                                :parent="option"
                                :status="context.statusOf(option)"
                                @choose="emit('choose', $event)"
                            />
                        </Menu.Content>
                    </Menu.Positioner>
                </Teleport>
            </Menu.Root>
            <Menu.RadioItem v-else :value="context.keyOf(option)" :disabled="option.disabled" :class="styles.item()">
                <component :is="option.icon" v-if="option.icon" :class="styles.icon()" aria-hidden="true" />
                <Menu.ItemText :class="styles.text()">{{ option.label }}</Menu.ItemText>
                <Menu.ItemIndicator>
                    <Check :class="styles.check()" aria-hidden="true" />
                </Menu.ItemIndicator>
            </Menu.RadioItem>
        </template>
    </Menu.RadioItemGroup>
</template>

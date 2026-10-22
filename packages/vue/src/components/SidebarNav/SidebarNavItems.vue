<script setup lang="ts">
import { Collapsible } from '@ark-ui/vue/collapsible';
import { ChevronRight } from '@lucide/vue';
import { formatCount, sidebarNav as sidebarNavRecipe } from '@wirecore/wirelayer-recipes';
import { computed, type FunctionalComponent } from 'vue';
import { containsCurrent, type SidebarNavItem } from './types.js';
import Tooltip from '../Tooltip/Tooltip.vue';
import { useRecipe } from '../../recipes.js';

defineOptions({ name: 'SidebarNavItems' });
const props = defineProps<{
    items: SidebarNavItem[];
    depth: number;
    rail?: boolean;
    expandOnHover?: boolean;
}>();
const sidebarNav = useRecipe('sidebarNav', sidebarNavRecipe);
const emit = defineEmits<{ navigate: [item: SidebarNavItem, event: MouseEvent] }>();
const styles = computed(() => sidebarNav(props.rail ? { rail: true, expandOnHover: props.expandOnHover } : undefined));
// In the rail the labels are tooltips (unless the rail expands on hover)
const Plain: FunctionalComponent<{ content?: string; placement?: string }> = (_, { slots }) => slots.default?.();
Plain.props = ['content', 'placement'];
const wrapper = computed(() => (props.rail && !props.expandOnHover ? Tooltip : Plain));
const badgeText = (badge: number | string) => (typeof badge === 'number' ? formatCount(badge) : badge);
</script>

<template>
    <li v-for="item in items" :key="item.label">
        <Collapsible.Root v-if="item.children" :default-open="containsCurrent(item)">
            <component :is="wrapper" :content="item.label" placement="right">
                <Collapsible.Trigger :class="styles.link()" :style="{ '--depth': depth }">
                    <component :is="item.icon" v-if="item.icon" :class="styles.icon()" aria-hidden="true" />
                    <span v-else-if="rail" :class="styles.monogram()" aria-hidden="true">{{ item.label[0] }}</span>
                    <span :class="styles.label()">{{ item.label }}</span>
                    <span v-if="item.badge !== undefined" :class="styles.badge()">{{ badgeText(item.badge) }}</span>
                    <Collapsible.Indicator as-child>
                        <ChevronRight :class="styles.indicator()" aria-hidden="true" />
                    </Collapsible.Indicator>
                </Collapsible.Trigger>
            </component>
            <Collapsible.Content :class="styles.content()">
                <ul :class="styles.sublist()">
                    <SidebarNavItems
                        :items="item.children"
                        :depth="depth + 1"
                        :rail="rail"
                        :expand-on-hover="expandOnHover"
                        @navigate="(i, e) => emit('navigate', i, e)"
                    />
                </ul>
            </Collapsible.Content>
        </Collapsible.Root>
        <component :is="wrapper" v-else :content="item.label" placement="right">
            <a
                :href="item.href"
                :class="styles.link()"
                :style="{ '--depth': depth }"
                :aria-current="item.current ? 'page' : undefined"
                @click="emit('navigate', item, $event)"
            >
                <component :is="item.icon" v-if="item.icon" :class="styles.icon()" aria-hidden="true" />
                <span v-else-if="rail" :class="styles.monogram()" aria-hidden="true">{{ item.label[0] }}</span>
                <span :class="styles.label()">{{ item.label }}</span>
                <span v-if="item.badge !== undefined" :class="styles.badge()">{{ badgeText(item.badge) }}</span>
            </a>
        </component>
    </li>
</template>

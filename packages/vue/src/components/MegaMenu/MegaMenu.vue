<script setup lang="ts">
import { NavigationMenu, useNavigationMenu } from '@ark-ui/vue/navigation-menu';
import { ArrowRight, ChevronDown, Menu } from '@lucide/vue';
import {
    createHoverIntent,
    isCurrentLink,
    linkTarget,
    megaMenu as megaMenuRecipe,
    type MegaMenuCollapse,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, ref, useAttrs, useId, type Component } from 'vue';
import { hasPanel, itemValue, type MegaMenuFeatured, type MegaMenuItem, type MegaMenuLink } from './types.js';
import Accordion from '../Accordion/Accordion.vue';
import AccordionItem from '../Accordion/AccordionItem.vue';
import Badge from '../Badge/Badge.vue';
import Drawer from '../Drawer/Drawer.vue';
import DrawerContent from '../Drawer/DrawerContent.vue';
import IconButton from '../IconButton/IconButton.vue';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface MegaMenuProps {
    items: readonly MegaMenuItem[];
    /** Name of the navigation landmark (default "Main navigation") */
    label?: string;
    /** click (default) or hover – hover opens after `openDelay` with the mouse only, never on touch */
    openOn?: 'click' | 'hover';
    /** Hover: delay before the first panel opens (ms, default 200) */
    openDelay?: number;
    /** Hover: delay before closing after the pointer left (ms, default 300) */
    closeDelay?: number;
    /** Arrow keys move between the entries and the links of a panel (default true); Tab always works */
    arrowKeys?: boolean;
    /** Entries in a row (default) or a column with the panels beside it */
    orientation?: 'horizontal' | 'vertical';
    /** Below which width the menu button with the drawer takes over: md, lg (default, 1024px), xl, container, never */
    collapse?: MegaMenuCollapse;
    /** Path of the current page – only the link with exactly this href gets aria-current="page" */
    currentHref?: string;
    /** Own check for the current page, e.g. with the router */
    isCurrent?: (link: MegaMenuLink | MegaMenuItem) => boolean;
    /** Level of the group headings (default 3) */
    headingLevel?: 2 | 3 | 4 | 5;
    /** Component for the links, e.g. RouterLink or NuxtLink (gets `to` for links with `to`, else `href`); default <a> */
    linkAs?: string | Component;
    /** Open panel (its value, '' for none) – use with v-model:value */
    value?: string;
    defaultValue?: string;
    /** Name of the menu button and title of the drawer (default "Menu") */
    menuLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof megaMenuRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MegaMenuProps>(), {
    openOn: 'click',
    openDelay: 200,
    closeDelay: 300,
    arrowKeys: true,
    orientation: 'horizontal',
    headingLevel: 3,
    linkAs: 'a',
    value: undefined,
});
const megaMenu = useRecipe('megaMenu', megaMenuRecipe, () => props.classes);
const emit = defineEmits<{
    'update:value': [value: string];
    /** A link was clicked – call event.preventDefault() and route yourself in a single-page app */
    navigate: [link: MegaMenuLink | MegaMenuItem | MegaMenuFeatured, event: MouseEvent];
}>();
const slots = defineSlots<{
    /** Own content of the featured area of an entry */
    featured?(props: { item: MegaMenuItem }): unknown;
    /** Own content of a panel link (instead of icon, label, badge and description) */
    item?(props: { link: MegaMenuLink }): unknown;
}>();
const attrs = useAttrs();
const translations = useTranslations();
const locale = useLocale();
const id = useId();
const styles = computed(() => megaMenu({ orientation: props.orientation, collapse: props.collapse }));
const rootLabel = computed(() => props.label ?? translations.megaMenu.rootLabel);

const linkCurrent = (link: MegaMenuLink | MegaMenuItem) => isCurrentLink(link, props.currentHref, props.isCurrent);
const sectionCurrent = (item: MegaMenuItem) =>
    !!item.columns?.some((column) => column.groups.some((group) => group.items.some(linkCurrent)));
const groupsOf = (item: MegaMenuItem) => item.columns?.flatMap((column) => column.groups) ?? [];

// The open panel: controlled (v-model:value) or our own
const internal = ref(props.defaultValue ?? '');
const open = computed(() => props.value ?? internal.value);
function setValue(next: string) {
    if (next === open.value) return;
    internal.value = next;
    emit('update:value', next);
}

// Hover: a click on an entry whose panel the pointer just opened keeps it open (instead of closing it again)
let hoverOpened: string | undefined;
let pressed: string | undefined;
function onArkChange(next: string) {
    if (next === '' && pressed && pressed === hoverOpened) {
        hoverOpened = undefined;
        return;
    }
    hoverOpened = undefined;
    setValue(next);
}
const api = useNavigationMenu(
    computed(() => ({
        value: open.value,
        orientation: props.orientation,
        disableHoverTrigger: true,
        translations: { rootLabel: rootLabel.value },
        onValueChange: (details: { value: string }) => onArkChange(details.value),
    }))
);

const hover = createHoverIntent({
    value: () => open.value,
    open: (value) => {
        hoverOpened = value || undefined;
        setValue(value);
    },
    openDelay: () => props.openDelay,
    closeDelay: () => props.closeDelay,
    panel: (value) =>
        document.getElementById(api.value.getItemState({ value }).contentId)?.getBoundingClientRect() ?? null,
    side: () => (props.orientation === 'vertical' ? 'end' : 'bottom'),
    rtl: () => locale.value.dir === 'rtl',
});
onBeforeUnmount(hover.cancel);
const point = (event: PointerEvent) => ({ x: event.clientX, y: event.clientY });
const hoverValue = (item: MegaMenuItem) => (hasPanel(item) ? itemValue(item) : '');
function onEnter(item: MegaMenuItem, event: PointerEvent) {
    if (props.openOn === 'hover' && event.pointerType === 'mouse') hover.enter(hoverValue(item), point(event));
}
function onMove(item: MegaMenuItem, event: PointerEvent) {
    if (props.openOn === 'hover' && event.pointerType === 'mouse') hover.move(hoverValue(item), point(event));
}
function onLeave(item: MegaMenuItem, event: PointerEvent) {
    if (props.openOn === 'hover' && event.pointerType === 'mouse') hover.leave(hoverValue(item), point(event));
}
function onPress(item: MegaMenuItem) {
    hover.cancel();
    pressed = itemValue(item);
}
// After Ark's click handler on the same trigger
const onPressEnd = () => setTimeout(() => (pressed = undefined));

// Our own panel element: Ark's content closes when the pointer leaves it (also in click mode) and names it with
// aria-labelledby (not allowed on a plain div) – both are left out
function contentProps(item: MegaMenuItem) {
    const props = api.value.getContentProps({ value: itemValue(item) }) as Record<string, unknown>;
    return Object.fromEntries(
        Object.entries(props).filter(([key]) => !/^onpointer(enter|leave)$/i.test(key) && key !== 'aria-labelledby')
    );
}

// arrowKeys=false: the keys never reach Ark's handlers (Tab only, like plain links and buttons)
const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);
function onKeydownCapture(event: KeyboardEvent) {
    if (props.arrowKeys || !ARROWS.has(event.key)) return;
    if ((event.target as Element).closest('[data-scope=navigation-menu]:is([data-part=trigger], [data-part=link])'))
        event.stopPropagation();
}

// Small screens: menu button and drawer with one accordion section per entry
const drawerOpen = ref(false);
const showBurger = computed(() => props.collapse !== 'never');
const openSections = computed(() =>
    props.items.filter((item) => hasPanel(item) && sectionCurrent(item)).map(itemValue)
);
function onDrawerLink(link: MegaMenuLink | MegaMenuItem | MegaMenuFeatured, event: MouseEvent) {
    emit('navigate', link, event);
    drawerOpen.value = false;
}
const subHeading = computed(() => `h${Math.min(props.headingLevel + 1, 6)}`);
// A described link is named by its label (and badge) only – the description is no part of the name
const describedBy = (prefix: string, link: MegaMenuLink) =>
    link.description && !slots.item ? { 'aria-labelledby': `${prefix}-l`, 'aria-describedby': `${prefix}-d` } : {};
</script>

<template>
    <!--
        Website navigation (nav landmark, disclosure pattern – no menu roles): links, buttons with aria-expanded that
        open a panel, or a link with its own chevron button. Panels hold headed groups of links (descriptions via
        aria-describedby), badges and a featured area. Escape, a click outside, leaving with the focus and following
        a link close it; one panel at a time. Below the breakpoint a menu button opens a drawer with accordions.
    -->
    <NavigationMenu.RootProvider
        :value="api"
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        @keydown.capture="onKeydownCapture"
    >
        <NavigationMenu.List :class="styles.list()">
            <NavigationMenu.Item
                v-for="(item, itemIndex) in items"
                :key="itemValue(item)"
                :value="itemValue(item)"
                :class="styles.item()"
                @pointerenter="onEnter(item, $event)"
                @pointermove="onMove(item, $event)"
                @pointerleave="onLeave(item, $event)"
            >
                <template v-if="hasPanel(item)">
                    <template v-if="item.href">
                        <NavigationMenu.Link as-child :current="linkCurrent(item)">
                            <component
                                :is="linkAs"
                                v-bind="linkTarget(item.href, item.to)"
                                :class="styles.link()"
                                @click="emit('navigate', item, $event)"
                            >
                                {{ item.label }}
                            </component>
                        </NavigationMenu.Link>
                        <NavigationMenu.Trigger
                            :class="styles.toggle()"
                            :aria-label="translations.megaMenu.submenu(item.label)"
                            :data-current="sectionCurrent(item) ? '' : undefined"
                            @pointerdown="onPress(item)"
                            @click="onPressEnd"
                        >
                            <ChevronDown :class="styles.triggerIcon()" aria-hidden="true" />
                        </NavigationMenu.Trigger>
                    </template>
                    <NavigationMenu.Trigger
                        v-else
                        :class="styles.trigger()"
                        :data-current="sectionCurrent(item) ? '' : undefined"
                        @pointerdown="onPress(item)"
                        @click="onPressEnd"
                    >
                        {{ item.label }}
                        <ChevronDown :class="styles.triggerIcon()" aria-hidden="true" />
                    </NavigationMenu.Trigger>
                    <div v-bind="contentProps(item)" :class="styles.content()">
                        <div :class="styles.body()">
                            <div v-if="item.columns?.length" :class="styles.columns()">
                                <div
                                    v-for="(column, columnIndex) in item.columns"
                                    :key="columnIndex"
                                    :class="styles.column()"
                                >
                                    <div
                                        v-for="(group, groupIndex) in column.groups"
                                        :key="group.title"
                                        :class="styles.group()"
                                    >
                                        <component
                                            :is="`h${headingLevel}`"
                                            :id="`${id}-${itemIndex}-${columnIndex}-${groupIndex}`"
                                            :class="styles.groupTitle()"
                                        >
                                            {{ group.title }}
                                        </component>
                                        <ul
                                            :class="styles.groupList()"
                                            :aria-labelledby="`${id}-${itemIndex}-${columnIndex}-${groupIndex}`"
                                        >
                                            <li v-for="(link, linkIndex) in group.items" :key="link.href">
                                                <NavigationMenu.Link as-child :current="linkCurrent(link)">
                                                    <component
                                                        :is="linkAs"
                                                        v-bind="{
                                                            ...linkTarget(link.href, link.to),
                                                            ...describedBy(
                                                                `${id}-${itemIndex}-${columnIndex}-${groupIndex}-${linkIndex}`,
                                                                link
                                                            ),
                                                        }"
                                                        :class="styles.panelLink()"
                                                        @click="emit('navigate', link, $event)"
                                                    >
                                                        <slot name="item" :link="link">
                                                            <component
                                                                :is="link.icon"
                                                                v-if="link.icon"
                                                                :class="styles.panelIcon()"
                                                                aria-hidden="true"
                                                            />
                                                            <span :class="styles.panelText()">
                                                                <span
                                                                    :id="`${id}-${itemIndex}-${columnIndex}-${groupIndex}-${linkIndex}-l`"
                                                                    :class="styles.panelLabel()"
                                                                >
                                                                    {{ link.label }}
                                                                    <Badge
                                                                        v-if="link.badge"
                                                                        :variant="link.badgeVariant"
                                                                        >{{ link.badge }}</Badge
                                                                    >
                                                                </span>
                                                                <span
                                                                    v-if="link.description"
                                                                    :id="`${id}-${itemIndex}-${columnIndex}-${groupIndex}-${linkIndex}-d`"
                                                                    :class="styles.panelDescription()"
                                                                    >{{ link.description }}</span
                                                                >
                                                            </span>
                                                        </slot>
                                                    </component>
                                                </NavigationMenu.Link>
                                            </li>
                                        </ul>
                                        <NavigationMenu.Link v-if="group.moreHref" as-child>
                                            <component
                                                :is="linkAs"
                                                v-bind="linkTarget(group.moreHref, group.moreTo)"
                                                :class="styles.more()"
                                                :aria-label="
                                                    group.moreLabel
                                                        ? undefined
                                                        : translations.megaMenu.showAllOf(group.title)
                                                "
                                                @click="
                                                    emit(
                                                        'navigate',
                                                        {
                                                            label: group.moreLabel ?? translations.megaMenu.showAll,
                                                            href: group.moreHref,
                                                        },
                                                        $event
                                                    )
                                                "
                                            >
                                                {{ group.moreLabel ?? translations.megaMenu.showAll }}
                                                <ArrowRight :class="styles.moreIcon()" aria-hidden="true" />
                                            </component>
                                        </NavigationMenu.Link>
                                    </div>
                                </div>
                            </div>
                            <div v-if="item.featured" :class="styles.featured()">
                                <slot name="featured" :item="item">
                                    <img
                                        v-if="item.featured.image"
                                        :src="item.featured.image"
                                        :alt="item.featured.imageAlt ?? ''"
                                        :class="styles.featuredImage()"
                                    />
                                    <p v-if="item.featured.eyebrow" :class="styles.featuredEyebrow()">
                                        {{ item.featured.eyebrow }}
                                    </p>
                                    <NavigationMenu.Link as-child>
                                        <component
                                            :is="linkAs"
                                            v-bind="linkTarget(item.featured.href, item.featured.to)"
                                            :class="styles.featuredTitle()"
                                            @click="emit('navigate', item.featured, $event)"
                                        >
                                            {{ item.featured.title }}
                                        </component>
                                    </NavigationMenu.Link>
                                    <p v-if="item.featured.description" :class="styles.featuredDescription()">
                                        {{ item.featured.description }}
                                    </p>
                                </slot>
                            </div>
                        </div>
                        <div v-if="item.allHref" :class="styles.footer()">
                            <NavigationMenu.Link as-child>
                                <component
                                    :is="linkAs"
                                    v-bind="linkTarget(item.allHref, item.allTo)"
                                    :class="styles.more()"
                                    @click="
                                        emit(
                                            'navigate',
                                            {
                                                label: item.allLabel ?? translations.megaMenu.showAll,
                                                href: item.allHref,
                                            },
                                            $event
                                        )
                                    "
                                >
                                    {{ item.allLabel ?? translations.megaMenu.showAll }}
                                    <ArrowRight :class="styles.moreIcon()" aria-hidden="true" />
                                </component>
                            </NavigationMenu.Link>
                        </div>
                    </div>
                </template>
                <NavigationMenu.Link v-else as-child :current="linkCurrent(item)">
                    <component
                        :is="linkAs"
                        v-bind="linkTarget(item.href, item.to)"
                        :class="styles.link()"
                        @click="emit('navigate', item, $event)"
                    >
                        {{ item.label }}
                    </component>
                </NavigationMenu.Link>
            </NavigationMenu.Item>
        </NavigationMenu.List>
        <template v-if="showBurger">
            <IconButton
                :icon="Menu"
                :label="menuLabel ?? translations.megaMenu.menu"
                variant="text"
                :class="styles.burger()"
                aria-haspopup="dialog"
                :aria-expanded="drawerOpen"
                @click="drawerOpen = true"
            />
            <Drawer v-model:open="drawerOpen">
                <DrawerContent :title="menuLabel ?? translations.megaMenu.menu" placement="right">
                    <nav :aria-label="rootLabel" :class="styles.mobileNav()">
                        <Accordion multiple :default-value="openSections">
                            <template v-for="(item, itemIndex) in items" :key="itemValue(item)">
                                <AccordionItem
                                    v-if="hasPanel(item)"
                                    :value="itemValue(item)"
                                    :title="item.label"
                                    :heading-level="headingLevel"
                                >
                                    <component
                                        :is="linkAs"
                                        v-if="item.href"
                                        v-bind="linkTarget(item.href, item.to)"
                                        :class="styles.mobilePanelLink()"
                                        :aria-current="linkCurrent(item) ? 'page' : undefined"
                                        @click="onDrawerLink(item, $event)"
                                    >
                                        {{ translations.megaMenu.overview(item.label) }}
                                    </component>
                                    <div
                                        v-for="(group, groupIndex) in groupsOf(item)"
                                        :key="group.title"
                                        :class="styles.mobileGroup()"
                                    >
                                        <component
                                            :is="subHeading"
                                            :id="`${id}-m-${itemIndex}-${groupIndex}`"
                                            :class="styles.mobileGroupTitle()"
                                        >
                                            {{ group.title }}
                                        </component>
                                        <ul
                                            :class="styles.groupList()"
                                            :aria-labelledby="`${id}-m-${itemIndex}-${groupIndex}`"
                                        >
                                            <li v-for="link in group.items" :key="link.href">
                                                <component
                                                    :is="linkAs"
                                                    v-bind="linkTarget(link.href, link.to)"
                                                    :class="styles.mobilePanelLink()"
                                                    :aria-current="linkCurrent(link) ? 'page' : undefined"
                                                    @click="onDrawerLink(link, $event)"
                                                >
                                                    <component
                                                        :is="link.icon"
                                                        v-if="link.icon"
                                                        :class="styles.panelIcon()"
                                                        aria-hidden="true"
                                                    />
                                                    {{ link.label }}
                                                    <Badge v-if="link.badge" :variant="link.badgeVariant">{{
                                                        link.badge
                                                    }}</Badge>
                                                </component>
                                            </li>
                                        </ul>
                                        <component
                                            :is="linkAs"
                                            v-if="group.moreHref"
                                            v-bind="linkTarget(group.moreHref, group.moreTo)"
                                            :class="styles.more()"
                                            :aria-label="
                                                group.moreLabel
                                                    ? undefined
                                                    : translations.megaMenu.showAllOf(group.title)
                                            "
                                            @click="onDrawerLink({ label: group.title, href: group.moreHref }, $event)"
                                        >
                                            {{ group.moreLabel ?? translations.megaMenu.showAll }}
                                        </component>
                                    </div>
                                    <component
                                        :is="linkAs"
                                        v-if="item.featured"
                                        v-bind="linkTarget(item.featured.href, item.featured.to)"
                                        :class="styles.mobilePanelLink()"
                                        @click="onDrawerLink(item.featured, $event)"
                                    >
                                        {{ item.featured.title }}
                                    </component>
                                    <component
                                        :is="linkAs"
                                        v-if="item.allHref"
                                        v-bind="linkTarget(item.allHref, item.allTo)"
                                        :class="styles.more()"
                                        @click="onDrawerLink({ label: item.label, href: item.allHref }, $event)"
                                    >
                                        {{ item.allLabel ?? translations.megaMenu.showAll }}
                                    </component>
                                </AccordionItem>
                                <component
                                    :is="linkAs"
                                    v-else
                                    v-bind="linkTarget(item.href, item.to)"
                                    :class="styles.mobileLink()"
                                    :aria-current="linkCurrent(item) ? 'page' : undefined"
                                    @click="onDrawerLink(item, $event)"
                                >
                                    {{ item.label }}
                                </component>
                            </template>
                        </Accordion>
                    </nav>
                </DrawerContent>
            </Drawer>
        </template>
    </NavigationMenu.RootProvider>
</template>

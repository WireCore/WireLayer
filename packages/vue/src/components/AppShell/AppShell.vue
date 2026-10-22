<script setup lang="ts">
import { Menu, PanelLeftClose, PanelLeftOpen } from '@lucide/vue';
import {
    appShell as appShellRecipe,
    clampSize,
    headroomHidden,
    readStored,
    type RecipeClasses,
    resizeForKey,
    writeStored,
} from '@wirecore/wirelayer-recipes';
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import RailScope from './RailScope.vue';
import Drawer from '../Drawer/Drawer.vue';
import DrawerContent from '../Drawer/DrawerContent.vue';
import IconButton from '../IconButton/IconButton.vue';
import SkipLinks, { type SkipLink } from '../SkipLinks/SkipLinks.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface AppShellProps {
    /** Navigation drawer on small screens – use with v-model:navbar-open */
    navbarOpen?: boolean;
    /** Title of the drawer and name of the button that opens it */
    navbarLabel?: string;
    skipLinkLabel?: string;
    /**
     * Further skip links after the one to the main area, e.g. [{ href: '#search', label: 'Skip to search' }] –
     * then rendered as a named list (SkipLinks)
     */
    skipLinks?: SkipLink[];
    /** The navbar is a rail of icons on the desktop (a SidebarNav inside shows tooltips) – v-model:navbar-collapsed */
    navbarCollapsed?: boolean;
    /** A button in the header folds and unfolds the navbar (desktop) */
    collapsible?: boolean;
    /** With navbarCollapsed: the rail opens over the main area while hovered or focused */
    navbarExpandOnHover?: boolean;
    /** The navbar width can be changed with a handle (drag, arrow keys, Home/End, double click resets) */
    navbarResizable?: boolean;
    /** The aside width can be changed the same way */
    asideResizable?: boolean;
    /** Width of the navbar in px (default 256) – v-model:navbar-width */
    navbarWidth?: number;
    /** Width of the aside in px (default 288) – v-model:aside-width */
    asideWidth?: number;
    /** Limits for resizing (px) */
    navbarMinWidth?: number;
    navbarMaxWidth?: number;
    asideMinWidth?: number;
    asideMaxWidth?: number;
    /** Remembers widths and the rail state in localStorage under this key */
    storageKey?: string;
    /** The header slides away while scrolling down and comes back when scrolling up */
    headroom?: boolean;
    /** `header-first` (default): the header spans everything; `navbar-first`: the navbar runs the full height */
    layout?: 'header-first' | 'navbar-first';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof appShellRecipe>;
}

const NAVBAR_WIDTH = 256;
const ASIDE_WIDTH = 288;

const props = withDefaults(defineProps<AppShellProps>(), {
    navbarOpen: undefined,
    navbarCollapsed: undefined,
    navbarMinWidth: 200,
    navbarMaxWidth: 480,
    asideMinWidth: 200,
    asideMaxWidth: 480,
});
const appShell = useRecipe('appShell', appShellRecipe, () => props.classes);
const emit = defineEmits<{
    'update:navbarOpen': [open: boolean];
    'update:navbarCollapsed': [collapsed: boolean];
    'update:navbarWidth': [width: number];
    'update:asideWidth': [width: number];
}>();
const slots = defineSlots<{
    header?(): unknown;
    navbar?(): unknown;
    aside?(): unknown;
    /** Page footer (contentinfo) below the main area */
    footer?(): unknown;
    default(): unknown;
}>();
const id = useId();
const internal = ref(false);
const open = computed(() => props.navbarOpen ?? internal.value);
function setOpen(next: boolean) {
    internal.value = next;
    emit('update:navbarOpen', next);
}

// Rail, widths: controlled or our own, optionally remembered
interface Stored {
    navbarWidth?: number;
    asideWidth?: number;
    navbarCollapsed?: boolean;
}
const own = ref<Stored>({});
const collapsed = computed(() => props.navbarCollapsed ?? own.value.navbarCollapsed ?? false);
const navbarWidth = computed(() => props.navbarWidth ?? own.value.navbarWidth);
const asideWidth = computed(() => props.asideWidth ?? own.value.asideWidth);
const sized = computed(
    () => props.navbarResizable || props.asideResizable || !!navbarWidth.value || !!asideWidth.value
);
function remember(change: Stored) {
    own.value = { ...own.value, ...change };
    if (props.storageKey) writeStored(props.storageKey, own.value);
}
function setCollapsed(next: boolean) {
    remember({ navbarCollapsed: next });
    emit('update:navbarCollapsed', next);
}

const styles = computed(() =>
    appShell({
        sized: sized.value,
        collapsed: collapsed.value,
        expandOnHover: collapsed.value && props.navbarExpandOnHover,
        headroom: props.headroom,
        layout: props.layout,
    })
);
const style = computed(() =>
    sized.value
        ? {
              '--wc-navbar-width': `${navbarWidth.value ?? NAVBAR_WIDTH}px`,
              '--wc-aside-width': `${asideWidth.value ?? ASIDE_WIDTH}px`,
          }
        : undefined
);

// Resize handles (window splitter pattern): value = width in px
type Side = 'navbar' | 'aside';
const limits = (side: Side) =>
    side === 'navbar'
        ? { min: props.navbarMinWidth, max: props.navbarMaxWidth }
        : { min: props.asideMinWidth, max: props.asideMaxWidth };
const widthOf = (side: Side) =>
    side === 'navbar' ? (navbarWidth.value ?? NAVBAR_WIDTH) : (asideWidth.value ?? ASIDE_WIDTH);
function setWidth(side: Side, width: number) {
    if (side === 'navbar') {
        remember({ navbarWidth: width });
        emit('update:navbarWidth', width);
    } else {
        remember({ asideWidth: width });
        emit('update:asideWidth', width);
    }
}
const rtlOf = (element: Element) => getComputedStyle(element).direction === 'rtl';
function onResizeKey(side: Side, event: KeyboardEvent) {
    // The navbar grows towards the inline end, the aside towards the start
    const towardsEnd = (side === 'navbar') !== rtlOf(event.currentTarget as Element);
    const next = resizeForKey(
        event.key,
        event.shiftKey,
        widthOf(side),
        limits(side),
        towardsEnd ? 'ArrowRight' : 'ArrowLeft'
    );
    if (next === undefined) return;
    event.preventDefault();
    setWidth(side, next);
}
const dragging = ref<Side | null>(null);
let drag: { side: Side; x: number; width: number; sign: number } | null = null;
function onResizeStart(side: Side, event: PointerEvent) {
    if (event.button !== 0) return;
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    const sign = (side === 'navbar') !== rtlOf(handle) ? 1 : -1;
    drag = { side, x: event.clientX, width: widthOf(side), sign };
    dragging.value = side;
    event.preventDefault();
}
function onResizeMove(event: PointerEvent) {
    if (!drag) return;
    setWidth(drag.side, clampSize(drag.width + (event.clientX - drag.x) * drag.sign, limits(drag.side)));
}
function onResizeEnd() {
    drag = null;
    dragging.value = null;
}
const resetWidth = (side: Side) => setWidth(side, side === 'navbar' ? NAVBAR_WIDTH : ASIDE_WIDTH);

// Headroom: hide the header while scrolling down
const headerHidden = ref(false);
let lastY = 0;
const onScroll = () => {
    headerHidden.value = headroomHidden(lastY, window.scrollY, headerHidden.value);
    lastY = window.scrollY;
};
onMounted(() => {
    const stored = readStored<Stored>(props.storageKey);
    if (stored && typeof stored === 'object') own.value = stored;
    if (props.headroom) window.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => {
    if (typeof window !== 'undefined') window.removeEventListener('scroll', onScroll);
});
</script>

<template>
    <!--
        App frame with landmarks: skip link, header (banner), side navigation (from lg on; below a drawer behind the
        menu button), main (target of the skip link), an optional aside (from xl on) and footer. Optional: rail,
        resize handles (role="separator"), headroom header, navbar running the full height.
    -->
    <div :class="styles.base()" :style="style">
        <SkipLinks
            v-if="skipLinks?.length"
            :links="[{ href: `#${id}-main`, label: skipLinkLabel ?? translations.appShell.skipLink }, ...skipLinks]"
        />
        <a v-else :href="`#${id}-main`" :class="styles.skipLink()">{{
            skipLinkLabel ?? translations.appShell.skipLink
        }}</a>
        <header :class="styles.header()" :data-hidden="headroom && headerHidden ? '' : undefined">
            <IconButton
                v-if="slots.navbar"
                :icon="Menu"
                :label="translations.appShell.openNavigation"
                variant="text"
                :class="styles.burger()"
                :aria-expanded="open"
                @click="setOpen(true)"
            />
            <IconButton
                v-if="slots.navbar && collapsible"
                :icon="collapsed ? PanelLeftOpen : PanelLeftClose"
                :label="collapsed ? translations.appShell.expandNavigation : translations.appShell.collapseNavigation"
                variant="text"
                :class="styles.collapseToggle()"
                @click="setCollapsed(!collapsed)"
            />
            <slot name="header" />
        </header>
        <div :class="styles.body()">
            <div v-if="slots.navbar" :id="navbarResizable ? `${id}-navbar` : undefined" :class="styles.navbar()">
                <RailScope :rail="collapsed" :expand-on-hover="!!navbarExpandOnHover"><slot name="navbar" /></RailScope>
            </div>
            <div
                v-if="slots.navbar && navbarResizable && !collapsed"
                role="separator"
                aria-orientation="vertical"
                tabindex="0"
                :aria-label="translations.appShell.resizeNavigation"
                :aria-controls="`${id}-navbar`"
                :aria-valuenow="widthOf('navbar')"
                :aria-valuemin="navbarMinWidth"
                :aria-valuemax="navbarMaxWidth"
                data-side="navbar"
                :data-dragging="dragging === 'navbar' ? '' : undefined"
                :class="styles.resizer()"
                @keydown="onResizeKey('navbar', $event)"
                @pointerdown="onResizeStart('navbar', $event)"
                @pointermove="onResizeMove"
                @pointerup="onResizeEnd"
                @pointercancel="onResizeEnd"
                @dblclick="resetWidth('navbar')"
            />
            <main :id="`${id}-main`" tabindex="-1" :class="styles.main()"><slot /></main>
            <div
                v-if="slots.aside && asideResizable"
                role="separator"
                aria-orientation="vertical"
                tabindex="0"
                :aria-label="translations.appShell.resizeAside"
                :aria-controls="`${id}-aside`"
                :aria-valuenow="widthOf('aside')"
                :aria-valuemin="asideMinWidth"
                :aria-valuemax="asideMaxWidth"
                data-side="aside"
                :data-dragging="dragging === 'aside' ? '' : undefined"
                :class="styles.resizer()"
                @keydown="onResizeKey('aside', $event)"
                @pointerdown="onResizeStart('aside', $event)"
                @pointermove="onResizeMove"
                @pointerup="onResizeEnd"
                @pointercancel="onResizeEnd"
                @dblclick="resetWidth('aside')"
            />
            <aside v-if="slots.aside" :id="asideResizable ? `${id}-aside` : undefined" :class="styles.aside()">
                <slot name="aside" />
            </aside>
        </div>
        <footer v-if="slots.footer" :class="styles.footer()"><slot name="footer" /></footer>
        <Drawer v-if="slots.navbar" :open="open" @update:open="setOpen">
            <DrawerContent :title="navbarLabel ?? translations.appShell.navigation" placement="left">
                <RailScope :rail="false" :expand-on-hover="false"><slot name="navbar" /></RailScope>
            </DrawerContent>
        </Drawer>
    </div>
</template>

import { activeSection, headroomHidden } from '@wirecore/wirelayer-recipes';
import { computed, onMounted, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue';

/** A function ref for templates (`:ref="intersection.ref"`) that keeps the element in a ref */
function elementRef() {
    const element = shallowRef<Element | null>(null);
    const set = (value: unknown) => {
        const next = (value as { $el?: Element } | null)?.$el ?? (value as Element | null) ?? null;
        if (element.value !== next) element.value = next;
    };
    return { element, set };
}

/** The IntersectionObserver entry of an element (bind `ref` to it) */
export function useIntersection(options: IntersectionObserverInit = {}) {
    const { element, set } = elementRef();
    const entry = shallowRef<IntersectionObserverEntry | null>(null);
    let observer: IntersectionObserver | undefined;
    onMounted(() =>
        watch(
            element,
            (target) => {
                observer?.disconnect();
                if (!target || typeof IntersectionObserver === 'undefined') return;
                observer = new IntersectionObserver(([next]) => (entry.value = next ?? null), options);
                observer.observe(target);
            },
            { immediate: true }
        )
    );
    onScopeDispose(() => observer?.disconnect());
    return { ref: set, entry };
}

/** Whether an element is (partly) in the viewport (bind `ref` to it) */
export function useInViewport(options: IntersectionObserverInit = {}) {
    const { ref, entry } = useIntersection(options);
    return { ref, inViewport: computed(() => !!entry.value?.isIntersecting) };
}

/** The content box of an element as it changes (bind `ref` to it) */
export function useResizeObserver() {
    const { element, set } = elementRef();
    const rect = shallowRef<DOMRectReadOnly | null>(null);
    let observer: ResizeObserver | undefined;
    onMounted(() =>
        watch(
            element,
            (target) => {
                observer?.disconnect();
                if (!target || typeof ResizeObserver === 'undefined') return;
                observer = new ResizeObserver(([next]) => (rect.value = next?.contentRect ?? null));
                observer.observe(target);
            },
            { immediate: true }
        )
    );
    onScopeDispose(() => observer?.disconnect());
    return { ref: set, rect };
}

/** Width and height of an element (content box, px; 0 until measured) */
export function useElementSize() {
    const { ref, rect } = useResizeObserver();
    return { ref, width: computed(() => rect.value?.width ?? 0), height: computed(() => rect.value?.height ?? 0) };
}

/** Scroll position of the window and `scrollTo` (0 on the server) */
export function useWindowScroll() {
    const x = ref(0);
    const y = ref(0);
    const update = () => {
        x.value = window.scrollX;
        y.value = window.scrollY;
    };
    onMounted(() => {
        update();
        window.addEventListener('scroll', update, { passive: true });
    });
    onScopeDispose(() => {
        if (typeof window !== 'undefined') window.removeEventListener('scroll', update);
    });
    return {
        x,
        y,
        scrollTo: (position: { x?: number; y?: number }) =>
            window.scrollTo({ left: position.x, top: position.y, behavior: 'smooth' }),
    };
}

/**
 * The id of the section being read: the last of `ids` whose top passed `offset` px (e.g. a sticky header) –
 * for a table of contents
 */
export function useScrollSpy(ids: MaybeRefOrGetter<string[]>, options: { offset?: number } = {}) {
    const active = ref<string | null>(null);
    const update = () => {
        const sections = toValue(ids)
            .map((id) => document.getElementById(id))
            .filter((element): element is HTMLElement => !!element)
            .map((element) => ({ id: element.id, top: element.getBoundingClientRect().top }));
        active.value = activeSection(sections, options.offset ?? 0);
    };
    onMounted(() => {
        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        watch(() => toValue(ids), update);
    });
    onScopeDispose(() => {
        if (typeof window === 'undefined') return;
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
    });
    return { active, update };
}

/** Headroom: true while a header should hide (scrolling down past `offset`), false when scrolling up */
export function useHeadroom(options: { offset?: number; tolerance?: number } = {}) {
    const hidden = ref(false);
    let previous = 0;
    const update = () => {
        const current = window.scrollY;
        hidden.value = headroomHidden(previous, current, hidden.value, options.offset, options.tolerance);
        previous = current;
    };
    onMounted(() => {
        previous = window.scrollY;
        window.addEventListener('scroll', update, { passive: true });
    });
    onScopeDispose(() => {
        if (typeof window !== 'undefined') window.removeEventListener('scroll', update);
    });
    return hidden;
}

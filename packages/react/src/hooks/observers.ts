import { activeSection, headroomHidden } from '@wirecore/wirelayer-recipes';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** The IntersectionObserver entry of an element (pass `ref` to it) */
export function useIntersection(options: IntersectionObserverInit = {}) {
    const [element, setElement] = useState<Element | null>(null);
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
    const { root, rootMargin } = options;
    const threshold = JSON.stringify(options.threshold ?? 0);
    useEffect(() => {
        if (!element || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([next]) => setEntry(next ?? null), {
            root,
            rootMargin,
            threshold: JSON.parse(threshold) as number | number[],
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [element, root, rootMargin, threshold]);
    return { ref: setElement, entry };
}

/** Whether an element is (partly) in the viewport (pass `ref` to it) */
export function useInViewport(options: IntersectionObserverInit = {}) {
    const { ref, entry } = useIntersection(options);
    return { ref, inViewport: !!entry?.isIntersecting };
}

/** The content box of an element as it changes (pass `ref` to it) */
export function useResizeObserver() {
    const [element, setElement] = useState<Element | null>(null);
    const [rect, setRect] = useState<DOMRectReadOnly | null>(null);
    useEffect(() => {
        if (!element || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(([next]) => setRect(next?.contentRect ?? null));
        observer.observe(element);
        return () => observer.disconnect();
    }, [element]);
    return { ref: setElement, rect };
}

/** Width and height of an element (content box, px; 0 until measured) */
export function useElementSize() {
    const { ref, rect } = useResizeObserver();
    return { ref, width: rect?.width ?? 0, height: rect?.height ?? 0 };
}

const subscribeScroll = (notify: () => void) => {
    window.addEventListener('scroll', notify, { passive: true });
    return () => window.removeEventListener('scroll', notify);
};

/** Scroll position of the window and `scrollTo` (0 on the server) */
export function useWindowScroll() {
    const x = useSyncExternalStore(
        subscribeScroll,
        () => window.scrollX,
        () => 0
    );
    const y = useSyncExternalStore(
        subscribeScroll,
        () => window.scrollY,
        () => 0
    );
    const scrollTo = useCallback(
        (position: { x?: number; y?: number }) =>
            window.scrollTo({ left: position.x, top: position.y, behavior: 'smooth' }),
        []
    );
    return { x, y, scrollTo };
}

/**
 * The id of the section being read: the last of `ids` whose top passed `offset` px (e.g. a sticky header) –
 * for a table of contents
 */
export function useScrollSpy(ids: string[], options: { offset?: number } = {}) {
    const [active, setActive] = useState<string | null>(null);
    const key = ids.join('\n');
    const { offset = 0 } = options;
    const update = useCallback(() => {
        const sections = key
            .split('\n')
            .map((id) => document.getElementById(id))
            .filter((element): element is HTMLElement => !!element)
            .map((element) => ({ id: element.id, top: element.getBoundingClientRect().top }));
        setActive(activeSection(sections, offset));
    }, [key, offset]);
    useEffect(() => {
        const frame = requestAnimationFrame(update);
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [update]);
    return { active, update };
}

/** Headroom: true while a header should hide (scrolling down past `offset`), false when scrolling up */
export function useHeadroom(options: { offset?: number; tolerance?: number } = {}) {
    const [hidden, setHidden] = useState(false);
    const previous = useRef(0);
    const { offset, tolerance } = options;
    useEffect(() => {
        previous.current = window.scrollY;
        const update = () => {
            const current = window.scrollY;
            const last = previous.current;
            previous.current = current;
            setHidden((state) => headroomHidden(last, current, state, offset, tolerance));
        };
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, [offset, tolerance]);
    return hidden;
}

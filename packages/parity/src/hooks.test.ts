import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { act, render as renderReact } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render as renderVue } from '@testing-library/vue';
import * as React from '@wirecore/wirelayer-react';
import * as Vue from '@wirecore/wirelayer-vue';
import { createElement, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, isRef, nextTick, ref, type Ref } from 'vue';
import { frameworks, type Framework } from './harness.js';

// The hooks of @wirecore/wirelayer-react and the composables of @wirecore/wirelayer-vue: same names, same behaviour (Vue returns refs,
// React plain values – `read` unwraps both)

type Lib = typeof Vue & typeof React;
const lib = (framework: Framework) => (framework === 'vue' ? Vue : React) as unknown as Lib;
const read = <T>(value: T | Ref<T>): T => (isRef(value) ? value.value : value);
const tick = (ms = 0) => act(() => new Promise((done) => setTimeout(done, ms)));
type Create = (type: string, props?: Record<string, unknown>, ...children: unknown[]) => unknown;

/**
 * Mounts a component that calls `use` and renders `view(result)` (built with a framework-neutral `create`); returns
 * the latest result
 */
async function mountHook<T>(
    framework: Framework,
    use: (lib: Lib) => T,
    view?: (result: T, create: Create) => unknown
): Promise<{ current: () => T; unmount: () => void }> {
    let latest: T;
    if (framework === 'vue') {
        const Comp = defineComponent({
            setup() {
                const result = use(lib('vue'));
                latest = result;
                return () =>
                    (view?.(result, (type, props = {}, ...children) => h(type, props, children as never)) as never) ??
                    h('div');
            },
        });
        const { unmount } = renderVue(Comp);
        await nextTick();
        return { current: () => latest, unmount };
    }
    const Comp = () => {
        const result = use(lib('react'));
        latest = result;
        return (view?.(result, (type, props = {}, ...children) => createElement(type, props, ...(children as []))) ??
            createElement('div')) as never;
    };
    const { unmount } = renderReact(createElement(Comp));
    await tick();
    return { current: () => latest, unmount };
}

/** A controllable matchMedia: `set(query, matches)` changes a query and tells its listeners */
function mockMatchMedia() {
    const original = window.matchMedia;
    const state = new Map<string, boolean>();
    const listeners = new Map<string, Set<(event: { matches: boolean }) => void>>();
    window.matchMedia = ((query: string) => ({
        get matches() {
            return state.get(query) ?? false;
        },
        media: query,
        addEventListener: (_: string, listener: (event: { matches: boolean }) => void) => {
            listeners.set(query, (listeners.get(query) ?? new Set()).add(listener));
        },
        removeEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
            listeners.get(query)?.delete(listener),
    })) as unknown as typeof window.matchMedia;
    return {
        set(query: string, matches: boolean) {
            state.set(query, matches);
            for (const listener of listeners.get(query) ?? []) listener({ matches });
        },
        restore: () => (window.matchMedia = original),
    };
}

afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
});

describe.each(frameworks)('%s', (framework) => {
    it('useDisclosure: open, close, toggle with callbacks', async () => {
        const onOpen = vi.fn();
        const onClose = vi.fn();
        const hook = await mountHook(framework, (l) => l.useDisclosure(false, { onOpen, onClose }));
        await act(async () => hook.current().open());
        expect(read(hook.current().opened)).toBe(true);
        expect(onOpen).toHaveBeenCalledTimes(1);
        await act(async () => hook.current().toggle());
        expect(read(hook.current().opened)).toBe(false);
        expect(onClose).toHaveBeenCalledTimes(1);
        await act(async () => hook.current().close());
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('useMediaQuery, useReducedMotion, useColorScheme follow the media queries (false on the server)', async () => {
        const media = mockMatchMedia();
        try {
            const hook = await mountHook(framework, (l) => ({
                wide: l.useMediaQuery('(min-width: 768px)'),
                reduced: l.useReducedMotion(),
                scheme: l.useColorScheme(),
            }));
            expect(read(hook.current().wide)).toBe(false);
            await act(async () => media.set('(min-width: 768px)', true));
            await act(async () => media.set('(prefers-reduced-motion: reduce)', true));
            await act(async () => media.set('(prefers-color-scheme: dark)', true));
            await tick();
            expect(read(hook.current().wide)).toBe(true);
            expect(read(hook.current().reduced)).toBe(true);
            expect(read(hook.current().scheme)).toBe('dark');
        } finally {
            media.restore();
        }
    });

    it('useResolvedTokens: the token colours as hex, new ones when the page changes', async () => {
        const root = document.documentElement;
        root.style.setProperty('--wc-bg', '#ffffff');
        try {
            const hook = await mountHook(framework, (l) => l.useResolvedTokens());
            expect(read(hook.current()).bg).toBe('#ffffff');
            await act(async () => root.style.setProperty('--wc-bg', '#0a0a0a'));
            await waitFor(() => expect(read(hook.current()).bg).toBe('#0a0a0a'));
            hook.unmount();
        } finally {
            root.removeAttribute('style');
        }
    });

    it('useClipboard: copies, reports copied for a while, keeps errors', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        const hook = await mountHook(framework, (l) => l.useClipboard({ timeout: 30 }));
        await act(() => hook.current().copy('Hello'));
        expect(writeText).toHaveBeenCalledWith('Hello');
        expect(read(hook.current().copied)).toBe(true);
        await waitFor(() => expect(read(hook.current().copied)).toBe(false));
        writeText.mockRejectedValueOnce(new Error('denied'));
        await act(() => hook.current().copy('x'));
        expect(read(hook.current().error)?.message).toBe('denied');
    });

    it('useLocalStorage and useSessionStorage: default first, then stored; other users of the key follow', async () => {
        localStorage.setItem('wc-test', JSON.stringify('saved'));
        const hook = await mountHook(framework, (l) => ({
            first: l.useLocalStorage('wc-test', 'standard'),
            second: l.useLocalStorage('wc-test', 'standard'),
            session: l.useSessionStorage('wc-session', 1),
        }));
        await tick();
        const value = (entry: unknown) => (framework === 'vue' ? read(entry as Ref) : (entry as unknown[])[0]);
        const set = (entry: unknown, next: unknown) =>
            framework === 'vue'
                ? ((entry as Ref).value = next)
                : (entry as [unknown, (value: unknown) => void])[1](next);
        expect(value(hook.current().first)).toBe('saved');
        await act(async () => set(hook.current().first, 'neu'));
        await tick();
        expect(value(hook.current().second)).toBe('neu');
        expect(JSON.parse(localStorage.getItem('wc-test')!)).toBe('neu');
        await act(async () => set(hook.current().session, 2));
        await tick();
        expect(value(hook.current().session)).toBe(2);
        expect(sessionStorage.getItem('wc-session')).toBe('2');
    });

    it('useDebouncedValue follows after a pause; useDebouncedCallback and useThrottledCallback limit calls', async () => {
        const debounced = vi.fn();
        const throttled = vi.fn();
        let setText: (text: string) => void = () => {};
        const hook = await mountHook(framework, (l) => {
            let text: Ref<string> | string;
            if (framework === 'vue') {
                const source = ref('a');
                setText = (next) => (source.value = next);
                text = source;
            } else {
                const [value, setValue] = useState('a');
                setText = setValue;
                text = value;
            }
            return {
                value: (l.useDebouncedValue as (value: unknown, wait: number) => unknown)(text, 30),
                debounce: l.useDebouncedCallback(debounced, 30),
                throttle: l.useThrottledCallback(throttled, 50),
            };
        });
        await act(async () => setText('ab'));
        await act(async () => setText('abc'));
        expect(read(hook.current().value as string)).toBe('a');
        await waitFor(() => expect(read(hook.current().value as string)).toBe('abc'));
        hook.current().debounce(1);
        hook.current().debounce(2);
        hook.current().throttle(1);
        hook.current().throttle(2);
        hook.current().throttle(3);
        expect(throttled).toHaveBeenCalledExactlyOnceWith(1);
        await waitFor(() => expect(debounced).toHaveBeenCalledExactlyOnceWith(2));
        await waitFor(() => expect(throttled).toHaveBeenLastCalledWith(3));
    });

    it('useInterval and useTimeout run, stop and restart', async () => {
        const every = vi.fn();
        const once = vi.fn();
        const hook = await mountHook(framework, (l) => ({
            interval: l.useInterval(every, 10),
            timeout: l.useTimeout(once, 10),
        }));
        await waitFor(() => expect(every.mock.calls.length).toBeGreaterThan(1));
        await act(async () => hook.current().interval.stop());
        const calls = every.mock.calls.length;
        await tick(40);
        expect(every.mock.calls.length).toBe(calls);
        expect(read(hook.current().interval.active)).toBe(false);
        expect(once).not.toHaveBeenCalled();
        await act(async () => hook.current().timeout.start());
        expect(read(hook.current().timeout.pending)).toBe(true);
        await waitFor(() => expect(once).toHaveBeenCalledTimes(1));
        expect(read(hook.current().timeout.pending)).toBe(false);
    });

    it('useIdle: idle after the timeout, active again on input', async () => {
        const hook = await mountHook(framework, (l) => l.useIdle(30));
        expect(read(hook.current())).toBe(false);
        await waitFor(() => expect(read(hook.current())).toBe(true));
        await act(async () => fireEvent.keyDown(window, { key: 'a' }));
        expect(read(hook.current())).toBe(false);
    });

    it('useIntersection, useInViewport, useResizeObserver, useElementSize observe the element of `ref`', async () => {
        const intersections: ((entries: unknown[]) => void)[] = [];
        const resizes: ((entries: unknown[]) => void)[] = [];
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                constructor(callback: (entries: unknown[]) => void) {
                    intersections.push(callback);
                }
                observe() {}
                disconnect() {}
            }
        );
        vi.stubGlobal(
            'ResizeObserver',
            class {
                constructor(callback: (entries: unknown[]) => void) {
                    resizes.push(callback);
                }
                observe() {}
                disconnect() {}
            }
        );
        try {
            const hook = await mountHook(
                framework,
                (l) => ({ view: l.useInViewport(), size: l.useElementSize() }),
                (result, create) =>
                    create(
                        'div',
                        {},
                        create('p', { ref: result.view.ref }, 'A'),
                        create('p', { ref: result.size.ref }, 'B')
                    )
            );
            await tick();
            expect(read(hook.current().view.inViewport)).toBe(false);
            await act(async () => intersections.at(-1)!([{ isIntersecting: true }]));
            expect(read(hook.current().view.inViewport)).toBe(true);
            await act(async () => resizes.at(-1)!([{ contentRect: { width: 120, height: 40 } }]));
            expect(read(hook.current().size.width)).toBe(120);
            expect(read(hook.current().size.height)).toBe(40);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('useWindowScroll, useHeadroom and useScrollSpy follow the scroll position', async () => {
        let scrollY = 0;
        vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY);
        const tops: Record<string, number> = { intro: 0, details: 400 };
        const hook = await mountHook(
            framework,
            (l) => ({
                scroll: l.useWindowScroll(),
                hidden: l.useHeadroom(),
                spy: l.useScrollSpy(['intro', 'details'], { offset: 64 }),
            }),
            (_, create) =>
                create(
                    'div',
                    {},
                    create('section', { id: 'intro' }, 'Intro'),
                    create('section', { id: 'details' }, 'Details')
                )
        );
        for (const id of ['intro', 'details'])
            document.getElementById(id)!.getBoundingClientRect = () => ({ top: tops[id]! - scrollY }) as DOMRect;
        await act(async () => {
            scrollY = 500;
            window.dispatchEvent(new Event('scroll'));
        });
        await tick();
        expect(read(hook.current().scroll.y)).toBe(500);
        expect(read(hook.current().hidden)).toBe(true);
        expect(read(hook.current().spy.active)).toBe('details');
        await act(async () => {
            scrollY = 100;
            window.dispatchEvent(new Event('scroll'));
        });
        expect(read(hook.current().hidden)).toBe(false);
        expect(read(hook.current().spy.active)).toBe('intro');
    });

    it('useNetwork and useDocumentVisibility follow the browser', async () => {
        const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
        const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
        const hook = await mountHook(framework, (l) => ({
            network: l.useNetwork(),
            visibility: l.useDocumentVisibility(),
        }));
        expect(read(hook.current().network).online).toBe(true);
        await act(async () => {
            online.mockReturnValue(false);
            window.dispatchEvent(new Event('offline'));
            visibility.mockReturnValue('hidden');
            document.dispatchEvent(new Event('visibilitychange'));
        });
        expect(read(hook.current().network).online).toBe(false);
        expect(read(hook.current().visibility)).toBe('hidden');
    });

    it('useFullscreen: enter asks the element, the state follows fullscreenchange', async () => {
        let current: Element | null = null;
        Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => current });
        const requestFullscreen = vi.fn(async () => {
            current = document.querySelector('[data-testid=video]');
            document.dispatchEvent(new Event('fullscreenchange'));
        });
        Element.prototype.requestFullscreen = requestFullscreen;
        const hook = await mountHook(
            framework,
            (l) => l.useFullscreen(),
            (result, create) => create('div', { ref: result.ref, 'data-testid': 'video' })
        );
        await tick();
        await act(() => hook.current().enter());
        expect(requestFullscreen).toHaveBeenCalled();
        expect(read(hook.current().fullscreen)).toBe(true);
        delete (document as { fullscreenElement?: unknown }).fullscreenElement;
    });

    it('useStateHistory: set, undo, redo, reset', async () => {
        const hook = await mountHook(framework, (l) => l.useStateHistory('a'));
        await act(async () => hook.current().set('b'));
        await act(async () => hook.current().set('c'));
        await act(async () => hook.current().undo());
        expect(read(hook.current().value)).toBe('b');
        expect(read(hook.current().canRedo)).toBe(true);
        await act(async () => hook.current().redo());
        expect(read(hook.current().value)).toBe('c');
        await act(async () => hook.current().reset());
        expect(read(hook.current().value)).toBe('a');
        expect(read(hook.current().canUndo)).toBe(false);
    });

    it('useSelection: toggle, select all, some/all', async () => {
        const items = [{ id: 1 }, { id: 2 }];
        const hook = await mountHook(framework, (l) =>
            l.useSelection(items, { key: (item: { id: number }) => item.id })
        );
        await act(async () => hook.current().toggle({ id: 1 }));
        expect(hook.current().isSelected({ id: 1 })).toBe(true);
        expect(read(hook.current().someSelected)).toBe(true);
        await act(async () => hook.current().selectAll());
        expect(read(hook.current().allSelected)).toBe(true);
        await act(async () => hook.current().clear());
        expect(read(hook.current().selected)).toEqual([]);
    });

    it('useFocusTrap keeps Tab inside; useFocusReturn brings the focus back', async () => {
        const opened = framework === 'vue' ? ref(false) : null;
        let setOpened: (open: boolean) => void = () => {};
        await mountHook(
            framework,
            (l) => {
                let open: boolean | Ref<boolean>;
                if (opened) {
                    open = opened;
                    setOpened = (next) => (opened.value = next);
                } else {
                    const [value, setValue] = useState(false);
                    open = value;
                    setOpened = setValue;
                }
                return { trap: l.useFocusTrap(open as never), restore: l.useFocusReturn(open as never) };
            },
            (result, create) =>
                create(
                    'div',
                    {},
                    create('button', {}, 'Open'),
                    create('div', { ref: result.trap.ref }, create('button', {}, 'First'), create('button', {}, 'Last'))
                )
        );
        screen.getByRole('button', { name: 'Open' }).focus();
        await act(async () => setOpened(true));
        await tick();
        expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
        await userEvent.tab();
        expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
        await act(async () => setOpened(false));
        await tick(10);
        expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
    });

    it('useLongPress: holding fires once, the following click is swallowed', async () => {
        const onLongPress = vi.fn();
        const onClick = vi.fn();
        await mountHook(
            framework,
            (l) => l.useLongPress(onLongPress, { delay: 20 }),
            (handlers, create) => create('button', { ...handlers, onClick }, 'Hold')
        );
        const button = screen.getByRole('button', { name: 'Hold' });
        fireEvent.pointerDown(button, { pointerType: 'mouse', clientX: 5, clientY: 5 });
        await waitFor(() => expect(onLongPress).toHaveBeenCalledWith({ x: 5, y: 5 }));
        fireEvent.pointerUp(button);
        fireEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
        fireEvent.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('useEyeDropper, useFileDialog, useDocumentTitle', async () => {
        vi.stubGlobal(
            'EyeDropper',
            class {
                open = async () => ({ sRGBHex: '#ff8800' });
            }
        );
        const file = new File(['x'], 'a.txt');
        vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
            Object.defineProperty(this, 'files', { value: [file] });
            this.dispatchEvent(new Event('change'));
        });
        try {
            const hook = await mountHook(framework, (l) => {
                l.useDocumentTitle('Settings – WireLayer');
                return { picker: l.useEyeDropper(), dialog: l.useFileDialog({ accept: '.txt' }) };
            });
            await tick();
            expect(document.title).toBe('Settings – WireLayer');
            expect(read(hook.current().picker.supported)).toBe(true);
            expect(await hook.current().picker.open()).toBe('#ff8800');
            await act(async () => {
                await hook.current().dialog.open();
            });
            expect(read(hook.current().dialog.files)).toEqual([file]);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('useHotkey registers while mounted', async () => {
        const handler = vi.fn();
        const hook = await mountHook(framework, (l) => l.useHotkey('mod+j', handler, { description: 'Test' }));
        await userEvent.keyboard('{Control>}j{/Control}');
        expect(handler).toHaveBeenCalledTimes(1);
        hook.unmount();
        await userEvent.keyboard('{Control>}j{/Control}');
        expect(handler).toHaveBeenCalledTimes(1);
    });
});

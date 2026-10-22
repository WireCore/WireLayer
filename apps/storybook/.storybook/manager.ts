// Appearance tools of the host Storybook: mode (light/dark) and theme for the composed Vue and React
// stories (Storybook globals are not passed to composed refs, see shared/theme.ts).
import { themes } from '@wirecore/wirelayer-tokens';
import { createElement, Fragment, useEffect, useRef, useState } from 'react';
import { Button, Select } from 'storybook/internal/components';
import { addons, types } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import { APPEARANCE_MESSAGE, APPEARANCE_REQUEST, isMode, isTheme, type Appearance } from '../shared/theme.js';

const STORAGE_KEY = 'wirecore-appearance';

function readAppearance(): Appearance {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
        return {
            mode: isMode(stored.mode) ? stored.mode : 'dark',
            theme: isTheme(stored.theme) ? stored.theme : 'wirecore',
        };
    } catch {
        return { mode: 'dark', theme: 'wirecore' };
    }
}

function broadcast(appearance: Appearance) {
    for (const frame of document.querySelectorAll('iframe')) {
        frame.contentWindow?.postMessage({ type: APPEARANCE_MESSAGE, ...appearance }, '*');
    }
}

function AppearanceTools() {
    const [appearance, setAppearance] = useState(readAppearance);
    const latest = useRef(appearance);

    useEffect(() => {
        latest.current = appearance;
        broadcast(appearance);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
        } catch {
            // Storage may be unavailable (private mode) – the tools still work for this session
        }
    }, [appearance]);

    useEffect(() => {
        // Stories loading later ask for the current appearance
        const onMessage = (event: MessageEvent) => {
            if (event.data?.type === APPEARANCE_REQUEST) broadcast(latest.current);
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    const modeLabel = appearance.mode === 'dark' ? 'Dark' : 'Light';
    return createElement(
        Fragment,
        null,
        createElement(
            Button,
            {
                variant: 'ghost',
                ariaLabel: `Mode: ${modeLabel} – switch to ${appearance.mode === 'dark' ? 'light' : 'dark'}`,
                onClick: () =>
                    setAppearance((current) => ({ ...current, mode: current.mode === 'dark' ? 'light' : 'dark' })),
            },
            `Mode: ${modeLabel}`
        ),
        createElement(Select, {
            ariaLabel: 'Theme',
            padding: 'small',
            options: themes.map((theme) => ({ title: theme.label, value: theme.name })),
            defaultOptions: appearance.theme,
            showSelectedOptionTitle: true,
            onSelect: (value) => {
                if (isTheme(value)) setAppearance((current) => ({ ...current, theme: value }));
            },
        })
    );
}

addons.register('wirecore/appearance', () => {
    addons.add('wirecore/appearance/tool', {
        type: types.TOOL,
        title: 'Appearance',
        render: () => createElement(AppearanceTools),
    });
});

// Branding of the Storybook UI; light or dark follows the system setting like Storybook's default theme
addons.setConfig({
    theme: create({
        base: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        brandTitle:
            '<span style="display:inline-flex;align-items:center;gap:8px"><img src="./brand/wirelayer.svg" alt="" width="24" height="24" />WireLayer</span>',
        brandUrl: 'https://github.com/WireCore/WireLayer',
        brandTarget: '_blank',
    }),
});

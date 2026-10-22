import type { Decorator, Preview } from '@storybook/react-native-web-vite';
import { nativeThemeName } from '@wirecore/wirelayer-tokens';
import { Uniwind, type ThemeName } from 'uniwind';
import {
    appearanceGlobalTypes,
    appearanceInitialGlobals,
    onAppearance,
    withAppearance,
} from '../../../apps/storybook/shared/theme.js';
import { localeGlobalTypes, localeInitialGlobals, localeOf } from '../../../apps/storybook/shared/locale.js';
import { registerLocale } from '@wirecore/wirelayer-recipes/native';
import { LocaleProvider } from '../src/locale.js';
import { ar } from '../src/locales/ar.js';
import { cs } from '../src/locales/cs.js';
import { es } from '../src/locales/es.js';
import { fr } from '../src/locales/fr.js';
import { hu } from '../src/locales/hu.js';
import { it } from '../src/locales/it.js';
import { lv } from '../src/locales/lv.js';
import { nl } from '../src/locales/nl.js';
import { pl } from '../src/locales/pl.js';
import { ptBR } from '../src/locales/pt-BR.js';
import { pt } from '../src/locales/pt.js';
import { tr } from '../src/locales/tr.js';
import { fonts } from '../src/fonts.js';
import './global.css';
import './preview.css';

// The toolbar languages that are not built in – an app registers the ones it needs the same way
const locales = { fr, es, it, pt, 'pt-BR': ptBR, nl, pl, cs, hu, lv, tr, ar };
for (const [code, texts] of Object.entries(locales)) registerLocale(code, texts);

// In an Expo app useFonts() loads them; here the browser does
for (const [family, url] of Object.entries(fonts)) {
    const face = new FontFace(family, `url(${String(url)})`);
    document.fonts.add(face);
    void face.load();
}

onAppearance(({ theme, mode }) => Uniwind.setTheme(nativeThemeName(theme, mode) as ThemeName));

// All languages but the RTL test entry – right to left comes from I18nManager in an app, not from the toolbar, so
// Arabic shows its texts only
const locale = {
    ...localeGlobalTypes.locale,
    toolbar: {
        ...localeGlobalTypes.locale.toolbar,
        items: localeGlobalTypes.locale.toolbar.items.filter((item) => item.value !== 'he-IL'),
    },
};
const withLocale: Decorator = (Story, context) => (
    <LocaleProvider locale={localeOf(context.globals)}>
        <Story />
    </LocaleProvider>
);

const preview: Preview = {
    globalTypes: { ...appearanceGlobalTypes, locale },
    initialGlobals: { ...appearanceInitialGlobals, ...localeInitialGlobals },
    decorators: [withLocale, withAppearance],
    parameters: {
        layout: 'centered',
        options: {
            storySort: {
                order: [
                    'Basics',
                    'Buttons',
                    'Forms',
                    'Data',
                    'Media',
                    'Feedback',
                    'Navigation',
                    'Layout',
                    'Overlays',
                    'Utilities',
                ],
            },
        },
    },
};

export default preview;

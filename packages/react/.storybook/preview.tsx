import type { Decorator, Preview } from '@storybook/react-vite';
import {
    appearanceGlobalTypes,
    appearanceInitialGlobals,
    withAppearance,
} from '../../../apps/storybook/shared/theme.js';
import { localeGlobalTypes, localeInitialGlobals, localeOf } from '../../../apps/storybook/shared/locale.js';
import { localeDirection } from '@wirecore/wirelayer-recipes';
import { LocaleProvider, registerLocale } from '../src/index.js';
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
import './preview.css';

// The toolbar languages that are not built in – an app registers the ones it needs the same way
const locales = { fr, es, it, pt, 'pt-BR': ptBR, nl, pl, cs, hu, lv, tr, ar };
for (const [code, texts] of Object.entries(locales)) registerLocale(code, texts);

// The story inside LocaleProvider; lang and dir on <html> like an app would set them
const withLocale: Decorator = (Story, context) => {
    const locale = localeOf(context.globals);
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection(locale);
    return (
        <LocaleProvider locale={locale}>
            <Story />
        </LocaleProvider>
    );
};

const preview: Preview = {
    globalTypes: { ...appearanceGlobalTypes, ...localeGlobalTypes },
    initialGlobals: { ...appearanceInitialGlobals, ...localeInitialGlobals },
    decorators: [withLocale, withAppearance],
    parameters: {
        layout: 'centered',
        options: {
            storySort: {
                order: ['Buttons', 'Forms', 'Data', 'Layout', 'Feedback', 'Navigation', 'Overlays', 'Blocks'],
            },
        },
    },
};

export default preview;

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Visual regression: a screenshot of every story, compared with the baseline in e2e/visual/__screenshots__.
// Baselines depend on the fonts of the Playwright container – create and update them there:
//   docker compose run --rm e2e npx playwright test --project visual --update-snapshots
// (with STORYBOOK_STATIC=1 against the static builds, like CI)

interface Storybook {
    name: string;
    url: string;
    build: string;
}
const storybooks: Storybook[] = ['react', 'css', 'native'].map((name) => ({
    name,
    url: process.env[`WIRECORE_${name.toUpperCase()}_URL`]!,
    build: process.env[`WIRECORE_${name.toUpperCase()}_BUILD`]!,
}));

/** Story ids from the static build or, without one, from the running dev Storybook */
function storiesOf({ url, build }: Storybook): string[] {
    const file = `${build}/index.json`;
    const json = process.env.STORYBOOK_STATIC
        ? existsSync(file)
            ? readFileSync(file, 'utf8')
            : '{"entries":{}}'
        : execFileSync(process.execPath, [
              '-e',
              `fetch(${JSON.stringify(`${url}/index.json`)}).then((r) => r.text()).then((t) => process.stdout.write(t), () => process.stdout.write('{"entries":{}}'))`,
          ]).toString();
    const entries: Record<string, { type: string }> = JSON.parse(json).entries;
    return Object.entries(entries)
        .filter(([, entry]) => entry.type === 'story')
        .map(([id]) => id);
}

// Also in dark mode and right to left: a cross-section of the React components
const dark = [
    'buttons-button--variants',
    'forms-field--text-fields',
    'forms-select--playground',
    'forms-datepicker--playground',
    'data-datatable--playground',
    'data-badge--overview',
    'feedback-alert--statuses',
    'navigation-tabs--playground',
    'overlays-dialog--playground',
    'data-card--service-card',
];
const rtl = [
    'forms-field--text-fields',
    'forms-inputgroup--playground',
    'forms-switch--playground',
    'data-datatable--playground',
    'data-timeline--playground',
    'data-tree--playground',
    'navigation-breadcrumb--playground',
    'data-pagination--playground',
    'navigation-stepper--playground',
    'layout-appshell--playground',
];

// Stories that change on their own (live lines, loading on a timer) – their content depends on timing, the E2E tests
// check their behavior
const changing = ['data-logviewer--live', 'data-datatable--infinite', 'data-dataview--infinite'];

async function shoot(page: Page, url: string, name: string) {
    // A fixed "today" for calendars and date pickers
    await page.clock.setFixedTime(new Date('2026-10-20T10:00:00'));
    await page.goto(url);
    await page.locator('#storybook-root > *, #root > *').first().waitFor();
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    // Lists that scroll to their end (LogViewer "Follow") do so in steps – under load a pause between two steps looks
    // stable to toHaveScreenshot; wait until no scroll position has changed for 10 frames
    await page.evaluate(
        () =>
            new Promise<void>((done) => {
                const positions = () =>
                    [...document.querySelectorAll('*')].map((element) => element.scrollTop + element.scrollLeft).join();
                let last = positions();
                let quiet = 0;
                const frame = () => {
                    const now = positions();
                    quiet = now === last ? quiet + 1 : 0;
                    last = now;
                    if (quiet >= 10) done();
                    else requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);
            })
    );
    await expect(page).toHaveScreenshot(`${name}.png`);
}

test.skip(!!process.env.E2E_MOTION, 'Screenshots only without animations');
test.use({ viewport: { width: 1000, height: 700 } });

for (const storybook of storybooks) {
    test.describe(storybook.name, () => {
        for (const id of storiesOf(storybook).filter((id) => !changing.includes(id))) {
            test(id, async ({ page }) => {
                await shoot(
                    page,
                    `${storybook.url}/iframe.html?id=${id}&viewMode=story&globals=mode:light`,
                    `${storybook.name}/${id}`
                );
            });
        }
    });
}

test.describe('react dark', () => {
    for (const id of dark) {
        test(id, async ({ page }) => {
            await shoot(
                page,
                `${storybooks[0]!.url}/iframe.html?id=${id}&viewMode=story&globals=mode:dark`,
                `react-dark/${id}`
            );
        });
    }
});

test.describe('react rtl', () => {
    for (const id of rtl) {
        test(id, async ({ page }) => {
            await shoot(
                page,
                `${storybooks[0]!.url}/iframe.html?id=${id}&viewMode=story&globals=mode:light;locale:he-IL`,
                `react-rtl/${id}`
            );
        });
    }
});

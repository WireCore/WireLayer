// Runs axe-core in a real browser against every story of the given Storybooks, in every theme and mode.
// Unlike the jsdom tests this sees the rendered CSS, so it also checks colour contrast.
//
//   node scripts/storybook-a11y.ts http://localhost:6007 http://localhost:6008 http://localhost:6009 http://localhost:6010
//   A11Y_FILTER=datepicker node scripts/storybook-a11y.ts …  (only matching stories)
//   node scripts/storybook-a11y.ts ../vue/storybook-static ../react/storybook-static ../native/storybook-static ../css/storybook-static
import { fileURLToPath } from 'node:url';
import type { AxeResults } from 'axe-core';
import { modes, themes } from '@wirecore/wirelayer-tokens';
import { chromium } from 'playwright';
import { serve } from './serve.ts';

const AXE_SOURCE = fileURLToPath(import.meta.resolve('axe-core/axe.min.js'));
interface IndexEntry {
    id: string;
    type: string;
    title: string;
    name: string;
}

const targets = process.argv.slice(2);
if (targets.length === 0)
    targets.push('http://localhost:6007', 'http://localhost:6008', 'http://localhost:6009', 'http://localhost:6010');

const browser = await chromium.launch();
// Reduced motion: no colour transitions while the theme switches, so axe measures the final colours
const newPage = () => browser.newPage({ reducedMotion: 'reduce' });
let page = await newPage();

async function check(url: string) {
    await page.goto(url);
    await page.waitForSelector('#storybook-root > *', { state: 'attached' });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    // The Storybook a11y addon brings its own axe instance – reuse it instead of loading a second one
    if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ path: AXE_SOURCE });
    return page.evaluate(async () => {
        const { axe } = window as unknown as { axe: { run: (context: string) => Promise<AxeResults> } };
        const run = async (attempt = 0): Promise<AxeResults> => {
            try {
                return await axe.run('#storybook-root');
            } catch (error) {
                // The addon may still be running its own check on this story
                if (attempt > 50 || !String(error).includes('already running')) throw error;
                await new Promise((done) => setTimeout(done, 100));
                return run(attempt + 1);
            }
        };
        const results = await run();
        return results.violations
            .filter((violation) => violation.id !== 'region')
            .map((violation) => ({
                rule: `${violation.id} (${violation.impact}): ${violation.help}`,
                nodes: violation.nodes.map((node) => `${node.target.join(' ')}\n        ${node.failureSummary}`),
            }));
    });
}

let checked = 0;
let failed = 0;

// Load every Storybook's index first, so the progress knows the total
const appearances = modes.flatMap((mode) => themes.map((theme) => `mode:${mode};theme:${theme.name}`));
const runs: { base: string; stories: IndexEntry[] }[] = [];
for (const target of targets) {
    const base = target.startsWith('http') ? target.replace(/\/$/, '') : await serve(target);
    const index = (await (await fetch(`${base}/index.json`)).json()) as { entries: Record<string, IndexEntry> };
    // A11Y_FILTER=datepicker checks only matching stories (by id)
    const filter = new RegExp(process.env.A11Y_FILTER ?? '');
    runs.push({
        base,
        stories: Object.values(index.entries).filter((entry) => entry.type === 'story' && filter.test(entry.id)),
    });
}
const total = runs.reduce((sum, run) => sum + run.stories.length, 0) * appearances.length;
const started = Date.now();

/** "[ 37 %]  556/1504  ~6 min left  Forms/Select › Playground" – once per story */
function progress(story: IndexEntry) {
    const elapsed = (Date.now() - started) / 1000;
    const left = checked ? Math.round(((total - checked) * elapsed) / checked / 60) : undefined;
    const percent = String(Math.floor((checked / total) * 100)).padStart(3);
    const eta = left === undefined ? '' : `  ~${left} min left`;
    console.log(
        `[${percent} %]  ${String(checked).padStart(String(total).length)}/${total}${eta}  ${story.title} › ${story.name}`
    );
}

for (const { base, stories } of runs) {
    for (const story of stories) {
        progress(story);
        for (const appearance of appearances) {
            // A dev Storybook may reload once while Vite optimises a new dependency – try a second time
            let violations: { rule: string; nodes: string[] }[] | undefined;
            for (let attempt = 0; attempt < 2 && !violations; attempt++) {
                try {
                    violations = await check(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=${appearance}`);
                } catch (error) {
                    // A crashed page (e.g. out of memory) stays dead – continue with a fresh one
                    if (page.isClosed() || String(error).includes('crashed')) {
                        await page.close().catch(() => {});
                        page = await newPage();
                    }
                    if (attempt === 1)
                        violations = [{ rule: `story did not render: ${String(error).split('\n')[0]}`, nodes: [] }];
                }
            }
            violations ??= [];
            checked++;
            // A fresh page now and then: the renderer kept growing over thousands of stories (GBs per Storybook)
            if (checked % 50 === 0) {
                await page.close().catch(() => {});
                page = await newPage();
            }
            if (violations.length === 0) continue;
            failed++;
            console.log(`✗ ${base} ${story.title} › ${story.name} [${appearance}]`);
            for (const violation of violations) {
                console.log(`    ${violation.rule}`);
                for (const node of violation.nodes) console.log(`      ${node.replaceAll('\n', '\n      ')}`);
            }
        }
    }
}

await browser.close();
console.log(`\n${checked - failed}/${checked} story/mode/theme combinations without axe violations`);
process.exit(failed === 0 ? 0 : 1);

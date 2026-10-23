// Runs axe-core in a real browser against every story of the given Storybooks, in every theme and mode.
// Unlike the jsdom tests this sees the rendered CSS, so it also checks colour contrast.
//
//   node scripts/storybook-a11y.ts http://localhost:6007 http://localhost:6008 http://localhost:6009 http://localhost:6010
//   A11Y_FILTER=datepicker node scripts/storybook-a11y.ts …  (only matching stories)
//   node scripts/storybook-a11y.ts ../vue/storybook-static ../react/storybook-static ../native/storybook-static ../css/storybook-static
//   A11Y_SHARD=1/2 …        (every second story, starting with the first – for parallel CI jobs)
//   A11Y_CONCURRENCY=2 …    (pages at once; default: the CPU cores, at most 4)
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import type { AxeResults } from 'axe-core';
import { modes, themes } from '@wirecore/wirelayer-tokens';
import { chromium, type Page } from 'playwright';
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

async function check(page: Page, url: string) {
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
// A11Y_SHARD=2/3: every third story, starting with the second
const [shard = 1, shards = 1] = (process.env.A11Y_SHARD ?? '1/1').split('/').map(Number);
const queue = runs
    .flatMap(({ base, stories }) => stories.map((story) => ({ base, story })))
    .filter((_, index) => index % shards === shard - 1);
const total = queue.length * appearances.length;
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

/** Checks the next story of the queue in all modes and themes on its own page, until the queue is empty */
async function worker() {
    let page = await newPage();
    let used = 0;
    for (let next = queue.shift(); next; next = queue.shift()) {
        const { base, story } = next;
        progress(story);
        for (const appearance of appearances) {
            // A dev Storybook may reload once while Vite optimises a new dependency – try a second time
            let violations: { rule: string; nodes: string[] }[] | undefined;
            for (let attempt = 0; attempt < 2 && !violations; attempt++) {
                try {
                    // page.evaluate has no timeout of its own – a story that never settles must not stall the run
                    violations = await Promise.race([
                        check(page, `${base}/iframe.html?id=${story.id}&viewMode=story&globals=${appearance}`),
                        new Promise<never>((_, fail) =>
                            setTimeout(() => fail(new Error('timed out after 60 s')), 60_000)
                        ),
                    ]);
                } catch (error) {
                    // A crashed or stuck page (e.g. out of memory) stays dead – continue with a fresh one
                    if (page.isClosed() || /crashed|timed out/.test(String(error))) {
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
            if (++used % 50 === 0) {
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
    await page.close().catch(() => {});
}

// Several pages at once – the stories are independent; the modes and themes of a story stay on one page
const concurrency = Number(process.env.A11Y_CONCURRENCY) || Math.min(4, availableParallelism());
await Promise.all(Array.from({ length: concurrency }, worker));

await browser.close();
console.log(`\n${checked - failed}/${checked} story/mode/theme combinations without axe violations`);
process.exit(failed === 0 ? 0 : 1);

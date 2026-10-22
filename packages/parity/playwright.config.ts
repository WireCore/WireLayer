import { defineConfig } from '@playwright/test';

// Keyboard and interaction tests in a real browser. Every spec runs against the Vue and the React Storybook,
// e2e/native/* against the React Native Storybook (react-native-web), e2e/css/* compares the HTML Storybook
// (@wirecore/wirelayer-css) with the React one.
//   default:            the running dev Storybooks (docker compose up)
//   STORYBOOK_STATIC=1: the static builds (CI), served by scripts/serve.ts
const isStatic = !!process.env.STORYBOOK_STATIC;
const targets = {
    vue: { url: isStatic ? 'http://127.0.0.1:6107' : 'http://localhost:6007', build: '../vue/storybook-static' },
    react: { url: isStatic ? 'http://127.0.0.1:6108' : 'http://localhost:6008', build: '../react/storybook-static' },
    native: { url: isStatic ? 'http://127.0.0.1:6109' : 'http://localhost:6009', build: '../native/storybook-static' },
    css: { url: isStatic ? 'http://127.0.0.1:6110' : 'http://localhost:6010', build: '../css/storybook-static' },
};
// The demo apps as production servers (built with `pnpm build`): in CI, locally with E2E_APPS=1
const withApps = isStatic || !!process.env.E2E_APPS;
const apps = {
    nuxt: { url: 'http://127.0.0.1:3100', command: 'node ../../apps/nuxt/.output/server/index.mjs' },
    next: {
        url: 'http://127.0.0.1:3101',
        command: 'node ../../apps/next/node_modules/next/dist/bin/next start ../../apps/next --port 3101',
    },
};
// The CSS comparison opens the React Storybook as well; the visual tests open every Storybook
for (const [name, target] of Object.entries(targets)) {
    process.env[`WIRECORE_${name.toUpperCase()}_URL`] = target.url;
    process.env[`WIRECORE_${name.toUpperCase()}_BUILD`] = target.build;
}

export default defineConfig({
    testDir: 'e2e',
    reporter: 'list',
    // CI: one retry against load spikes – Playwright still reports such tests as "flaky"
    retries: isStatic ? 1 : 0,
    use: {
        // No transitions by default, so assertions see final states immediately;
        // E2E_MOTION=1 runs everything with animations (keyboard/focus must work during them too)
        reducedMotion: process.env.E2E_MOTION ? 'no-preference' : 'reduce',
    },
    projects: [
        ...Object.entries(targets).map(([name, target]) => ({
            name,
            use: { baseURL: target.url },
            ...(name === 'native' || name === 'css'
                ? { testMatch: `${name}/**/*.spec.ts` }
                : { testIgnore: ['native/**', 'css/**', 'visual/**', 'apps/**'] }),
        })),
        ...(withApps
            ? Object.entries(apps).map(([name, app]) => ({
                  name,
                  use: { baseURL: app.url },
                  testMatch: 'apps/**/*.spec.ts',
              }))
            : []),
        // Screenshots of the stories, compared with e2e/visual/__screenshots__ (made in the Playwright container)
        {
            name: 'visual',
            testMatch: 'visual/**/*.spec.ts',
            snapshotPathTemplate: '{testDir}/visual/__screenshots__/{arg}{ext}',
            expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001 } },
        },
    ],
    webServer: [
        ...(isStatic
            ? Object.values(targets).map((target) => ({
                  command: `node scripts/serve.ts ${target.build} ${new URL(target.url).port}`,
                  url: `${target.url}/index.json`,
                  reuseExistingServer: false,
              }))
            : []),
        ...(withApps
            ? Object.values(apps).map((app) => ({
                  command: app.command,
                  url: app.url,
                  env: { PORT: new URL(app.url).port, HOST: '127.0.0.1', NEXT_TELEMETRY_DISABLED: '1' },
                  reuseExistingServer: !isStatic,
              }))
            : []),
    ],
});

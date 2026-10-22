import { expect, test, type Page } from '@playwright/test';

// The Nuxt and Next.js demo apps (apps/nuxt, apps/next): set up as in the docs, rendered on the server and
// hydrated in the browser. Both projects run this file against their app.

/** Errors in the browser console – hydration mismatches included */
function watchErrors(page: Page) {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        const text = message.text();
        if (message.type() === 'error' || /hydrat/i.test(text)) errors.push(text);
    });
    return errors;
}

/** Opens a page once it is hydrated (dev servers load the modules one by one) */
async function open(page: Page, path: string) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
}

test.describe('server-side rendering', () => {
    test('the HTML already contains the components', async ({ request }) => {
        const html = await (await request.get('/')).text();
        expect(html).toContain('lang="en-US"');
        expect(html).toMatch(/<h1[^>]*>Overview<\/h1>/);
        expect(html).toMatch(
            /role="progressbar"[^>]*aria-label="Availability"|aria-label="Availability"[^>]*role="progressbar"/
        );
        expect(html).toMatch(/<table/);
        expect(html).toContain('web-01');
        // Texts of the components come from the LocaleProvider – English without a cookie
        expect(html).toContain('Skip to content');
        // Light/dark is set before the first paint
        expect(html).toContain('wirecore-mode');
    });

    test('the language cookie renders German on the server', async ({ request }) => {
        const html = await (await request.get('/', { headers: { cookie: 'locale=de-DE' } })).text();
        expect(html).toContain('lang="de-DE"');
        expect(html).toMatch(/<h1[^>]*>Übersicht<\/h1>/);
        expect(html).toContain('Zum Inhalt springen');
    });
});

test.describe('in the browser', () => {
    test('hydrates without errors; sorting and search work', async ({ page }) => {
        const errors = watchErrors(page);
        await open(page, '/');
        await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible();
        const table = page.getByRole('table', { name: 'Servers' });
        await page.getByRole('button', { name: 'Load', exact: true }).click();
        await expect(table.getByRole('row').nth(1)).toContainText('k8s-node-3');
        await page.getByRole('searchbox', { name: 'Search Servers' }).fill('backup');
        await expect(table.getByRole('row')).toHaveCount(2);
        expect(errors).toEqual([]);
    });

    test('switches the language and keeps it across a reload', async ({ page }) => {
        const errors = watchErrors(page);
        await open(page, '/');
        await page.getByText('DE', { exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Übersicht', level: 1 })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', 'de-DE');
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: 'Übersicht', level: 1 })).toBeVisible();
        await expect(page.getByRole('searchbox', { name: 'Server durchsuchen' })).toBeVisible();
        expect(errors).toEqual([]);
    });

    test('switches between light and dark', async ({ page }) => {
        await open(page, '/');
        const html = page.locator('html');
        const before = await html.getAttribute('data-mode');
        await page.getByRole('button', { name: /Switch to (light|dark) mode/ }).click();
        await expect(html).not.toHaveAttribute('data-mode', before ?? '');
    });

    test('the form: errors, a confirmation and a toast', async ({ page }) => {
        const errors = watchErrors(page);
        await open(page, '/anfrage');
        await page.getByRole('button', { name: 'Send request' }).click();
        await expect(page.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-invalid', 'true');
        await page.getByRole('textbox', { name: 'Name' }).fill('Julia Klein');
        await page.getByRole('textbox', { name: 'Email' }).fill('julia@example.com');
        await page.getByRole('combobox', { name: 'Service' }).click();
        await page.getByRole('option', { name: 'Managed Hosting' }).click();
        await page.getByText(/I agree/).click();
        await expect(page.getByRole('checkbox', { name: /I agree/ })).toBeChecked();
        await page.getByRole('button', { name: 'Send request' }).click();
        const dialog = page.getByRole('alertdialog', { name: 'Send the request now?' });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Confirm' }).click();
        await expect(page.getByRole('region', { name: /Notifications/ }).getByText('Request sent')).toBeVisible();
        expect(errors).toEqual([]);
    });
});

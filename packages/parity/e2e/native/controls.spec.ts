import { expect, test } from '@playwright/test';
import { openStory } from '../story.ts';

test.describe('Accordion', () => {
    test('headings are buttons with aria-expanded; one item open at a time', async ({ page }) => {
        await openStory(page, 'layout-accordion--playground');
        const hosting = page.getByRole('button', { name: 'What does managed hosting include?' });
        const support = page.getByRole('button', { name: 'How do I reach support?' });
        await expect(hosting).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByText(/Operations, updates, backups/)).toBeVisible();
        await support.click();
        await expect(support).toHaveAttribute('aria-expanded', 'true');
        await expect(hosting).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByText(/Operations, updates, backups/)).toBeHidden();
    });
});

test.describe('SegmentedControl and ChipGroup', () => {
    test('segments are radio buttons in a named group', async ({ page }) => {
        await openStory(page, 'buttons-segmentedcontrol--playground');
        const group = page.getByRole('radiogroup', { name: 'View' });
        await expect(group.getByRole('radio', { name: 'List' })).toBeChecked();
        await group.getByRole('radio', { name: 'Grid' }).focus();
        await page.keyboard.press('Space');
        await expect(group.getByRole('radio', { name: 'Grid' })).toBeChecked();
        await expect(page.getByText('View: grid')).toBeVisible();
    });

    test('chips are checkboxes in a named group', async ({ page }) => {
        await openStory(page, 'forms-chipgroup--playground');
        const group = page.getByRole('group', { name: 'Filter locations' });
        await expect(group.getByRole('checkbox', { name: 'Frankfurt' })).toBeChecked();
        await group.getByRole('checkbox', { name: 'Vienna' }).click();
        await expect(group.getByRole('checkbox', { name: 'Vienna' })).toBeChecked();
        await expect(group.getByRole('checkbox', { name: 'Zurich' })).toBeDisabled();
        await expect(page.getByText('Selected: fra, vie')).toBeVisible();
    });
});

test.describe('Slider', () => {
    test('a named slider: arrow keys, End and a tap on the track', async ({ page }) => {
        await openStory(page, 'forms-slider--playground');
        const thumb = page.getByRole('slider', { name: 'Volume' });
        await expect(thumb).toHaveAttribute('aria-valuenow', '40');
        await thumb.focus();
        await page.keyboard.press('ArrowRight');
        await expect(thumb).toHaveAttribute('aria-valuenow', '41');
        await page.keyboard.press('End');
        await expect(thumb).toHaveAttribute('aria-valuenow', '100');
        // A tap near the start of the track moves the thumb there
        const box = (await thumb.locator('xpath=..').boundingBox())!;
        await page.mouse.click(box.x + 14, box.y + box.height / 2);
        await expect.poll(async () => Number(await thumb.getAttribute('aria-valuenow'))).toBeLessThan(10);
    });

    test('a range has two thumbs that do not pass each other', async ({ page }) => {
        await openStory(page, 'forms-slider--range');
        const low = page.getByRole('slider', { name: 'Price, Minimum' });
        const high = page.getByRole('slider', { name: 'Price, Maximum' });
        await expect(low).toHaveAttribute('aria-valuetext', '€20');
        await high.focus();
        await page.keyboard.press('Home');
        await expect(high).toHaveAttribute('aria-valuenow', '20');
    });
});

test.describe('NumberInput', () => {
    test('buttons step, typing reads the number, leaving clamps', async ({ page }) => {
        await openStory(page, 'forms-numberinput--playground');
        const input = page.getByRole('textbox', { name: 'Number of servers' });
        await expect(input).toHaveValue('8');
        await page.getByRole('button', { name: 'Increase' }).click();
        await expect(input).toHaveValue('9');
        await input.fill('80');
        await input.blur();
        await expect(input).toHaveValue('50');
        await expect(page.getByRole('button', { name: 'Increase' })).toBeDisabled();
        await expect(page.getByText('Value: 50')).toBeVisible();
    });
});

test.describe('MultiSelect and Combobox', () => {
    test('MultiSelect: a sheet of checkboxes; the trigger names the choice', async ({ page }) => {
        await openStory(page, 'forms-multiselect--playground');
        await page.getByRole('button', { name: 'Services: Managed Hosting' }).click();
        const sheet = page.getByRole('dialog', { name: 'Services' });
        await expect(sheet.getByRole('checkbox', { name: 'Software & Web' })).toBeFocused();
        await sheet.getByRole('checkbox', { name: 'Software & Web' }).click();
        await expect(sheet.getByRole('checkbox', { name: 'Software & Web' })).toBeChecked();
        await page.keyboard.press('Escape');
        await expect(sheet).toBeHidden();
        await expect(page.getByRole('button', { name: 'Services: Software & Web, Managed Hosting' })).toBeVisible();
    });

    test('Combobox: the search filters accent-blind, a tap picks', async ({ page }) => {
        await openStory(page, 'forms-combobox--playground');
        await page.getByRole('button', { name: 'Location: Select' }).click();
        const sheet = page.getByRole('dialog', { name: 'Location' });
        const search = sheet.getByRole('textbox', { name: 'Search …' });
        await expect(search).toBeFocused();
        // Accent-blind: "nü" finds "Nuremberg"
        await search.fill('nü');
        await expect(sheet.getByRole('radio')).toHaveText(['Nuremberg']);
        await search.fill('xyz');
        await expect(sheet.getByText('No results')).toBeVisible();
        await search.fill('co');
        await sheet.getByRole('radio', { name: 'Cologne' }).click();
        await expect(sheet).toBeHidden();
        await expect(page.getByText('Value: cologne')).toBeVisible();
    });
});

test.describe('DatePicker and TimePicker', () => {
    test('the calendar sheet: named days, weekends unavailable, months switch', async ({ page }) => {
        await openStory(page, 'forms-datepicker--playground');
        await page.getByRole('button', { name: 'Maintenance date: 10/20/2026' }).click();
        const sheet = page.getByRole('dialog', { name: 'Maintenance date' });
        const month = sheet.getByRole('radiogroup', { name: 'October 2026' });
        await expect(month.getByRole('radio', { name: 'Tuesday, October 20, 2026' })).toBeChecked();
        await expect(month.getByRole('radio', { name: /Saturday, October 24, 2026/ })).toBeDisabled();
        await sheet.getByRole('button', { name: 'Next month' }).click();
        await expect(sheet.getByRole('radiogroup', { name: 'November 2026' })).toBeVisible();
        await sheet.getByRole('radio', { name: 'Monday, November 2, 2026' }).click();
        await expect(sheet).toBeHidden();
        await expect(page.getByRole('button', { name: 'Maintenance date: 11/02/2026' })).toBeVisible();
    });

    test('times every 30 minutes between min and max', async ({ page }) => {
        await openStory(page, 'forms-datepicker--playground');
        // en-US shows the times with AM/PM, the value stays "HH:mm"
        await page.getByRole('button', { name: 'Start: 09:30 AM' }).click();
        const sheet = page.getByRole('dialog', { name: 'Start' });
        await expect(sheet.getByRole('radio', { name: '09:30 AM' })).toBeFocused();
        await expect(sheet.getByRole('radio').first()).toHaveText('08:00 AM');
        await expect(sheet.getByRole('radio').last()).toHaveText('06:00 PM');
        await sheet.getByRole('radio', { name: '02:00 PM' }).click();
        await expect(page.getByText('Appointment: 2026-10-20 14:00')).toBeVisible();
    });
});

test.describe('Stepper', () => {
    test('linear: "Next" waits for a valid step; the steps carry their status', async ({ page }) => {
        await openStory(page, 'navigation-stepper--playground');
        await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
        await expect(page.getByLabel('1. Contact, current step')).toBeVisible();
        const next = page.getByRole('button', { name: 'Next' });
        await expect(next).toBeDisabled();
        await page.getByRole('textbox', { name: 'Name' }).fill('Julia');
        await next.click();
        await expect(page.getByRole('heading', { name: 'Project' })).toBeVisible();
        await expect(page.getByRole('button', { name: '1. Contact, completed' })).toBeVisible();
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('button', { name: 'Finish' }).click();
        await expect(page.getByText('Thanks, Julia! We will get back to you.')).toBeVisible();
    });
});

test.describe('Drawer', () => {
    test('a named sheet with description; focus on close, Escape closes', async ({ page }) => {
        await openStory(page, 'overlays-drawer--playground');
        await page.getByRole('button', { name: 'Filter' }).click();
        const drawer = page.getByRole('dialog', { name: 'Filter' });
        await expect(drawer).toHaveAccessibleDescription('Narrow down servers by location');
        await expect(drawer.getByRole('button', { name: 'Close' })).toBeFocused();
        await drawer.getByRole('checkbox', { name: 'Vienna' }).click();
        await page.keyboard.press('Escape');
        await expect(drawer).toBeHidden();
        await expect(page.getByText('Locations: vie')).toBeVisible();
    });
});

test.describe('LocaleProvider', () => {
    // English is the default – the toolbar switches the component texts to German (built in)
    test('German texts from the Storybook toolbar', async ({ page }) => {
        await openStory(page, 'forms-combobox--playground', 'dark', 'wirecore', 'de-DE');
        await page.getByRole('button', { name: 'Location: Bitte wählen' }).click();
        const sheet = page.getByRole('dialog', { name: 'Location' });
        await expect(sheet.getByRole('textbox', { name: 'Suchen …' })).toBeVisible();
        await expect(sheet.getByRole('button', { name: 'Schließen' })).toBeVisible();
    });
});

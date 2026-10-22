import { expect, test } from '@playwright/test';
import { openStory } from '../story.ts';

// Form components of @wirecore/wirelayer-native in the browser (react-native-web)

test.describe('Select with search, groups and objects', () => {
    test('the search in the sheet filters, a tap picks an object value, the clear button empties', async ({ page }) => {
        await openStory(page, 'forms-select--objects');
        await page.getByRole('button', { name: 'Server: db-01' }).click();
        const sheet = page.getByRole('dialog', { name: 'Server' });
        const search = sheet.getByRole('textbox', { name: 'Search …' });
        await expect(search).toBeFocused();
        await expect(sheet.getByRole('heading', { name: 'Frankfurt' })).toBeVisible();
        await expect(sheet.getByRole('radio', { name: 'db-01' })).toBeChecked();
        await search.fill('web');
        await expect(sheet.getByRole('radio')).toHaveText(['web-01', 'web-02']);
        await sheet.getByRole('radio', { name: 'web-02' }).click();
        await expect(sheet).toBeHidden();
        await expect(page.getByText('Value: web-02 (2)')).toBeVisible();
        await page.getByRole('button', { name: 'Clear selection' }).click();
        await expect(page.getByText('Value: –')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Server: Select' })).toBeVisible();
    });

    test('server data: labels of chosen values, the next page at the end of the list, the search asks the server', async ({
        page,
    }) => {
        await openStory(page, 'forms-select--server-data');
        // The label of the preselected value comes from getItemsByKeys
        const trigger = page.getByRole('button', { name: 'City: City 120' });
        await expect(trigger).toBeVisible();
        await trigger.click();
        const sheet = page.getByRole('dialog', { name: 'City' });
        await expect(sheet.getByRole('radio', { name: 'City 1', exact: true })).toBeVisible();
        await expect(sheet.getByRole('radio', { name: 'City 50', exact: true })).toBeAttached();
        // "Load more" (or the end of the list) loads the next 50
        await sheet.getByRole('button', { name: 'Load more' }).click();
        await expect(sheet.getByRole('radio', { name: 'City 100', exact: true })).toBeAttached();
        await sheet.getByRole('textbox', { name: 'Search …' }).fill('City 49');
        await expect(sheet.getByRole('radio')).toHaveText([
            'City 49',
            ...Array.from({ length: 10 }, (_, index) => `City ${490 + index}`),
        ]);
        await sheet.getByRole('radio', { name: 'City 495' }).click();
        await expect(page.getByText('Value: city-495')).toBeVisible();
    });
});

test.describe('PinInput', () => {
    test('typing moves on, Backspace on an empty box goes back, a pasted code fills all boxes', async ({ page }) => {
        await openStory(page, 'forms-pininput--playground');
        const group = page.getByRole('group', { name: 'Verification code' });
        const first = group.getByRole('textbox', { name: 'Digit 1 of 6' });
        await expect(first).toHaveAttribute('autocomplete', 'one-time-code');
        await first.focus();
        await page.keyboard.type('123');
        await expect(group.getByRole('textbox', { name: 'Digit 4 of 6' })).toBeFocused();
        await page.keyboard.press('Backspace');
        await expect(group.getByRole('textbox', { name: 'Digit 3 of 6' })).toBeFocused();
        await expect(group.getByRole('textbox', { name: 'Digit 3 of 6' })).toHaveValue('');
        await page.keyboard.type('x');
        // Letters are dropped in a numeric code
        await expect(group.getByRole('textbox', { name: 'Digit 3 of 6' })).toHaveValue('');
        await first.fill('987654');
        await expect(page.getByText('Code: 987654 (complete: 987654)')).toBeVisible();
        await expect(group.getByRole('textbox', { name: 'Digit 6 of 6' })).toHaveValue('4');
    });
});

test.describe('PasswordInput', () => {
    test('shows and hides the password; strength and checklist follow the typing', async ({ page }) => {
        await openStory(page, 'forms-passwordinput--playground');
        // Password fields have no role – found by their label
        const input = page.getByLabel('New password', { exact: true });
        await expect(input).toHaveAttribute('type', 'password');
        await page.getByRole('button', { name: 'Show password' }).first().click();
        await expect(input).not.toHaveAttribute('type', 'password');
        await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();
        await input.fill('short');
        await expect(page.getByRole('status').filter({ hasText: 'Password strength: Too short' })).toBeVisible();
        const list = page.getByRole('list', { name: 'Password requirements' });
        await expect(list.getByRole('listitem').first()).toHaveText('At least 12 characters, not met');
        await input.fill('Very-secure-password-2026');
        await expect(page.getByRole('status').filter({ hasText: 'Password strength: Strong' })).toBeVisible();
        await expect(list.getByRole('listitem')).toHaveText([
            'At least 12 characters, met',
            'One digit, met',
            'One special character, met',
        ]);
    });
});

test.describe('PhoneInput', () => {
    test('the country sheet searches by name, typing +41 switches the country; the value is E.164', async ({
        page,
    }) => {
        await openStory(page, 'forms-phoneinput--playground');
        await page.getByRole('button', { name: 'Country: Germany +49' }).click();
        const sheet = page.getByRole('dialog', { name: 'Country' });
        const search = sheet.getByRole('textbox', { name: 'Search country' });
        await expect(search).toBeFocused();
        await search.fill('austri');
        await expect(sheet.getByRole('radio')).toHaveText([/Austria/]);
        await sheet.getByRole('radio', { name: 'Austria +43' }).click();
        await expect(sheet).toBeHidden();
        await expect(page.getByText('E.164: +4330123456')).toBeVisible();
        const number = page.getByRole('textbox', { name: 'Phone' });
        await expect(number).toBeFocused();
        await number.fill('+41 44 668 18 00');
        await expect(page.getByRole('button', { name: 'Country: Switzerland +41' })).toBeVisible();
        await expect(number).toHaveValue('44 668 18 00');
        await expect(page.getByText('E.164: +41446681800 (valid)')).toBeVisible();
    });
});

test.describe('TanStack Form with error summary', () => {
    test('submitting lists the errors, focuses the summary; a message leads to its field', async ({ page }) => {
        await openStory(page, 'forms-tanstack-form--playground');
        await page.getByRole('button', { name: 'Send request' }).click();
        const summary = page.getByRole('alert').filter({ hasText: /Please correct/ });
        await expect(summary).toBeVisible();
        await expect(summary.getByRole('heading', { name: 'Please correct 4 entries' })).toBeFocused();
        await summary.getByRole('link', { name: 'Enter a valid email address' }).click();
        const email = page.getByRole('textbox', { name: 'Email' });
        await expect(email).toBeFocused();
        await expect(email).toHaveAttribute('aria-invalid', 'true');
        // Correcting removes the error from the summary while typing
        await page.getByRole('textbox', { name: 'Name' }).fill('Max Muster');
        await expect(summary.getByRole('heading')).toHaveText('Please correct 3 entries');
        await summary.getByRole('link', { name: 'Choose a service' }).click();
        await expect(page.getByRole('button', { name: 'Service: Select' })).toBeFocused();
    });
});

test.describe('DateRangePicker', () => {
    test('start, then end in the calendar sheet; the field shows the range', async ({ page }) => {
        await openStory(page, 'forms-daterangepicker--playground');
        await page.getByRole('button', { name: 'Vacation: 10/19/2026 – 10/23/2026' }).click();
        const sheet = page.getByRole('dialog', { name: 'Vacation' });
        const month = sheet.getByRole('radiogroup', { name: 'October 2026' });
        await expect(month.getByRole('radio', { name: 'Monday, October 19, 2026' })).toBeChecked();
        await expect(month.getByRole('radio', { name: 'Friday, October 23, 2026' })).toBeChecked();
        await month.getByRole('radio', { name: 'Friday, October 30, 2026' }).click();
        // The first tap is the start – the sheet stays open for the end
        await expect(sheet).toBeVisible();
        await expect(month.getByRole('radio', { name: 'Friday, October 30, 2026' })).toBeChecked();
        await expect(month.getByRole('radio', { name: 'Monday, October 19, 2026' })).not.toBeChecked();
        // An earlier end swaps the two
        await month.getByRole('radio', { name: 'Monday, October 26, 2026' }).click();
        await expect(sheet).toBeHidden();
        await expect(page.getByRole('button', { name: 'Vacation: 10/26/2026 – 10/30/2026' })).toBeVisible();
        await expect(page.getByText('Range: 2026-10-26 to 2026-10-30')).toBeVisible();
        await page.getByRole('button', { name: 'Clear range' }).click();
        await expect(page.getByText('Range: – to –')).toBeVisible();
    });
});

test.describe('TagsInput and Autocomplete', () => {
    test('TagsInput: suggestions while typing, the return key adds, the chips have remove buttons', async ({
        page,
    }) => {
        await openStory(page, 'forms-tagsinput--playground');
        const input = page.getByRole('combobox', { name: 'Skills' });
        await input.fill('Type');
        await page.getByRole('listbox', { name: 'Suggestions' }).getByRole('option', { name: 'TypeScript' }).click();
        await expect(page.getByText('Value: React, TypeScript')).toBeVisible();
        await input.fill('Go');
        await input.press('Enter');
        await expect(page.getByText('Value: React, TypeScript, Go')).toBeVisible();
        await page.getByRole('button', { name: 'Remove React' }).click();
        await expect(page.getByText('Value: TypeScript, Go')).toBeVisible();
    });

    test('Autocomplete: arrow keys highlight a suggestion, Enter takes it', async ({ page }) => {
        await openStory(page, 'forms-autocomplete--playground');
        const input = page.getByRole('combobox', { name: 'City', exact: true });
        await input.fill('d');
        const list = page.getByRole('listbox', { name: 'Suggestions' });
        await expect(list.getByRole('option')).toHaveText(['Dortmund', 'Dresden', 'Dusseldorf']);
        await input.press('ArrowDown');
        await input.press('ArrowDown');
        await expect(list.getByRole('option', { name: 'Dresden' })).toHaveAttribute('aria-selected', 'true');
        await input.press('Enter');
        await expect(input).toHaveValue('Dresden');
        await expect(list).toBeHidden();
    });
});

test.describe('Rating, CheckboxGroup and MonthPicker', () => {
    test('Rating is one adjustable control: arrow keys, Home/End, read as "4 stars"', async ({ page }) => {
        await openStory(page, 'forms-rating--playground');
        const rating = page.getByRole('slider', { name: 'Rating' });
        await expect(rating).toHaveAttribute('aria-valuetext', '3 stars');
        await rating.focus();
        await page.keyboard.press('ArrowRight');
        await expect(rating).toHaveAttribute('aria-valuetext', '4 stars');
        await page.keyboard.press('Home');
        await expect(page.getByText('Value: 0')).toBeVisible();
        await expect(page.getByRole('slider', { name: 'Read-only' })).toHaveAttribute('aria-readonly', 'true');
    });

    test('CheckboxGroup with max: the others are disabled once two are ticked', async ({ page }) => {
        await openStory(page, 'forms-checkboxgroup--playground');
        const group = page.getByRole('group', { name: 'Notifications' });
        await group.getByRole('checkbox', { name: 'SMS' }).click();
        await expect(group.getByRole('checkbox', { name: 'Push' })).toBeDisabled();
        await expect(page.getByText('Value: mail, sms')).toBeVisible();
        await group.getByRole('checkbox', { name: 'Email' }).click();
        await expect(group.getByRole('checkbox', { name: 'Push' })).toBeEnabled();
    });

    test('MonthPicker: the month grid of a year in a sheet; YearPicker range picks start and end', async ({ page }) => {
        await openStory(page, 'forms-monthpicker--playground');
        await page.getByRole('button', { name: 'Billing month: 10/2026' }).click();
        const sheet = page.getByRole('dialog', { name: 'Billing month' });
        await expect(sheet.getByRole('radio', { name: 'October 2026' })).toBeChecked();
        await sheet.getByRole('button', { name: 'Next year' }).click();
        await sheet.getByRole('radio', { name: 'March 2027' }).click();
        await expect(sheet).toBeHidden();
        await expect(page.getByRole('button', { name: 'Billing month: 03/2027' })).toBeVisible();
        await page.getByRole('button', { name: 'Years: 2024 – 2026' }).click();
        const years = page.getByRole('dialog', { name: 'Years' });
        await years.getByRole('radio', { name: '2021' }).click();
        await years.getByRole('radio', { name: '2019' }).click();
        await expect(page.getByText('2027-03 · 2026-Q4 · 2019–2021')).toBeVisible();
    });
});

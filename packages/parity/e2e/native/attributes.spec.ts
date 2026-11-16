import { expect, test } from '@playwright/test';

// The view props of a React Native component (testID, nativeID, accessibility props) land on its outermost view –
// react-native-web writes testID as data-testid. The story args come from the URL, as Storybook allows.

const stories: [string, string][] = [
    ['Sortable', 'data-sortable--playground'],
    ['OrderList', 'data-orderlist--playground'],
    ['PickList', 'data-picklist--playground'],
    ['DataView', 'data-dataview--playground'],
    ['MeterGroup', 'data-metergroup--playground'],
    ['OrgChart', 'data-orgchart--playground'],
];

for (const [name, id] of stories) {
    test(`${name} passes testID to its outermost view`, async ({ page }) => {
        await page.goto(`/iframe.html?id=${id}&viewMode=story&args=testID:tour-target`);
        const root = page.getByTestId('tour-target');
        await expect(root).toHaveCount(1);
        // Outermost: the story starts with all of the component (from its label on) – some demos add a line after it
        const text = await root.innerText();
        expect(text).not.toBe('');
        expect((await page.locator('#storybook-root').innerText()).startsWith(text)).toBe(true);
    });
}

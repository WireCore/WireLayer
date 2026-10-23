import { expect, test } from '@playwright/test';
import { nextFrame, openStory } from './story.ts';

test.describe('Tree', () => {
    test('arrow keys move and open/close, Enter selects', async ({ page }) => {
        await openStory(page, 'data-tree--playground');
        const tree = page.getByRole('tree', { name: 'Files' });
        await tree.getByText('Quote.pdf').click();
        await expect(page.getByText('Selected: quote')).toBeVisible();
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowLeft');
        await expect(tree.getByText('Quote.pdf')).toBeHidden();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await expect(tree.getByText('Logo.svg')).toBeVisible();
        await page.keyboard.press('Enter');
        await expect(page.getByText('Selected: logo')).toBeVisible();
    });

    test('checkable: Space checks the focused node, the parent becomes mixed', async ({ page }) => {
        await openStory(page, 'data-tree--checkable');
        const tree = page.getByRole('tree', { name: 'Files' });
        await expect(tree.getByRole('treeitem', { name: 'Quote.pdf' })).toHaveAttribute('aria-checked', 'true');
        await expect(tree.getByRole('treeitem', { name: /^Documents/ })).toHaveAttribute('aria-checked', 'mixed');
        await tree.getByRole('treeitem', { name: 'Contract.pdf' }).focus();
        await page.keyboard.press(' ');
        await expect(tree.getByRole('treeitem', { name: 'Contract.pdf' })).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByText('Checked: quote, contract')).toBeVisible();
    });
});

test.describe('TreeSelect', () => {
    test('opens the tree at the chosen node, choosing closes and returns focus', async ({ page }) => {
        await openStory(page, 'forms-treeselect--playground');
        const trigger = page.getByRole('button', { name: 'Department Operations' });
        await trigger.click();
        const tree = page.getByRole('tree', { name: 'Select' });
        await expect(tree.getByText('Operations')).toBeVisible();
        await tree.getByText('IT security').click();
        await expect(tree).toBeHidden();
        await expect(page.getByText('Value: security')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Department IT security' })).toBeFocused();
    });

    test('leavesOnly: a branch only opens and closes', async ({ page }) => {
        await openStory(page, 'forms-treeselect--leaves-only');
        await page.getByRole('button', { name: 'Department Operations' }).click();
        const tree = page.getByRole('tree', { name: 'Select' });
        await tree.getByText('Sales', { exact: true }).click();
        await expect(tree.getByText('Field sales')).toBeVisible();
        await expect(page.getByText('Value: operations')).toBeVisible();
    });
});

test.describe('CascadeSelect', () => {
    // A level without room beside its parent flips to the left and used to cover the level before
    test('three open levels sit side by side and do not cover each other', async ({ page }) => {
        await page.setViewportSize({ width: 900, height: 600 });
        await openStory(page, 'forms-cascadeselect--playground');
        const trigger = page.getByRole('button', { name: 'Location Select' });
        await trigger.focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('menuitem', { name: 'Germany' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('menuitem', { name: 'Bavaria' })).toHaveAttribute('data-highlighted', '');
        // With animations Ark highlights before the focus has moved into the submenu
        await expect(page.locator('[role=menu]:focus')).toContainText('Bavaria');
        await page.keyboard.press('ArrowDown');
        // Arrow right opens the submenu of the item highlighted at that moment
        await expect(page.getByRole('menuitem', { name: 'Hesse' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('menuitemradio', { name: 'Frankfurt' })).toHaveAttribute('data-highlighted', '');
        const boxes = await page.locator('[role=menu]').evaluateAll((menus) =>
            menus
                .map((menu) => menu.getBoundingClientRect())
                .filter((box) => box.width > 0)
                .map(({ left, right }) => ({ left, right }))
                .sort((a, b) => a.left - b.left)
        );
        expect(boxes).toHaveLength(3);
        // Next to each other with a small gap – not even the borders overlap
        for (const [index, box] of boxes.entries())
            if (index > 0) expect(box.left).toBeGreaterThanOrEqual(boxes[index - 1]!.right);
    });

    test('levels open to the side with the arrow keys, the trigger shows the path', async ({ page }) => {
        await openStory(page, 'forms-cascadeselect--playground');
        const trigger = page.getByRole('button', { name: 'Location Select' });
        await trigger.focus();
        await page.keyboard.press('Enter');
        // The menu keeps focus and points at the highlighted item (aria-activedescendant)
        await expect(page.getByRole('menuitem', { name: 'Germany' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('menuitem', { name: 'Bavaria' })).toHaveAttribute('data-highlighted', '');
        await expect(page.locator('[role=menu]:focus')).toContainText('Bavaria');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('menuitemradio', { name: 'Frankfurt' })).toHaveAttribute('data-highlighted', '');
        await expect(page.locator('[role=menu]:focus')).toContainText('Frankfurt');
        await page.keyboard.press('Enter');
        await expect(page.getByRole('menu')).toHaveCount(0);
        await expect(page.getByText('Value: fra')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Location Germany › Hesse › Frankfurt' })).toBeVisible();
    });
});

test.describe('DataTable tree', () => {
    test('child rows open and close with the button in the first cell', async ({ page }) => {
        await openStory(page, 'data-datatable--tree');
        const toggle = page.getByRole('button', { name: 'Rows below Projects' });
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByRole('row', { name: /WireLayer/ })).toBeVisible();
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByRole('row', { name: /WireLayer/ })).toHaveCount(0);
        await toggle.click();
        await page.getByRole('button', { name: 'Rows below Customers' }).click();
        await expect(page.getByRole('row', { name: /Quote\.pdf/ })).toBeVisible();
    });
});

test.describe('Tree reorderable', () => {
    test('Alt+arrow keys move the focused node, the focus stays on it', async ({ page }) => {
        await openStory(page, 'data-tree--reorderable');
        const notes = page.getByRole('treeitem', { name: 'Notes.txt' });
        await notes.focus();
        await page.keyboard.press('Alt+ArrowUp');
        await expect(page.getByRole('status')).toHaveText('Notes.txt moved, position 2 of 3');
        await expect(page.getByRole('treeitem', { name: 'Notes.txt' })).toBeFocused();
        await page.keyboard.press('Alt+ArrowRight');
        await expect(page.getByRole('status')).toHaveText('Notes.txt moved to Documents, position 4 of 4');
    });

    test('drag and drop into a branch', async ({ page }) => {
        await openStory(page, 'data-tree--reorderable');
        const logo = page.getByRole('treeitem', { name: 'Logo.svg' });
        const archive = page.getByRole('treeitem', { name: 'Archive' }).locator('[data-part="branch-control"]');
        await logo.dragTo(archive);
        await expect(page.getByRole('status')).toHaveText('Logo.svg moved to Archive, position 2 of 2');
    });
});

test.describe('Tree reorderable with loaded children', () => {
    test('loaded files move with Alt+arrow keys; a closed folder loads before it takes a node', async ({ page }) => {
        await openStory(page, 'data-tree--reorder-lazy');
        const tree = page.getByRole('tree', { name: 'Files' });
        const projects = tree.locator('[data-node-id="projects"]');
        await projects.locator(':scope > [data-part="branch-control"]').focus();
        await page.keyboard.press('ArrowRight');
        const second = tree.getByRole('treeitem', { name: 'Projects file 2.pdf' });
        await expect(second).toBeVisible();
        await second.focus();
        await page.keyboard.press('Alt+ArrowUp');
        await expect(page.getByRole('status')).toHaveText(/position 1 of 3/);
        await expect(projects.getByRole('treeitem').first()).toHaveAccessibleName('Projects file 2.pdf');
        await expect(tree.getByRole('treeitem', { name: 'Projects file 2.pdf' })).toBeFocused();
        // Templates is closed and not loaded: the drop waits for its files
        const templates = tree.locator('[data-node-id="templates"]').locator(':scope > [data-part="branch-control"]');
        await tree.getByRole('treeitem', { name: 'Projects file 1.pdf' }).dragTo(templates);
        await expect(projects.getByRole('treeitem', { name: 'Projects file 1.pdf' })).toBeVisible();
        await expect(page.getByRole('status')).toHaveText('Templates: 3 items loaded');
        await tree.getByRole('treeitem', { name: 'Projects file 1.pdf' }).dragTo(templates);
        await expect(page.getByRole('status')).toHaveText(/moved to Templates/);
        await expect(projects.getByRole('treeitem')).toHaveCount(2);
    });
});

test.describe('Tree lazy children', () => {
    test('arrow keys open a lazy folder, the children load; a failed folder offers "Try again"', async ({ page }) => {
        await openStory(page, 'data-tree--lazy-children');
        const tree = page.getByRole('tree', { name: 'Files' });
        const projects = tree.locator('[data-node-id="projects"]');
        await projects.locator(':scope > [data-part="branch-control"]').focus();
        await page.keyboard.press('ArrowRight');
        await expect(projects).toHaveAttribute('aria-busy', 'true');
        await expect(page.getByRole('status')).toHaveText('Projects: Loading');
        await expect(tree.getByRole('treeitem', { name: 'Projects file 1.pdf' })).toBeVisible();
        await expect(projects).not.toHaveAttribute('aria-busy');
        await expect(page.getByRole('status')).toHaveText('Projects: 3 items loaded');
        await page.keyboard.press('ArrowDown');
        await expect(tree.getByRole('treeitem', { name: 'Projects file 1.pdf' })).toBeFocused();

        const archive = tree.locator('[data-node-id="archive"]');
        await archive.locator(':scope > [data-part="branch-control"]').focus();
        await page.keyboard.press('ArrowRight');
        const retry = tree.getByRole('treeitem', { name: 'Loading failed – try again' });
        await expect(retry).toBeVisible();
        await expect(page.getByRole('status')).toHaveText('Archive could not be loaded');
        await page.keyboard.press('ArrowDown');
        await expect(retry).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(tree.getByRole('treeitem', { name: 'Archive file 1.pdf' })).toBeVisible();
        // The focus went back to the folder while its children loaded again
        await expect(archive.locator(':scope > [data-part="branch-control"]')).toBeFocused();
    });
});

test.describe('Tree search', () => {
    test('typing keeps the hits with their folders; highlight mode jumps with Enter', async ({ page }) => {
        await openStory(page, 'data-tree--search');
        const tree = page.getByRole('tree', { name: 'Files' });
        await page.getByRole('searchbox', { name: 'Search the tree' }).fill('report');
        await expect(page.getByRole('status')).toHaveText('1 match');
        await expect(tree.getByRole('treeitem')).toHaveCount(3);
        await expect(tree.getByRole('treeitem', { name: 'Report 2025.pdf' }).locator('mark')).toHaveText('Report');

        await openStory(page, 'data-tree--search-highlight');
        const search = page.getByRole('searchbox', { name: 'Search the tree' });
        await search.focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('treeitem', { name: 'Quote.pdf' })).toBeFocused();
    });
});

test.describe('Tree between trees', () => {
    test('Ctrl+X in one tree, Ctrl+V on a folder of the other moves the node', async ({ page }) => {
        await openStory(page, 'data-tree--between-trees');
        const own = page.getByRole('tree', { name: 'My files' });
        const team = page.getByRole('tree', { name: 'Team storage' });
        await own.getByRole('treeitem', { name: 'Notes.txt' }).focus();
        await page.keyboard.press('Control+x');
        await expect(own.getByRole('treeitem', { name: 'Notes.txt' })).toHaveAttribute('data-cut');
        await team
            .getByRole('treeitem', { name: /^Storage/ })
            .locator('[data-part="branch-control"]')
            .focus();
        await page.keyboard.press('Control+v');
        await expect(team.getByRole('treeitem', { name: 'Notes.txt' })).toBeFocused();
        await expect(own.getByRole('treeitem', { name: 'Notes.txt' })).toHaveCount(0);
    });

    test('drag and drop into a folder of the other tree', async ({ page }) => {
        await openStory(page, 'data-tree--between-trees');
        const own = page.getByRole('tree', { name: 'My files' });
        const team = page.getByRole('tree', { name: 'Team storage' });
        await own
            .getByRole('treeitem', { name: 'Quote.pdf' })
            .dragTo(team.getByRole('treeitem', { name: /^Storage/ }).locator('[data-part="branch-control"]'));
        await expect(team.getByRole('treeitem', { name: 'Quote.pdf' })).toBeVisible();
    });
});

test.describe('VirtualTree', () => {
    test('a flat list of treeitems: End scrolls to the last node, positions are announced', async ({ page }) => {
        await openStory(page, 'data-virtualtree--playground');
        const tree = page.getByRole('tree', { name: 'Storage' });
        const first = tree.getByRole('treeitem', { name: /^Folder 1$/ });
        await expect(first).toHaveAttribute('aria-level', '1');
        await expect(first).toHaveAttribute('aria-setsize', '200');
        await expect(tree.getByRole('treeitem', { name: 'File 1.1.pdf' })).toHaveAttribute('aria-level', '2');
        // Far fewer rows in the DOM than nodes
        expect(await tree.getByRole('treeitem').count()).toBeLessThan(60);
        await first.locator('[data-part="branch-control"]').focus();
        await page.keyboard.press('End');
        const last = tree.getByRole('treeitem', { name: /^Folder 200$/ });
        await expect(last.locator('[data-part="branch-control"]')).toBeFocused();
        await expect(last).toHaveAttribute('aria-posinset', '200');
        await page.keyboard.press('Home');
        await expect(first.locator('[data-part="branch-control"]')).toBeFocused();
    });
});

test.describe('TreeSelect multiple', () => {
    test('Space checks departments, the chips show them, Backspace removes the last', async ({ page }) => {
        await openStory(page, 'forms-treeselect--multiple');
        await expect(page.getByText('Value: engineering, sales')).toBeVisible();
        await page.getByRole('button', { name: /Departments/ }).click();
        const tree = page.getByRole('tree');
        await tree.getByRole('treeitem', { name: 'Administration' }).focus();
        await page.keyboard.press(' ');
        await expect(page.getByText('Value: engineering, sales, administration')).toBeVisible();
        await expect(page.getByText('+1')).toBeVisible();
        await page.keyboard.press('Escape');
        await page.keyboard.press('Backspace');
        await expect(page.getByText('Value: engineering, sales')).toBeVisible();
    });
});

test.describe('CascadeSelect search', () => {
    test('typing lists the hits with their path, Enter takes one', async ({ page }) => {
        await openStory(page, 'forms-cascadeselect--search');
        const input = page.getByRole('combobox', { name: 'Location' });
        await input.fill('frank');
        await expect(page.getByRole('option', { name: 'Germany › Hesse › Frankfurt' })).toBeVisible();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Value: fra')).toBeVisible();
        await expect(input).toHaveValue('Germany › Hesse › Frankfurt');
    });

    test('changeOnSelect: a level is chosen by its first entry', async ({ page }) => {
        await openStory(page, 'forms-cascadeselect--change-on-select');
        await page.getByRole('button', { name: /Location/ }).focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('menuitem', { name: 'Germany' })).toHaveAttribute('data-highlighted', '');
        await nextFrame(page);
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('menuitemradio', { name: 'Choose Germany' })).toHaveAttribute(
            'data-highlighted',
            ''
        );
        await nextFrame(page);
        await page.keyboard.press('Enter');
        await expect(page.getByText('Value: de')).toBeVisible();
    });
});

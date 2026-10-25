// Type test, checked by tsc in `pnpm typecheck` (not part of the package): collection props take read-only arrays,
// e.g. data from an API client that hands out `readonly T[]`
import { BarChart } from '../src/chart/BarChart.js';
import { Breadcrumb } from '../src/components/Breadcrumb/Breadcrumb.js';
import { Button } from '../src/components/Button/Button.js';
import { Menu, type MenuEntry } from '../src/components/Menu/Menu.js';
import { Menubar } from '../src/components/Menubar/Menubar.js';
import { Select } from '../src/components/Select/Select.js';
import { Steps } from '../src/components/Steps/Steps.js';
import { Tree } from '../src/components/Tree/Tree.js';
import type { TreeNode } from '../src/components/Tree/types.js';
import { DataTable } from '../src/data-table/DataTable.js';
import type { DataTableColumn } from '../src/data-table/types.js';

interface User {
    id: string;
    name: string;
}
const users: readonly User[] = [{ id: '1', name: 'Ada' }];
const columns: readonly DataTableColumn<User>[] = [{ id: 'name', header: 'Name' }];
const entries: readonly MenuEntry[] = [{ value: 'edit', label: 'Edit' }];
const nodes: readonly TreeNode[] = [{ id: 'root', label: 'Root' }];
const steps = [{ label: 'Account' }, { label: 'Done' }] as const;
const rows = [{ month: 'Jan', sales: 4 }] as const;
const series = [{ key: 'sales', label: 'Sales' }] as const;
const crumbs = [{ label: 'Home', href: '/' }] as const;
const options = [{ value: 'web', label: 'Web' }] as const;

export const ReadonlyCollections = () => (
    <>
        <DataTable data={users} columns={columns} caption="Users" />
        <Menu items={entries}>
            <Button>Actions</Button>
        </Menu>
        <Menubar menus={[{ label: 'File', items: entries }]} />
        <Tree items={nodes} aria-label="Files" />
        <Steps items={steps} current={0} />
        <BarChart data={rows} categoryKey="month" series={series} title="Sales" />
        <Breadcrumb items={crumbs} />
        <Select items={options} aria-label="Service" />
    </>
);

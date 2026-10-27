// Fixture of the Vite plugin test (src/vite-plugin.test.ts): an app that uses a few components
import { Button, Card as Panel, type ButtonProps } from '@wirecore/wirelayer-react';
import { DataTable } from '@wirecore/wirelayer-react/data-table';

export function App(props: ButtonProps) {
    return (
        <Panel>
            <Button {...props}>Save</Button>
            <DataTable data={[]} columns={[]} caption="Empty" />
        </Panel>
    );
}

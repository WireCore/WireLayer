import { Card, ProgressCircle } from '@wirecore/wirelayer-react';
import { serverTexts } from './locale';
import { ServerTable } from './server-table';

// A server component: WireLayer components render here directly (only plain props, no functions)
export default async function Overview() {
    const t = await serverTexts();
    return (
        <div className="flex flex-col gap-6 p-6">
            <h1 className="text-2xl font-semibold">{t.overview}</h1>
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="items-center">
                    <ProgressCircle value={99} label={t.availability} status="success" />
                </Card>
                <Card className="items-center">
                    <ProgressCircle value={72} label={t.storage} />
                </Card>
                <Card className="items-center">
                    <ProgressCircle value={30} label={t.tickets} status="warn" />
                </Card>
            </div>
            <ServerTable />
        </div>
    );
}

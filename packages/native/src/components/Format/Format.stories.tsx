import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { DataList, DataListItem } from '../DataList/DataList.js';
import { FormatBytes, FormatDate, FormatDateTime, FormatList, FormatRelativeTime } from './Format.js';

const now = new Date('2026-10-21T14:30:00');

const meta = {
    title: 'Data/Format',
    component: FormatDate,
    args: { value: now },
    render: () => (
        <View className="w-[340px]">
            <DataList orientation="horizontal" divided>
                <DataListItem label="Date">
                    <FormatDate value={now} />
                </DataListItem>
                <DataListItem label="Date and time">
                    <FormatDateTime value={now} timeZone="Europe/Berlin" />
                </DataListItem>
                <DataListItem label="Relative">
                    <FormatRelativeTime value={new Date(now.getTime() - 5 * 60_000)} now={now} />
                </DataListItem>
                <DataListItem label="Size">
                    <FormatBytes value={1_572_864} />
                </DataListItem>
                <DataListItem label="Locations">
                    <FormatList items={['Frankfurt', 'Nuremberg', 'Vienna']} />
                </DataListItem>
            </DataList>
        </View>
    ),
} satisfies Meta<typeof FormatDate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Stepper, type StepperItem } from './Stepper.js';

const items: StepperItem[] = [
    { label: 'Contact', description: 'Who are you?' },
    { label: 'Project', description: 'What are you planning?' },
    { label: 'Review', description: 'Is everything correct?' },
];

function Demo({ items, linear }: { items: StepperItem[]; linear?: boolean }) {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [project, setProject] = useState('');
    return (
        <div className="flex max-w-xl flex-col gap-3">
            <Stepper
                items={items}
                linear={linear}
                step={step}
                onStepChange={setStep}
                isStepValid={(index) => index !== 0 || name.trim() !== ''}
                completed={<p className="text-sm">Thanks, we will get back to you.</p>}
            >
                {(index) =>
                    index === 0 ? (
                        <Field label="Name" required helperText="Required – you can only continue once it is filled in">
                            <Input value={name} onChange={(event) => setName(event.target.value)} />
                        </Field>
                    ) : index === 1 ? (
                        <Field label="Project">
                            <Input value={project} onChange={(event) => setProject(event.target.value)} />
                        </Field>
                    ) : (
                        <p className="text-sm">
                            {name} is planning: {project || '–'}
                        </p>
                    )
                }
            </Stepper>
            <span className="text-xs text-muted">Step: {step + 1}</span>
        </div>
    );
}

const meta = {
    title: 'Navigation/Stepper',
    component: Stepper,
    args: { items, linear: true, children: () => null },
    argTypes: { items: { control: false }, children: { control: false } },
    render: (args) => <Demo items={args.items} linear={args.linear} />,
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Steps beside the content, labels below the numbers; the second step is still saving */
export const Vertical: Story = {
    render: () => (
        <Stepper
            items={[
                { label: 'Contact', description: 'Who are you?' },
                { label: 'Project', description: 'Saving …', loading: true },
                { label: 'Review' },
            ]}
            defaultStep={1}
            orientation="vertical"
            className="max-w-xl"
        >
            {(index) => <p className="text-sm">Content of step {index + 1}</p>}
        </Stepper>
    ),
};

export const LabelBelow: Story = {
    render: () => (
        <Stepper items={items} defaultStep={1} labelPlacement="bottom" className="max-w-xl">
            {(index) => <p className="text-sm">Content of step {index + 1}</p>}
        </Stepper>
    ),
};

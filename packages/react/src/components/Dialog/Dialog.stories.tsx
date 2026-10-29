import type { Meta, StoryObj } from '@storybook/react-vite';
import { Trash2 } from 'lucide-react';
import { focusFirst } from '@wirecore/wirelayer-recipes';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Button } from '../Button/Button.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from './Dialog.js';

const meta = {
    title: 'Overlays/Dialog',
    component: Dialog,
    args: { role: 'alertdialog', children: null },
    argTypes: { role: { control: 'inline-radio', options: ['dialog', 'alertdialog'] }, children: { control: false } },
    render: (args) => (
        <Dialog role={args.role}>
            <DialogTrigger>
                <Button variant="danger" leadingIcon={Trash2}>
                    Delete server
                </Button>
            </DialogTrigger>
            <DialogContent
                title="Delete server?"
                description="web-01 and all snapshots will be permanently removed. This cannot be undone."
                icon={Trash2}
                status="danger"
                footer={
                    <>
                        <DialogClose>
                            <Button variant="outline" size="sm">
                                Cancel
                            </Button>
                        </DialogClose>
                        <DialogClose>
                            <Button variant="danger" size="sm">
                                Delete
                            </Button>
                        </DialogClose>
                    </>
                }
            />
        </Dialog>
    ),
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Maximum width per `size`; on small screens every dialog takes the full width (`responsive`).
 *
 * | size | Width |
 * | --- | --- |
 * | sm | 320px (20rem) |
 * | md | 400px (25rem) – default |
 * | lg | 560px (35rem) |
 * | xl | 800px (50rem) |
 * | full | screen width minus the margin |
 *
 * Another width: leave out `size` and set the CSS variable `--wc-dialog-w` (see "Own width")
 */
export const Sizes: Story = {
    render: () => (
        <div className="flex flex-wrap justify-center gap-2">
            {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((size) => (
                <Dialog key={size}>
                    <DialogTrigger>
                        <Button variant="outline">{size}</Button>
                    </DialogTrigger>
                    <DialogContent
                        title={`Size ${size}`}
                        description="The width adapts to the content."
                        size={size}
                        footer={
                            <DialogClose>
                                <Button size="sm">OK</Button>
                            </DialogClose>
                        }
                    />
                </Dialog>
            ))}
        </div>
    ),
};

/** `hideTitle`: the title names the dialog for screen readers but is not shown – e.g. around a video or an image */
export const HiddenTitle: Story = {
    name: 'Hidden title',
    render: () => (
        <Dialog>
            <DialogTrigger>
                <Button variant="outline">Watch the intro</Button>
            </DialogTrigger>
            <DialogContent title="Intro video" hideTitle size="lg">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-bg-2 text-muted">Video</div>
            </DialogContent>
        </Dialog>
    ),
};

/** Own width: without `size`, the CSS variable `--wc-dialog-w` sets the maximum width – no Tailwind class needed */
export const OwnWidth: Story = {
    name: 'Own width',
    render: () => (
        <Dialog>
            <DialogTrigger>
                <Button variant="outline">36rem</Button>
            </DialogTrigger>
            <DialogContent
                title="Edit booking"
                description="36rem wide – between md and xl."
                style={{ '--wc-dialog-w': '36rem' } as CSSProperties}
                footer={
                    <DialogClose>
                        <Button size="sm">OK</Button>
                    </DialogClose>
                }
            />
        </Dialog>
    ),
};

/** Top, bottom, start or end of the screen instead of the center */
export const Positions: Story = {
    render: () => (
        <div className="flex flex-wrap justify-center gap-2">
            {(['top', 'bottom', 'start', 'end'] as const).map((position) => (
                <Dialog key={position}>
                    <DialogTrigger>
                        <Button variant="outline">{position}</Button>
                    </DialogTrigger>
                    <DialogContent title={`Position ${position}`} position={position} />
                </Dialog>
            ))}
        </div>
    ),
};

function NonModalDemo() {
    const [count, setCount] = useState(0);
    return (
        <div className="flex flex-col items-center gap-3">
            <Dialog modal={false}>
                <DialogTrigger>
                    <Button>Open notes</Button>
                </DialogTrigger>
                <DialogContent
                    title="Notes"
                    description="Stays open while you keep working on the page."
                    position="end"
                    draggable
                    maximizable
                >
                    <p className="text-sm">Customer asks for a callback on Thursday.</p>
                </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => setCount(count + 1)}>
                Click on the page ({count})
            </Button>
        </div>
    );
}

/**
 * Non-modal: no backdrop, no focus trap – the page stays usable. Draggable at the header (keyboard: Alt + arrow
 * keys, with Shift in larger steps) and maximizable.
 */
export const NonModal: Story = { render: () => <NonModalDemo /> };

/** A dialog opens another one on top (own backdrop); closing it returns the focus to the first one */
export const Stacked: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger>
                <Button>Settings</Button>
            </DialogTrigger>
            <DialogContent title="Settings" description="Changes apply to all servers.">
                <Dialog role="alertdialog">
                    <DialogTrigger>
                        <Button variant="danger" size="sm">
                            Reset …
                        </Button>
                    </DialogTrigger>
                    <DialogContent
                        title="Really reset?"
                        status="danger"
                        size="sm"
                        footer={
                            <>
                                <DialogClose>
                                    <Button variant="outline" size="sm">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <DialogClose>
                                    <Button variant="danger" size="sm">
                                        Reset
                                    </Button>
                                </DialogClose>
                            </>
                        }
                    />
                </Dialog>
            </DialogContent>
        </Dialog>
    ),
};

/** Long content: only the body scrolls, header and footer stay in place */
export const ScrollInside: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger>
                <Button>Read terms</Button>
            </DialogTrigger>
            <DialogContent
                title="Terms of use"
                size="lg"
                scrollBehavior="inside"
                footer={
                    <>
                        <DialogClose>
                            <Button variant="outline" size="sm">
                                Decline
                            </Button>
                        </DialogClose>
                        <DialogClose>
                            <Button size="sm">Agree</Button>
                        </DialogClose>
                    </>
                }
            >
                {Array.from({ length: 20 }, (_, index) => (
                    <p key={index} className="text-sm">
                        § {index + 1} – Services are provided according to the current state of the art.
                    </p>
                ))}
            </DialogContent>
        </Dialog>
    ),
};

/**
 * The field to start in: mark it with `data-autofocus`. The dialog moves the focus inside once it opened – after the
 * content's effects, so a `focus()` there (or React's `autoFocus`) is overridden. Without a mark the first focusable
 * element gets the focus; an `alertdialog` starts on its close button.
 */
export const InitialFocus: Story = {
    name: 'Initial focus',
    render: () => (
        <Dialog>
            <DialogTrigger>
                <Button variant="outline">Rename connection</Button>
            </DialogTrigger>
            <DialogContent
                title="Rename connection"
                size="sm"
                footer={
                    <>
                        <DialogClose>
                            <Button variant="outline" size="sm">
                                Cancel
                            </Button>
                        </DialogClose>
                        <DialogClose>
                            <Button size="sm">Save</Button>
                        </DialogClose>
                    </>
                }
            >
                <Field label="Name">
                    <Input defaultValue="web-01 (production)" data-autofocus />
                </Field>
            </DialogContent>
        </Dialog>
    ),
};

/** `data-autoselect`: the field gets the focus with its text selected – typing replaces the prefilled name */
export const SelectedOnOpen: Story = {
    name: 'Selected on open',
    render: () => (
        <Dialog>
            <DialogTrigger>
                <Button variant="outline">Duplicate connection</Button>
            </DialogTrigger>
            <DialogContent
                title="Duplicate connection"
                size="sm"
                footer={
                    <>
                        <DialogClose>
                            <Button variant="outline" size="sm">
                                Cancel
                            </Button>
                        </DialogClose>
                        <DialogClose>
                            <Button size="sm">Duplicate</Button>
                        </DialogClose>
                    </>
                }
            >
                <Field label="Name">
                    <Input defaultValue="web-01 (copy)" data-autoselect />
                </Field>
            </DialogContent>
        </Dialog>
    ),
};

function OwnStepsDemo() {
    const [step, setStep] = useState(1);
    const content = useRef<HTMLDivElement>(null);
    // The new step gets the focus the way opening does
    useEffect(() => {
        if (step === 2) focusFirst(content.current);
    }, [step]);
    return (
        <Dialog onOpenChange={(open) => open || setStep(1)}>
            <DialogTrigger>
                <Button variant="outline">New connection</Button>
            </DialogTrigger>
            <DialogContent
                ref={content}
                title="New connection"
                description={`Step ${step} of 2`}
                size="sm"
                footer={
                    <>
                        <DialogClose>
                            <Button variant="outline" size="sm">
                                Cancel
                            </Button>
                        </DialogClose>
                        {step === 1 ? (
                            <Button size="sm" onClick={() => setStep(2)}>
                                Next
                            </Button>
                        ) : (
                            <DialogClose>
                                <Button size="sm">Create</Button>
                            </DialogClose>
                        )}
                    </>
                }
            >
                {step === 1 ? (
                    <Field label="Host">
                        <Input mono data-autofocus />
                    </Field>
                ) : (
                    <Field label="User">
                        <Input defaultValue="root" data-autoselect />
                    </Field>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * Own steps in one dialog: `focusFirst(element)` on the content focuses the new step the way opening does
 * (data-autoselect, data-autofocus, otherwise the first field)
 */
export const OwnSteps: Story = { name: 'Own steps', render: () => <OwnStepsDemo /> };

/** `titlePosition="header"`: the title in the row of the close button, after a smaller icon (as on the Drawer) */
export const TitleInTheHeader: Story = {
    name: 'Title in the header',
    render: () => (
        <div className="flex flex-wrap justify-center gap-2">
            <Dialog>
                <DialogTrigger>
                    <Button variant="outline">Edit connection</Button>
                </DialogTrigger>
                <DialogContent
                    title="Edit connection"
                    description="web-01 · production"
                    titlePosition="header"
                    maximizable
                    footer={
                        <>
                            <DialogClose>
                                <Button variant="outline" size="sm">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <DialogClose>
                                <Button size="sm">Save</Button>
                            </DialogClose>
                        </>
                    }
                >
                    <Field label="Host">
                        <Input defaultValue="10.0.4.12" mono data-autofocus />
                    </Field>
                </DialogContent>
            </Dialog>
            <Dialog role="alertdialog">
                <DialogTrigger>
                    <Button variant="outline">With icon</Button>
                </DialogTrigger>
                <DialogContent
                    title="Delete server?"
                    description="This cannot be undone."
                    icon={Trash2}
                    status="danger"
                    titlePosition="header"
                    footer={
                        <>
                            <DialogClose>
                                <Button variant="outline" size="sm">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <DialogClose>
                                <Button variant="danger" size="sm">
                                    Delete
                                </Button>
                            </DialogClose>
                        </>
                    }
                />
            </Dialog>
        </div>
    ),
};

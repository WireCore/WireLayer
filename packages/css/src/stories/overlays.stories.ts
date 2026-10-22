import type { Meta, StoryObj } from '@storybook/html-vite';
import { html, icons } from './icons.ts';

export default { title: 'Overlays/Dialog' } satisfies Meta;
type Story = StoryObj;

/**
 * Native <dialog> with invoker commands (command / commandfor): opens and closes without JavaScript,
 * the browser keeps focus inside and Escape closes it. <dialog class="wc-dialog"> wraps the content.
 */
export const NativeDialog: Story = {
    render: () =>
        html` <button type="button" class="wc-button wc-button-danger" command="show-modal" commandfor="delete-dialog">
                ${icons.trash('wc-button-icon')} Delete server
            </button>
            <dialog
                id="delete-dialog"
                class="wc-dialog"
                role="alertdialog"
                aria-labelledby="delete-title"
                aria-describedby="delete-text"
            >
                <div class="wc-dialog-content">
                    <div class="wc-dialog-header">
                        <span class="wc-dialog-icon-box wc-dialog-danger">${icons.trash('wc-dialog-icon')}</span>
                        <button
                            type="button"
                            class="wc-dialog-close"
                            command="close"
                            commandfor="delete-dialog"
                            aria-label="Close"
                        >
                            ${icons.x('wc-dialog-close-icon')}
                        </button>
                    </div>
                    <div class="wc-dialog-body">
                        <h2 class="wc-dialog-title" id="delete-title">Delete server?</h2>
                        <p class="wc-dialog-description" id="delete-text">
                            web-01 and all backups will be permanently removed.
                        </p>
                    </div>
                    <div class="wc-dialog-footer">
                        <button
                            type="button"
                            class="wc-button wc-button-outline wc-button-sm"
                            command="close"
                            commandfor="delete-dialog"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            class="wc-button wc-button-danger wc-button-sm"
                            command="close"
                            commandfor="delete-dialog"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </dialog>`,
};

const sizedDialog = (id: string, modifiers: string, title: string, text: string) =>
    html`<button type="button" class="wc-button wc-button-outline" command="show-modal" commandfor="${id}">
            ${title}
        </button>
        <dialog id="${id}" class="wc-dialog ${modifiers}" aria-labelledby="${id}-title">
            <div class="wc-dialog-content">
                <div class="wc-dialog-header">
                    <button type="button" class="wc-dialog-close" command="close" commandfor="${id}" aria-label="Close">
                        ${icons.x('wc-dialog-close-icon')}
                    </button>
                </div>
                <div class="wc-dialog-body">
                    <h2 class="wc-dialog-title" id="${id}-title">${title}</h2>
                    <p class="wc-dialog-description">${text}</p>
                </div>
                <div class="wc-dialog-footer">
                    <button type="button" class="wc-button wc-button-sm" command="close" commandfor="${id}">OK</button>
                </div>
            </div>
        </dialog>`;

/**
 * Sizes, positions and full screen as modifiers on the <dialog>: wc-dialog-sm / -lg / -xl / -full,
 * wc-dialog-top / -bottom / -start / -end and wc-dialog-fullscreen (no JavaScript needed).
 */
export const Sizes: Story = {
    render: () =>
        html`<div style="display:flex;flex-wrap:wrap;gap:8px">
            ${sizedDialog('dialog-sm', 'wc-dialog-sm', 'Small', 'wc-dialog-sm: 320px wide.')}
            ${sizedDialog('dialog-lg', 'wc-dialog-lg', 'Large', 'wc-dialog-lg: 560px wide.')}
            ${sizedDialog('dialog-top', 'wc-dialog-xl wc-dialog-top', 'Top', 'wc-dialog-xl wc-dialog-top: 800px, at the top edge.')}
            ${sizedDialog('dialog-full', 'wc-dialog-fullscreen', 'Fullscreen', 'wc-dialog-fullscreen: fills the screen.')}
        </div>`,
};

import type { Meta, StoryObj } from '@storybook/html-vite';
import { html, icons } from './icons.ts';

export default { title: 'Forms/Field' } satisfies Meta;
type Story = StoryObj;

/**
 * Label with for/id, errors with aria-invalid + aria-describedby. The data-* attributes mirror the states
 * the framework components set (data-invalid, data-disabled).
 */
export const TextFields: Story = {
    name: 'Text fields',
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:14px;width:380px">
            <div class="wc-field">
                <label class="wc-field-label" for="name">Name</label>
                <div class="wc-input"><input class="wc-input-control" id="name" placeholder="Jane Doe" /></div>
            </div>
            <div class="wc-field" data-invalid>
                <label class="wc-field-label" for="email">Email</label>
                <div class="wc-input wc-input-invalid wc-input-has-icon wc-input-has-status-icon">
                    ${icons.mail('wc-input-icon')}
                    <input
                        class="wc-input-control"
                        id="email"
                        type="email"
                        value="max@company"
                        aria-invalid="true"
                        aria-describedby="email-error"
                    />
                    ${icons.circleAlert('wc-input-status-icon')}
                </div>
                <span class="wc-field-error-text" id="email-error">Please enter a valid address.</span>
            </div>
            <div class="wc-field">
                <label class="wc-field-label" for="search">Search</label>
                <div class="wc-input wc-input-has-icon">
                    ${icons.search('wc-input-icon')}<input
                        class="wc-input-control"
                        id="search"
                        type="search"
                        placeholder="Search services or topics"
                    />
                </div>
            </div>
            <div class="wc-field">
                <label class="wc-field-label" for="domain">Domain</label>
                <div class="wc-input">
                    <span class="wc-input-prefix" id="domain-prefix">https://</span>
                    <input
                        class="wc-input-control"
                        id="domain"
                        placeholder="customer-portal"
                        aria-describedby="domain-prefix domain-suffix"
                    />
                    <span class="wc-input-suffix" id="domain-suffix">.com</span>
                </div>
            </div>
            <div class="wc-field" data-disabled>
                <label class="wc-field-label" for="company" data-disabled>Company (disabled)</label>
                <div class="wc-input wc-input-disabled">
                    <input class="wc-input-control" id="company" placeholder="—" disabled />
                </div>
            </div>
            <div class="wc-field">
                <label class="wc-field-label" for="message">Your message</label>
                <textarea
                    class="wc-textarea"
                    id="message"
                    rows="3"
                    placeholder="What would you like to build? Is there a timeline?"
                ></textarea>
            </div>
        </div>`,
};

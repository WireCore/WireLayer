import type { Meta, StoryObj } from '@storybook/html-vite';
import { html, icons } from './icons.ts';

export default { title: 'Forms/Groups' } satisfies Meta;
type Story = StoryObj;

const input = (id: string, label: string) =>
    html` <div class="wc-field">
        <label class="wc-field-label" for="${id}">${label}</label>
        <div class="wc-input"><input class="wc-input-control" id="${id}" /></div>
    </div>`;

/** <fieldset> with <legend> names the group; the help text describes it */
export const Fieldset: Story = {
    render: () =>
        html` <fieldset class="wc-fieldset" aria-describedby="address-help" style="max-width:28rem">
            <legend class="wc-fieldset-legend">Billing address</legend>
            <span class="wc-fieldset-helper-text" id="address-help">As it appears on the invoice</span>
            ${input('company', 'Company')} ${input('street', 'Street and number')}
            <div style="display:grid;grid-template-columns:8rem 1fr;gap:12px">
                ${input('zip', 'ZIP code')} ${input('city', 'City')}
            </div>
        </fieldset>`,
};

/** Text, icons or buttons attached to an input; only the outer corners stay round */
export const InputGroup: Story = {
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:20px;width:24rem">
            <div class="wc-field">
                <label class="wc-field-label" for="domain">Domain</label>
                <div class="wc-input-group">
                    <span class="wc-input-group-addon">https://</span>
                    <div class="wc-input"><input class="wc-input-control" id="domain" placeholder="example" /></div>
                    <span class="wc-input-group-addon">.com</span>
                </div>
            </div>
            <div class="wc-field">
                <label class="wc-field-label" for="server">Search servers</label>
                <div class="wc-input-group">
                    <div class="wc-input wc-input-has-icon">
                        ${icons.search('wc-input-icon')}<input class="wc-input-control" id="server" type="search" />
                    </div>
                    <button type="button" class="wc-button wc-button-outline">Search</button>
                </div>
            </div>
            <div class="wc-field">
                <label class="wc-field-label" for="budget">Budget</label>
                <div class="wc-input-group">
                    <div class="wc-input">
                        <input class="wc-input-control" id="budget" inputmode="decimal" />
                    </div>
                    <span class="wc-input-group-addon">€ / month</span>
                </div>
            </div>
        </div>`,
};

/** The browser's <select>: its own keyboard handling and the mobile pickers */
export const NativeSelect: Story = {
    render: () =>
        html` <div class="wc-field" style="width:20rem">
            <label class="wc-field-label" for="location">Location</label>
            <div class="wc-native-select">
                <select class="wc-native-select-select" id="location">
                    <option value="">Select</option>
                    <option value="fra">Frankfurt</option>
                    <option value="nue" selected>Nuremberg</option>
                    <option value="vie" disabled>Vienna</option>
                </select>
                ${icons.chevronDown('wc-native-select-icon')}
            </div>
        </div>`,
};

const checkbox = (label: string, attributes = '') =>
    html` <label class="wc-checkbox">
        <input class="wc-checkbox-input" type="checkbox" ${attributes} />
        <span class="wc-checkbox-control">${icons.check('wc-checkbox-icon')}</span>
        <span class="wc-checkbox-label">${label}</span>
    </label>`;

/**
 * Checkbox with a native input: checked, focus, invalid (aria-invalid) and disabled come from the input, no
 * JavaScript (partially selected needs the framework components)
 */
export const Checkbox: Story = {
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:12px">
            ${checkbox('Not selected')} ${checkbox('Selected', 'checked')} ${checkbox('Invalid', 'aria-invalid="true"')}
            ${checkbox('Disabled', 'disabled')}
        </div>`,
};

const card = (
    type: 'checkbox' | 'radio',
    name: string,
    value: string,
    title: string,
    text: string,
    price: string,
    icon: string,
    checked = false
) =>
    html` <label class="wc-selection-card${type === 'radio' ? ' wc-selection-card-radio' : ''}">
        <span class="wc-selection-card-icon">${icon}</span>
        <span class="wc-selection-card-body">
            <span class="wc-selection-card-heading">
                <span class="wc-selection-card-title">${title}</span>
                <span class="wc-selection-card-price" id="${value}-price">${price}</span>
            </span>
            <span class="wc-selection-card-description" id="${value}-text">${text}</span>
        </span>
        <input
            class="wc-selection-card-input"
            type="${type}"
            name="${name}"
            value="${value}"
            aria-describedby="${value}-text ${value}-price"
            ${checked ? 'checked' : ''}
        />
    </label>`;

/**
 * Selectable cards with native inputs: the label is the card, the input the control – checked state, focus and
 * disabled come from the input (:has), no JavaScript
 */
export const CheckboxCards: Story = {
    name: 'CheckboxCard',
    render: () =>
        html` <div style="display:flex;flex-direction:column;gap:20px;width:min(760px,90vw)">
            <div style="width:320px">
                ${card('checkbox', 'backup', 'backup', 'Backup', 'Daily, kept for 30 days', '€9 / month', icons.archive('wc-selection-card-icon-svg'))}
            </div>
            <fieldset class="wc-checkbox-group wc-checkbox-group-grid">
                <legend class="wc-checkbox-group-label">Add-ons</legend>
                <div class="wc-checkbox-group-items" style="--wc-columns:3">
                    ${card('checkbox', 'modules', 'monitoring', 'Monitoring', 'Alerts by email and SMS', '€12', icons.activity('wc-selection-card-icon-svg'), true)}
                    ${card('checkbox', 'modules', 'mail', 'Email', 'Mailboxes with 50 GB', '€4', icons.mail('wc-selection-card-icon-svg'))}
                </div>
            </fieldset>
            <fieldset class="wc-checkbox-group wc-checkbox-group-grid">
                <legend class="wc-checkbox-group-label">Plan</legend>
                <div class="wc-checkbox-group-items" style="--wc-columns:3">
                    ${card('radio', 'plan', 'basic', 'Basic', 'For individuals', '€0', icons.userRound('wc-selection-card-icon-svg'))}
                    ${card('radio', 'plan', 'pro', 'Pro', 'For teams', '€29', icons.rocket('wc-selection-card-icon-svg'), true)}
                </div>
            </fieldset>
        </div>`,
};

const filterChip = (label: string, value: string) =>
    html` <li class="wc-filter-chips-item">
        <span class="wc-chip wc-chip-removable"
            ><span class="wc-chip-label"><span class="wc-filter-chips-name">${label}:</span> ${value}</span
            ><button type="button" class="wc-chip-remove" aria-label="Remove filter ${label}: ${value}">
                ${icons.x('wc-chip-remove-icon')}
            </button></span
        >
    </li>`;

/** The active filters as chips; each remove button is a link or a form submit on the server */
export const FilterChips: Story = {
    render: () =>
        html` <ul class="wc-filter-chips" aria-label="Active filters">
            ${filterChip('Location', 'Frankfurt')} ${filterChip('Load', 'over 50%')}
            <li class="wc-filter-chips-item">
                <button type="button" class="wc-filter-chips-reset">Reset all</button>
            </li>
        </ul>`,
};

import type { Component } from 'vue';

export interface NotificationItem {
    id: string;
    title: string;
    description?: string;
    /** When it happened – grouped into today, yesterday and older */
    date: Date | string | number;
    read?: boolean;
    /** The title becomes a link */
    href?: string;
    /** Without `href`: the title becomes a button that reports `select` (e.g. to open the item in the app) */
    clickable?: boolean;
    icon?: Component;
}

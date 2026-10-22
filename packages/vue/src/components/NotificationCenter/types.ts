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
    icon?: Component;
}

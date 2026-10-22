import { createContext } from 'react';

/** Rail state of the AppShell navbar, read by a SidebarNav inside it */
export interface AppShellRail {
    rail: boolean;
    expandOnHover: boolean;
}

export const AppShellRailContext = createContext<AppShellRail | null>(null);

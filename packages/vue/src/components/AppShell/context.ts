import { inject, type ComputedRef, type InjectionKey } from 'vue';

/** Rail state of the AppShell navbar, read by a SidebarNav inside it */
export interface AppShellRail {
    rail: boolean;
    expandOnHover: boolean;
}

export const appShellRailKey: InjectionKey<ComputedRef<AppShellRail>> = Symbol('wirecore-app-shell-rail');

export const useAppShellRail = () => inject(appShellRailKey, null);

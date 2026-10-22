export interface NavItem {
    label: string;
    href: string;
    /** The current page – sets aria-current="page" */
    current?: boolean;
}

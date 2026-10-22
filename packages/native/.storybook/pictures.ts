// Pictures for the stories as inline SVG, so Storybook and the tests need no network (as in the web Storybooks)
export const picture = (title: string, from: string, to: string) =>
    `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1600" height="1200" fill="url(#g)"/><text x="80" y="1120" font-family="sans-serif" font-size="96" fill="#fff">${title}</text></svg>`
    )}`;

export const pictures = [
    {
        src: picture('Reception', '#1e66f5', '#7c3aed'),
        alt: 'Reception with a counter and plants',
        caption: 'Reception, first floor',
    },
    {
        src: picture('Open-plan office', '#0d9488', '#1e66f5'),
        alt: 'Open-plan office with rows of desks',
        caption: 'Office, 3rd floor',
    },
    {
        src: picture('Data center', '#0a0a0a', '#475569'),
        alt: 'Server racks in the data center',
        caption: 'Frankfurt data center',
    },
    {
        src: picture('Meeting', '#b45309', '#be123c'),
        alt: 'Meeting room with a screen',
        caption: 'Room “Elbe”',
    },
];

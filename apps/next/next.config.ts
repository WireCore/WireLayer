import type { NextConfig } from 'next';

const config: NextConfig = {
    // The demo app runs in Docker – no telemetry, no dev indicator over the page
    devIndicators: false,
};

export default config;

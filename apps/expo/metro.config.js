// Metro: Expo's monorepo defaults + Uniwind (Tailwind v4). The WireLayer themes are registered as extra themes.
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const { nativeExtraThemes } = require('@wirecore/wirelayer-tokens');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
    cssEntryFile: './global.css',
    dtsFile: './uniwind-types.d.ts',
    extraThemes: nativeExtraThemes(),
});

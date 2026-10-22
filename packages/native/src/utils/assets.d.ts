// Metro returns an asset id, Vite a URL – both are accepted by expo-font's useFonts/loadAsync
declare module '*.ttf' {
    const asset: number | string;
    export default asset;
}

// Bundlers replace `process.env.NODE_ENV` (Vite, webpack, Next); without one the check fails and nothing warns
declare const process: { env: Record<string, string | undefined> };

/** True in development builds (`process.env.NODE_ENV` is not "production"); false where nothing sets it */
export const isDevelopment = () => {
    try {
        return process.env.NODE_ENV !== 'production';
    } catch {
        return false;
    }
};

const warned = new Set<string>();

/** Logs `[WireLayer] <message>` once per message, only in development (misuse hints for app developers) */
export function warnInDevelopment(message: string) {
    if (!isDevelopment() || warned.has(message)) return;
    warned.add(message);
    console.warn(`[WireLayer] ${message}`);
}

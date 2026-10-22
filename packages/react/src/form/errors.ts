/** First readable message of TanStack Form errors (strings or Standard Schema issues). */
export function firstError(errors: unknown[]): string | undefined {
    for (const error of errors) {
        if (typeof error === 'string' && error) return error;
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
            return error.message;
        }
    }
    return undefined;
}

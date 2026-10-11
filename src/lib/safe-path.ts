/**
 * True for a path on this site ("/account?tab=orders"). False for "//host",
 * "/\host" (browsers treat both as another site) and absolute URLs, so the
 * value is safe to redirect to or load from.
 */
export function isSameSitePath(value: string | null | undefined): value is string {
    return typeof value === 'string' && /^\/(?![/\\])/.test(value);
}

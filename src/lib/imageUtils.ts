import { isSameSitePath } from '@/lib/safe-path';

// function to generate a shimmer loading effect in SVG format
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="20%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const toBase64 = (str: string) =>
    typeof window === 'undefined'
        ? Buffer.from(str).toString('base64')
        : window.btoa(str)

export const shimmerPlaceholder = (w: number, h: number) =>
    `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`

/** True for sources an <Image> can show: site paths and http(s) URLs. */
export function isDisplayableImage(src: string | null | undefined): src is string {
    if (!src) return false;
    return isSameSitePath(src) || /^https?:\/\//i.test(src);
}

const STORAGE_PATH = '/storage/v1/object/public/';
const OPTIMIZED_ORIGINS = [process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://hdheoblrrnaejqalsmcg.supabase.co']
    .filter((u): u is string => Boolean(u))
    .map(u => new URL(u).origin);

/**
 * True when next/image may optimize the source: site paths and the hosts in
 * next.config.ts remotePatterns. Anything else must be rendered `unoptimized`.
 */
export function canOptimizeImage(src: string): boolean {
    if (isSameSitePath(src)) return true;
    try {
        const url = new URL(src);
        if (url.origin === 'https://www.closetbyera.com') return true;
        if (url.hostname === 'images.unsplash.com') return true;
        return OPTIMIZED_ORIGINS.includes(url.origin) && url.pathname.startsWith(STORAGE_PATH);
    } catch {
        return false;
    }
}

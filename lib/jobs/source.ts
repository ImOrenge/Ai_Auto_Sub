const SOURCE_CACHE_MARKER = "/videos/source-";

export function resolveCachedSourceUrl(sourceUrl: string, cachedUrl?: string | null): string {
  if (cachedUrl && cachedUrl.includes(SOURCE_CACHE_MARKER)) {
    return cachedUrl;
  }
  return sourceUrl;
}

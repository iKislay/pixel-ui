export const SOURCE_LOADING = "// Loading…";
export const SOURCE_ERROR = "// Unable to load source.";

const sourceCache = new Map<string, string>();

export async function fetchSource(registry: string) {
  if (sourceCache.has(registry)) {
    return sourceCache.get(registry)!;
  }
  try {
    const res = await fetch(`/api/source?name=${encodeURIComponent(registry)}`);
    const text = res.ok ? await res.text() : SOURCE_ERROR;
    if (res.ok) {
      sourceCache.set(registry, text);
    }
    return text;
  } catch {
    return SOURCE_ERROR;
  }
}

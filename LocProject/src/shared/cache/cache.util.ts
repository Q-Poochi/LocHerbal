export async function clearCacheByPrefix(
  cacheManager: any,
  prefix: string,
): Promise<void> {
  const stores = cacheManager?.stores;
  if (!Array.isArray(stores) || stores.length === 0) {
    return;
  }

  const keysToDelete = new Set<string>();

  for (const store of stores) {
    if (typeof store?.iterator !== 'function') {
      continue;
    }
    for await (const [key] of store.iterator()) {
      if (typeof key === 'string' && key.startsWith(prefix)) {
        keysToDelete.add(key);
      }
    }
  }

  for (const key of keysToDelete) {
    await cacheManager.del(key);
  }
}
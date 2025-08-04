import { LocalStorage } from "@raycast/api";

const CACHE_PREFIX = "vpn-controller-";
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export async function getCached<T>(key: string, ttl = DEFAULT_CACHE_TTL): Promise<T | null> {
  try {
    const cached = await LocalStorage.getItem<string>(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() - entry.timestamp > ttl) {
      await LocalStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };
  await LocalStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
}

export async function clearCache(): Promise<void> {
  const allItems = await LocalStorage.allItems();
  const cacheKeys = Object.keys(allItems).filter((key) => key.startsWith(CACHE_PREFIX));
  await Promise.all(cacheKeys.map((key) => LocalStorage.removeItem(key)));
}

export async function getRecentCountries(): Promise<string[]> {
  try {
    const recent = await LocalStorage.getItem<string>("recent-countries");
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
}

export async function addRecentCountry(countryCode: string): Promise<void> {
  const recent = await getRecentCountries();
  const updated = [countryCode, ...recent.filter((c) => c !== countryCode)].slice(0, 5);
  await LocalStorage.setItem("recent-countries", JSON.stringify(updated));
}

export async function getLastUsedServer(countryCode: string): Promise<string | null> {
  try {
    const server = await LocalStorage.getItem<string>(`last-server-${countryCode}`);
    return server || null;
  } catch {
    return null;
  }
}

export async function setLastUsedServer(countryCode: string, server: string): Promise<void> {
  await LocalStorage.setItem(`last-server-${countryCode}`, server);
}
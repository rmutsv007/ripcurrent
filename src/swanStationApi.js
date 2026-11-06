const SWAN_STATION_URL = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/swan_station';
const CACHE_KEY = 'hydrogis:swan-stations';
const CACHE_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT_DELAY_MS = 5 * 60 * 1000;

let memoryCache = null;
let inFlightRequest = null;

function readCache() {
  try {
    const stored = typeof window === 'undefined' ? null : window.sessionStorage.getItem(CACHE_KEY);
    if (stored) {
      const cache = JSON.parse(stored);
      if (cache && typeof cache === 'object') {
        memoryCache = cache;
      }
    }
  } catch (error) {
    console.warn('Unable to read cached ThaiWater wave stations:', error);
  }
  return memoryCache;
}

function writeCache(cache) {
  memoryCache = cache;
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.warn('Unable to cache ThaiWater wave stations:', error);
  }
}

function getStationList(data) {
  const stations = Array.isArray(data) ? data : data?.data || data?.swan_station;
  if (!Array.isArray(stations)) {
    throw new Error('Unexpected ThaiWater station response');
  }
  return stations;
}

function getRetryAfterMs(response, now) {
  const retryAfter = response.headers?.get?.('Retry-After');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return now + Math.max(0, seconds) * 1000;
    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) return Math.max(now, retryAt);
  }
  return now + RATE_LIMIT_DELAY_MS;
}

export function fetchSwanStations() {
  const now = Date.now();
  const cache = readCache();

  if (cache?.data !== undefined && now - cache.fetchedAt < CACHE_TTL_MS) {
    return Promise.resolve(cache.data);
  }
  if (cache?.retryAfter > now) {
    if (cache.data !== undefined) return Promise.resolve(cache.data);
    return Promise.reject(new Error('ThaiWater wave station request is rate limited; retry later'));
  }
  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = (async () => {
    try {
      const response = await fetch(SWAN_STATION_URL);
      if (!response.ok) {
        if (response.status === 429) {
          writeCache({
            ...cache,
            retryAfter: getRetryAfterMs(response, Date.now()),
          });
        }
        throw new Error(`ThaiWater response status: ${response.status}`);
      }

      const data = await response.json();
      getStationList(data);
      writeCache({ data, fetchedAt: Date.now(), retryAfter: 0 });
      return data;
    } catch (error) {
      if (cache?.data !== undefined) {
        console.warn('ThaiWater wave station request failed; using cached data:', error);
        return cache.data;
      }
      throw error;
    } finally {
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
}

export function getSwanStationList(data) {
  return getStationList(data);
}

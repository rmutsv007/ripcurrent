const stationData = [{ id: 1, swan_lat: '7.2', swan_long: '100.6' }];

beforeEach(() => {
  sessionStorage.clear();
  jest.resetModules();
});

test('reuses cached stations instead of requesting ThaiWater again', async () => {
  const { fetchSwanStations: loadStations } = require('./swanStationApi');
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => stationData,
  });

  await expect(loadStations()).resolves.toEqual(stationData);
  await expect(loadStations()).resolves.toEqual(stationData);

  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('uses cached stations and honors Retry-After when ThaiWater returns 429', async () => {
  sessionStorage.setItem('hydrogis:swan-stations', JSON.stringify({
    data: stationData,
    fetchedAt: Date.now() - 11 * 60 * 1000,
    retryAfter: 0,
  }));
  const { fetchSwanStations: loadStations } = require('./swanStationApi');
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 429,
    headers: { get: () => '300' },
  });
  jest.spyOn(console, 'warn').mockImplementation(() => {});

  await expect(loadStations()).resolves.toEqual(stationData);
  await expect(loadStations()).resolves.toEqual(stationData);

  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('rejects when there is no cached response and ThaiWater returns 429', async () => {
  const { fetchSwanStations: loadStations } = require('./swanStationApi');
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 429,
    headers: { get: () => null },
  });

  await expect(loadStations()).rejects.toThrow('ThaiWater response status: 429');
});

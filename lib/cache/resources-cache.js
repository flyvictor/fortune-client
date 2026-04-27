module.exports = {
  get: async (cache, serviceHost, options) => {
    const ttlMs = options && options.ttlMs;

    if (typeof ttlMs === 'number') {
      const lastRefresh = await cache.get(
        `fortune-client:resources:${serviceHost}:last-refresh`,
        null,
      );

      if (!lastRefresh) {
        await module.exports.clear(cache, serviceHost);
        return null;
      }

      const lastRefreshTime = new Date(lastRefresh).getTime();
      if (isNaN(lastRefreshTime) || Date.now() - lastRefreshTime > ttlMs) {
        await module.exports.clear(cache, serviceHost);
        return null;
      }
    }

    const result = await cache.get(`fortune-client:resources:${serviceHost}`, null);

    if (!result) {
      return null;
    }

    return JSON.parse(result);
  },
  set: async (cache, serviceHost, resources) => {
    if (resources == null) {
      return module.exports.clear(cache, serviceHost);
    }

    await cache.set(
      `fortune-client:resources:${serviceHost}:last-refresh`,
      new Date().toISOString(),
    );
    return cache.set(
      `fortune-client:resources:${serviceHost}`,
      JSON.stringify(resources),
    );
  },
  clear: async (cache, serviceHost) => {
    await cache.clear(`fortune-client:resources:${serviceHost}`);
    return cache.clear(`fortune-client:resources:${serviceHost}:last-refresh`);
  },
};

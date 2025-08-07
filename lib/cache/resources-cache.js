module.exports = {
  get: async (cache, serviceHost) => {
    const result = await cache.get(`fortune-client:resources:${serviceHost}`, null);

    if (!result) {
      return null;
    }

    return JSON.parse(result);
  },
  set: async (cache, serviceHost, resources) => {
    if (resources == null) {
      return cache.clear(`fortune-client:resources:${serviceHost}`);
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
  clear: (cache, serviceHost) =>
    cache.clear(`fortune-client:resources:${serviceHost}`),
};

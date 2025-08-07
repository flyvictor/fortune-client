const _ = require('lodash');
const resourcesResolver = require('./resources-resolver');
const remoteAdapterConstructor = require('../remote-adapter');
const resourcesCache = require('../cache/resources-cache');

function buildFCResourcesUri(baseHost) {
  if (!baseHost) {
    throw new Error('`baseHost` is required to build resources URI.');
  }
  return `${baseHost}/resources/fortune-client`;
}

/**
 * Keeps track of ongoing requests to avoid multiple simultaneous fetches
 * for the same resources.
 */
const refreshRequestsByHost = {};

const isRequestOnGoing = (url) => {
  return refreshRequestsByHost[url] && refreshRequestsByHost[url].pending;
};

const getOnGoingRequest = (url) => {
  return refreshRequestsByHost[url].promise;
};

const startRefreshRequest = (url, promise) => {
  refreshRequestsByHost[url] = {
    pending: true,
    promise,
  };
};

const completeRefreshRequest = (url) => {
  if (refreshRequestsByHost[url]) {
    refreshRequestsByHost[url].pending = false;
  }
};

/**
 * Fetch resources either from cache or remote.
 *
 * @param {*} app
 * @param {*} cache
 * @param {*} skipCache
 * @returns
 */
async function getByCacheOrRemote(app, cache, skipCache) {
  const url = _.isString(app) ? app : app.url;
  if (!url) {
    throw new Error('Url is required to init resources.');
  }

  if (!skipCache && cache) {
    const cachedResources = await resourcesCache.get(cache, url);
    if (cachedResources) {
      return cachedResources;
    }
  }

  const request = {
    uri: buildFCResourcesUri(url),
  };

  if (app.oauth) {
    request.oauth = {
      consumer_key: app.oauth.consumer_key,
      consumer_secret: app.oauth.consumer_secret,
    };
  }
  if (app.headers) request.headers = app.headers;

  if (isRequestOnGoing(url)) {
    return getOnGoingRequest(url);
  }

  startRefreshRequest(url, resourcesResolver.fetchResources(request));
  const resources = await getOnGoingRequest(url);
  completeRefreshRequest(url);
  
  if (cache) {
    await resourcesCache.set(cache, url, resources);
  }

  return resources;
}

/**
 * Initializes the fortune client starting from the given HTTP request.
 *
 * @param {*} router
 * @param {*} request
 * @param {*} context
 * @returns
 */
async function initAppByHttpRequest({
  router,
  app,
  context,
  cache,
  skipCache,
}) {
  const resources = await getByCacheOrRemote(app, cache, skipCache);

  const { remoteAdapter, changeHeader, deleteHeader, getHeader, changeUrl } =
    remoteAdapterConstructor();

  router.registerActions(remoteAdapter(app), resources);
  router.registerResources(remoteAdapter(app), resources);

  context.changeHeader = changeHeader;
  context.deleteHeader = deleteHeader;
  context.getHeader = getHeader;
  context.changeUrl = changeUrl;

  return resources;
}

function getResources(app) {
  const url = _.isString(app) ? app : app.url;
  return resourcesResolver.fetchResources({ uri: `${url}/resources` });
}

module.exports = {
  init: initAppByHttpRequest,
  getResources,
};

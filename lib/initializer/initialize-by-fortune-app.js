const _ = require('lodash');

/**
 * Initializes the fortune client starting from the given fortune app.
 *
 * @param {*} router
 * @param {*} fortuneApp
 * @param {*} options
 * @returns
 */
function initAppByFortune({ router, app: fortuneApp }) {
  const resources = fortuneApp.resources();

  router.registerActions(fortuneApp.direct, resources);
  router.registerResources(fortuneApp.direct, resources);

  return resources;
}

function getResources(fortuneApp) {
  return Promise.resolve(fortuneApp.resources());
}

module.exports = {
  init: initAppByFortune,
  getResources,
};

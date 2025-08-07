/**
 * @typedef FortuneClientPersistentCache
 *
 * @property {function(string, string|null|undefined): string|null|undefined} get - Function to get a value from the cache.
 * @property {function(string, string): void} set - Function to set a value in the cache.
 * @property {function(string): void} clear - Function to clear a value from the cache.
 */

const CryptoJS = require('crypto-js');
const _ = require('lodash');
const utils = require('./util');
const initializer = require('./initializer');

/**
 * Create a random MD5 hash based on uniqueId from lodash and current time.
 *
 * @returns {string} A random MD5 hash
 */
function createRandomMd5Hash () {
  const md5 = CryptoJS.algo.MD5.create();
  md5.update(Math.random().toString());
  md5.update(new Date().getTime().toString());
  md5.update(_.uniqueId());
  return `${md5.finalize()}`;
}

/**
 * Fortune Client Initializer
 * This function initializes the Fortune client with the provided applications and options.
 *
 * @param {*} apps
 * @param {Object} options
 * @param {Object} [options.deepFilter] - Optional deep filter options.
 * @param {FortuneClientPersistentCache} [options.persistentCache] - Optional persistent cache options.
 * @returns
 */
module.exports = function (apps, options) {
  options = options || {};

  const context = {
    resources: [],
    id: createRandomMd5Hash(),
    onRequest: null,
    onResponse: null,
    onErrorHook: null,
    utils: utils,
    extendRequestQueryKeys: function (keys) {
      utils.queryKeys = utils.queryKeys.concat(keys);
    },
  };

  return initializer(context, apps, options);
};

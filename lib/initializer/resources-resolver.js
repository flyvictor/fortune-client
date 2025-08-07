const isomorphicClient = require('../isomorphic-http-client');

/**
 * Fetches resources from a given Fortune app or URL.
 *
 * @param {*} request
 * @returns
 */
async function fetchResources (request) {
  try {
    const data = await isomorphicClient.get(request);
    if (data.statusCode !== 200) throw new Error('Can\'t fetch /resources');
    const resources = data.body.resources;

    return resources;
  } catch (err) {
    err.config = request;
    throw err;
  }
}

module.exports = {
  fetchResources,
};

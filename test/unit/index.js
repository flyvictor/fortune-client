const sinon = require('sinon'),
  util = require('../util');

describe('UNIT TESTS', function () {
  // eslint-disable-next-line  mocha/no-hooks-for-single-case
  beforeEach(function () {
    util.sandbox = sinon.createSandbox();
  });

  // eslint-disable-next-line  mocha/no-hooks-for-single-case
  afterEach(function () {
    util.sandbox.restore();
  });

  // eslint-disable-next-line  mocha/no-setup-in-describe
  util.requireSpecs(__dirname, [
    'crud-factory',
    'denormalize',
    'deep-filter',
    'actions-factory',
  ]);
});

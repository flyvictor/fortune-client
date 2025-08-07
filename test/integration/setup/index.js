var _ = require('lodash'),
  request = require('supertest'),
  should = require('should');

var baseUrl = 'http://localhost';

//TODO: populate linked resources

module.exports = _.bindAll({
  //<<<< HERE binding all methods at once
  apps: {
    users: {
      port: 9782,
      resources: {},
    },
    bands: {
      port: 9783,
      resources: {},
    },
  },
  initialiseFortunes: function () {
    var self = this;

    _.each(this.apps, function (app, name) {
      app.fortune = require('./' + name + '-fortune')().listen(app.port);
    });

    return Promise.all(
      _.map(this.apps, function (app) {
        return app.fortune.adapter.awaitConnection();
      }),
    )
      .catch(function (err) {
        console.trace(err);
      })
      .then(this.wipeCollections);
  },
  wipeCollections: function () {
    return Promise.all(
      _.map(
        this.apps.users.fortune.adapter.mongoose.connections,
        function (conn) {
          return Promise.all(
            _.map(_.keys(conn.collections), async function (name) {
              const collection = await conn.db.collection(name);
              await collection.deleteMany({});
            }),
          );
        },
      ),
    ).then(function () {
      return;
    });
  },
  populate: function () {
    var self = this;

    return Promise.all(
      _.map(this.apps, function (app, appName) {
        return Promise.all(
          _.map(
            require('./fixtures/' + appName + '.json'),
            function (data, resName) {
              return self
                ._populateResource(app, data, resName)
                .then(function (resource) {
                  _.extend(self.apps[appName].resources, resource);
                });
            },
          ),
        );
      }),
    ).then(function () {
      return;
    });
  },
  _populateResource: function (app, data, name) {
    var body = {},
      self = this;

    body[name] = data;

    return new Promise(function (resolve) {
      request(baseUrl + ':' + app.port)
        .post('/' + name)
        .send(body)
        .expect(201)
        .end(function (err, res) {
          should.not.exist(err);

          resolve(JSON.parse(res.text));
        });
    });
  },
});

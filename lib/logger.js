'use strict';
var superagent = require('superagent');
var mv = require('./normalize-filter').Middleware();
var oauth  =require('./oauth-middleware').Middleware({});

superagent.get('http://localhost:3012/status/')
  .query({
    filter: {
      a: 'b'
    },
    include: 'blah'
  })
  .use(mv)
  .use(oauth)
  .end(function(err, res) {
    if (err) throw err;
    console.log(res.statusCode);
  });
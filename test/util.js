var _ = require("lodash");

module.exports = {
  requireSpecs: function(dir, specs){
    _.each(specs, function(spec){ require(dir + "/" + spec)(this); },this);
  }
};

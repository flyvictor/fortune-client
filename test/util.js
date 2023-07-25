var _ = require("lodash");

module.exports = {
  requireSpecs: function(dir, specs){
    specs.forEach(spec => {
      require(dir + "/" + spec)(this);
    });
  },
};

var _ = require("lodash");

var util = module.exports = {
  toCapitalisedCamelCase: function(str){
    return _.map(str.split("-"), function(substr,i){
      return util.capitalise(substr);
    }).join("");
  },
  capitalise: function(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

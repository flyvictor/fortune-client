var _ = require("lodash");

var util = module.exports = {
  toCapitalisedCamelCase: function(str){
    return _.map(str.split("-"), function(substr,i){
      return util.capitalise(substr);
    }).join("");
  },
  capitalise: function(str){
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  toCamelCase: function( str ) {
    return _.map( str.split( /[-\ ]/ ), function( substr, i ){
      if( i === 0 ) return substr.toLowerCase();
      return util.capitalise( substr );
    }).join("");
  }
};

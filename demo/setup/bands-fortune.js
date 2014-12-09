module.exports = function(){
  return require("../fortune")({
    adapter: "mongodb",
    connectionString: process.env.BANDS_DB_CONNECTION_STRING ||
      "mongodb://localhost/fortune-client-test-bands"
  }).resource("band",{
    name: String,
    members: [{ref: "user", external: "true", type: String}],
    genres: [{ref: "genre"}]
  }).resource("genre", {
    name: String
  });
};

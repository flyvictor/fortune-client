module.exports = function(){
  return require("fortune")({
    adapter: "mongodb",
    connectionString: process.env.USERS_DB_CONNECTION_STRING ||
      "mongodb://localhost/fortune-client-test-users"
  }).resource("user",{
    name: String,
    email: String,
    address: {ref: "address"},
    instruments: [{ref: "instrument"}],
    lover: {ref: 'user', type: String},
    band: {ref: 'band', external: true}
  }, {
    model: {
      pk: "email"
    }
  }).resource("address",{
    houseNumber: Number,
    street: String,
    postcode: String,
    inhabitants: [{ref: "user", type: String}]
  }).resource("instrument",{
    name: String,
    genre: {ref: 'genre', external: true},
    owner: {ref: 'user', type: String}
  }).resource("na-na-na-na",{
    batman: String
  });
};

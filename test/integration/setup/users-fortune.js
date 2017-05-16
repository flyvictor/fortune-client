module.exports = function(){
  return require("fortune")({
    adapter: "mongodb",
    connectionString: process.env.USERS_DB_CONNECTION_STRING ||
      "mongodb://localhost/fortune-client-test-users"
  }).resource("user",{
    name: String,
    email: String,
    address: {ref: "address", inverse: 'inhabitants'},
    instruments: [{ref: "instrument", inverse: 'owner'}],
    lover: {ref: 'user', type: String, inverse: 'lover'},
    band: {ref: 'band', external: true},
    bababand: {ref: 'band', external: true},
    nanananas: [{ref: 'na-na-na-na', inverse: 'users'}]
  }, {
    model: {
      pk: "email"
    }
  }).resource("address",{
    houseNumber: Number,
    street: String,
    postcode: String,
    inhabitants: [{ref: "user", inverse: 'address', type: String}]
  }).resource("instrument",{
    name: String,
    genre: {ref: 'genre', external: true},
    owner: {ref: 'user', type: String, inverse: 'instruments'}
  }).resource("na-na-na-na",{
    batman: String,
    users: [{ref: 'user', inverse: 'nanananas', type: String}]
  });
};

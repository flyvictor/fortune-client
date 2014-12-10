"use strict";
var when = require("when");
var should = require("should");
var _ = require("lodash");

var usersFortune = require("./setup/users-fortune")();
var bandsFortune = require("./setup/bands-fortune")();

usersFortune.listen(1337);
bandsFortune.listen(1338);

when.all([
  //Resources are set up asynchronously
  usersFortune.adapter.awaitConnection(),
  bandsFortune.adapter.awaitConnection()
]).then(function(){

  var client = require("../lib/fortune-client")(['http://localhost:1337', 'http://localhost:1338']);

  //And this is async too :)
  client.ready.then(function(){
    return client.createUsers([
      {name: "Dilbert", email: "dilbert@mailbert.com"},
      {name: "Robert", email: "robert@mailbert.com"}
    ]).then(function(createdUsers){
      createdUsers.users.length.should.equal(2);
      return client.getUsers({});
    }).then(function(foundUsers){

      console.log("client.getUsers found user",
        foundUsers.users[0].id, foundUsers.users[0].email, foundUsers.users[0].name);
      console.log("client.getUsers found user",
        foundUsers.users[1].id, foundUsers.users[1].email, foundUsers.users[1].name);

      foundUsers.users.length.should.equal(2);
      return client.createAddresses([
        {street: "Penny lane", links: {inhabitants: foundUsers.users[0].id}}
      ]);
    }).then(function(createdAddresses){
      createdAddresses.addresses.length.should.equal(1);
      return client.getUser(createdAddresses.addresses[0].links.inhabitants[0])
    }).then(function(foundUser){
      
      console.log("client.getUser by inhabitant found user",
        foundUser.users[0].id, foundUser.users[0].email, foundUser.users[0].name);

      foundUser.users.length.should.equal(1);
      should.exist(foundUser.users[0].links.address);
      return client.createBands([
        {name: "AC/DC" , links: {members: [foundUser.users[0].id]}}
      ])
    }).then(function(createdBand){
      createdBand.bands.length.should.equal(1);
      return client.getUsers({}, {include: "address"})
    }).then(function(usersAndAddress){

      console.log("client.getUsers with addresses found address",
        usersAndAddress.linked.addresses[0].id, usersAndAddress.linked.addresses[0].street,
        usersAndAddress.linked.addresses[0].links.inhabitants);

      usersAndAddress.users.length.should.equal(2);
      usersAndAddress.linked.addresses.length.should.equal(1);
      return client.get("users", {name: "Dilbert"})
    }).then(function(foundUsers){

      console.log("client.get users Dilbert found user",
        foundUsers.users[0].id, foundUsers.users[0].email, foundUsers.users[0].name);

      foundUsers.users.length.should.equal(1);
      console.log("Done");
      teardown();
    });
  }).catch(function(err){
    console.error(err.stack || err);
    teardown();
  });
});

function teardown(){
  return when.all(_.map(usersFortune.adapter.mongoose.connections, function(conn){
    return when.all(_.map(_.keys(conn.collections), function(name){
      return when.promise(function(resolve, reject){
        conn.db.collection(name, function(err, collection){
          if(err){
            reject(err);
          }else{
            collection.remove({}, null, function(err){
              if(err){
                reject(err);
              }else{
                resolve();
              }
            });
          }
        });
      });
    }));
  })).then(function(){
    process.exit();
  });
}

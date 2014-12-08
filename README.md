# Fortune Client
Library for interacting with multiple instances of Fortune


Note: this documentation is hopelessly out of date. Update is in the works but for now you'd be better off looking at the tests if you need examples.


## Initialisation

```
var client = require("fortune-client")([ fortuneInstanceA, fortuneInstanceB ]);
```

## Methods

### Get
```
getResource(id, options)
getResources(query,options)
```

Gets a single,a set of or all documents of a given resource depending on whether the id is a single number, an array or a query. Returns a promise resolved with the requested resource data.

Example:
```
client.getUsers({firstName: "John"}).then(function(data){
  ...
});
```

### Create

```
createResource(document, options)
createResources(arrayOfDocuments,options)
```

Creates a new document. Returns a promise resolved with then new created document.

Example:
```
client.createUser({ name: "Bob", email: "bob@abc.com" })
```

### Destroy

```
destroyResource(id, options)
destroyResources(query, options)
```

Destroys a single, a set of or all documents of a given resource depending on whether the id is a single number, an array or a query.

Example:
```
client.destroyUsers(["Alice", "Bob", "Charlie"])
```

### Replace

```
replaceResource(id, document, options)
replaceResources(arrayOfIds, document, options)
```

Replaces the resource data for a given id with a provided document

Example:
```
client.replaceUser("Joe", { name: "Alice", sexChangedOn: "2011-10-09"})
```

### Update

```
udpateResource(id, data, options)
udpateResources(arrayOfIds, data, options)
```

Updates a given resource.

Example:

```
client.udpateUser("Joe", {op: "add", path: "/users/0/houses/-", value: "1 Elm Row"})
```


## Options

```
client.getResources(null, {
  headers: { "content-type": "application/json" }, // set any headers on the underlying request
  fields: ["firstName", "lastName"],
  include: ["ref1", "ref2"]
})
```

#Running demo

From fortune-client root folder run
* git submodule init
* git submodule update
* npm install
* cd demo/fortune
* npm install
* cd ../..
* node demo/example-inproc.js

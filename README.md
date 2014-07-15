# Fortune Client
Library for interacting with multiple instances of Fortune

## Initialisation

```
var client = require("fortune-client")([ fortuneInstanceA, fortuneInstanceB ]);
```

## Methods

### Get
```
getResource(query, options)
```

Gets a single,a set of or all documents of a given resource depending on whether the id is a single number, an array or a query. Returns a promise resolved with the requested resource data.

Example:
```
getUsers({firstName: "John"}).then(function(data){
  ...
});
```

### Create

```
createResource(document, options)
```

Creates a new document. Returns a promise resolved with then new created document.

Example:
```
createUser({ name: "Bob", email: "bob@abc.com" })
```

### Destroy

```
destroyResource(query, options)
```

Destroys a single, a set of or all documents of a given resource depending on whether the id is a single number, an array or a query.

Example:
```
destroyUsers(["Alice", "Bob", "Charlie"])
```

### Replace

```
replaceResource(id, document, options)
```

Replaces the resource data for a given id with a provided document

Example:
```
replaceUsers("Joe", { name: "Alice", sexChangedOn: "2011-10-09"})
```

### Update

```
udpateResource(id, data, options)
```

Updates a given resource.

Example:

```
udpateUsers("Joe", {op: "add", path: "/users/0/houses/-", value: "1 Elm Row"})
```


## Options

```
getResource(null, {
  headers: { "content-type": "application/json" }, // set any headers on the underlying request
  fields: ["firstName", "lastName"],
  include: ["ref1", "ref2"]
})
```


"use strict";
var when = require("when");
var should = require("should");
var _ = require("lodash");
var express = require("express");
var bodyParser = require('body-parser');
var http = require('http');

var usersFortune = require("./setup/users-fortune")();
var bandsFortune = require("./setup/bands-fortune")();

usersFortune.listen(1337);
bandsFortune.listen(1338);

when.all([
	usersFortune.adapter.awaitConnection(),
	bandsFortune.adapter.awaitConnection()
]).then(function(){

	var app = express();

	app.set('port', 3004);
	
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));

	var client = require("../lib/fortune-client")(['http://localhost:1337', 'http://localhost:1338']);

	client.ready.then(function(){
		client.resources.forEach(function(resource){

			console.log("\nRegistering GET /" + resource.route);
			app.get('/' + resource.route, function(req, res){
				console.log('GET /' + resource.route, req.query);
				client.get(resource.route, req.query.filter, req.query).then(function(values){
					res.send(values);
				});
			});

			// console.log(`Registering GET /${resource.route}/:id`);
			// app.get(`/${resource.route}/:id`, function(req, res){
			// 	console.log(`GET /${resource.route}/${req.params.id}`);
			// 	client.get(resource.route, req.params.id).then(values => res.send(values));
			// });

			console.log("Registering GET /" + resource.route + "/:id");
			app.get('/' + resource.route + "/:id", function(req, res){
				console.log('GET /' + resource.route + "/" + req.params.id);
				client.get(resource.route, req.params.id).then(function(values){
					res.send(values);
				});
			});

			console.log("Registering POST /" + resource.route);
			app.post('/' + resource.route, function(req, res){
				console.log('POST /' + resource.route, req.body);
				client.create(resource.route, req.body).then(function(values){
					res.send(values);
				});
			});

			console.log("Registering PATCH /" + resource.route + "/:id");
			app.patch('/' + resource.route + "/:id", function(req, res){
				console.log('PATCH /' + resource.route + "/" + req.params.id, req.body);
				client.update(resource.route, req.params.id, req.body).then(function(values){
					res.send(values);
				});
			});

			console.log("Registering PUT /" + resource.route + "/:id");
			app.put('/' + resource.route + "/:id", function(req, res){
				console.log('PUT /' + resource.route + "/" + req.params.id, req.body);
				client.replace(resource.route, req.params.id, req.body).then(function(values){
					res.send(values);
				});
			});

			console.log("Registering DELETE /" + resource.route + "/:id");
			app.delete('/' + resource.route + "/:id", function(req, res){
				console.log('DELETE /' + resource.route + "/" + req.params.id);
				client.destroy(resource.route, req.params.id).then(function(values){
					res.send(values);
				});
			});


		});

		http.createServer(app).listen(app.get('port'), function(){
			console.log("\nExpress server listening on port " + app.get('port'));
		});

	});

});

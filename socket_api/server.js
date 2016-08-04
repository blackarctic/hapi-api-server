'use strict';


// dependencies
const Hapi = require('hapi');
const Good = require('good');


// create server
const server = new Hapi.Server();
server.connection({ port: 3000 });


// initialize socket io
const io = require('socket.io')(server.listener);


// server state (app data)
let state = {
	name: {
		get: function () {
			return this.value; 
		},
		set: function (value) {
			this.value = value;
			return this;
		},
		value: ""
	}
};

// REST API
let rest_api = {
	name: {
		GET: function (payload, socket) {
			return { statusCode: 200, value: state.name.get() };
		},
		POST: function (payload, socket) {
			return this.PUT(payload);
		},
		PUT: function (payload, socket) {
			if (!payload || !payload.value) {
				return { statusCode: 404, error: "Not Found", message: "name could not be found in the payload", value: state.name.get()};
			}
			else {
				state.name.set(payload.value);
				if (socket) { socket.broadcast.emit("PUT name", {value: state.name.get()}); }
				else { io.emit("PUT name", {value: state.name.get()}); }
				return { statusCode: 200 };
			}
		},
		DELETE: function (payload, socket) {
			state.name.set("");
			if (socket) { socket.broadcast.emit("DELETE name"); }
			else { io.emit("DELETE name"); }
			return { statusCode: 200 };
		}
	}
};


// default route
server.register(require('inert'), (err) => {
	if (err) {
		throw err;
	}
	server.route({
		method: 'GET',
		path: '/',
		handler: function (request, reply) {
			reply.file('./public/index.html');
		}
	});
});


/*** HTTP API ROUTES ***/

// GET name route
server.route({
	method: 'GET',
	path: '/name',
	handler: function (request, reply) { reply(rest_api.name.GET(request.payload)); }
});

// POST name route
server.route({
	method: 'POST',
	path: '/name',
	handler: function (request, reply) { reply(rest_api.name.POST(request.payload)); }
});

// PUT name route
server.route({
	method: 'PUT',
	path: '/name',
	handler: function (request, reply) { reply(rest_api.name.PUT(request.payload)); }
});

// DELETE name route
server.route({
	method: 'DELETE',
	path: '/name',
	handler: function (request, reply) { reply(rest_api.name.DELETE(request.payload)); }
});


/*** SOCKET.IO API ROUTES ***/

io.on('connection', function(socket) {

	// GET name route
	socket.on('GET name', function (payload, reply) {
		reply(rest_api.name.GET(payload, socket));
	});

	// POST name route
	socket.on('POST name', function (payload, reply) {
		reply(rest_api.name.POST(payload, socket));
	});

	// PUT name route
	socket.on('PUT name', function (payload, reply) {
		reply(rest_api.name.PUT(payload, socket));
	});

	// DELETE name route
	socket.on('DELETE name', function (payload, reply) {
		reply(rest_api.name.DELETE(payload, socket));
	});

});


// start server with logging
server.register({
	register: Good,
	options: {
		reporters: {
			console: [{
				module: 'good-squeeze',
				name: 'Squeeze',
				args: [{
					response: '*',
					log: '*'
				}]
			}, {
				module: 'good-console'
			}, 'stdout']
		}
	}
}, (err) => {

	if (err) {
		throw err; // something bad happened loading the plugin
	}

	server.start((err) => {

	if (err) {
		throw err;
	}
		server.log('info', 'Server running at: ' + server.info.uri);
	});
});
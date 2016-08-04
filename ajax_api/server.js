'use strict';

// dependencies
const Hapi = require('hapi');
const Good = require('good');

// create server
const server = new Hapi.Server();
server.connection({ port: 3000 });

// initialize socket io
const io = require('socket.io')(server.listener);

io.on('connection', function(socket) {
	socket.on('name change', function(data) {
		if (data.name !== undefined) {
			server_state.name = data.name;
			socket.broadcast.emit('name change', data.name);
		}
	});
});


// server state (app data)
let server_state = {
	name: "",
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

// get name route
server.route({
	method: 'GET',
	path: '/name',
	handler: function (request, reply) {
		reply({code: 200, name: server_state.name});
	}
});

// set name route
server.route({
	method: 'PUT',
	path: '/name',
	handler: function (request, reply) {
		if (request.payload.name === undefined) {
			reply({code: 400, status: "Name not found"});
		}
		else {
			server_state.name = request.payload.name;
			reply({code: 200, name: server_state.name});
		}
	}
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
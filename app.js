var express = require('express'),	
	path = require('path')
	;

var ENVIRONMENT = process.env.ENVIRONMENT || 'dev',
	UNDEF = void 0;

var app = express(),
    server,
	config,
	sio;  

app.set('path', path);
app.set('basedir', __dirname);
app.set('appdir', __dirname + '/app' );

// load app config
config = require('./app/config/' + ENVIRONMENT + '.app.js')(app, express);

// store app config
app.set('config', config);


// start http server listening
server = require('http').createServer(app).listen(config.server.port, function (){
	console.log('Express server listening on port ' + config.server.port);
});

// start socket io server
sio = require('socket.io').listen(server);

// load socket io config
require('./app/config/' + ENVIRONMENT + '.socketio.js')(sio, config);


sio
	.set('authorization', function (data, accept) {
		console.log('socket.io authorization');
		if (!data.headers.cookie) {
			return accept('No cookie transmitted.', false);
		}

		data.cookie = require('cookie').parse(data.headers.cookie);
		console.log('++ raw cookie', data.cookie);			
		data.cookie = require('express/node_modules/connect/lib/utils').parseSignedCookies(data.cookie, config.session.secret);
		console.log('++ parsed cookie', data.cookie);

		data.sessionID = data.cookie[config.session.key];
		console.log('++ sessionID', data.sessionID);

		config.session.store.get(data.sessionID, function (err, session) {
			if (err || !session) { 
				return accept('Error at authentication', false);
			}

			data.session = session;

			return accept(null, true);
		});
	});

sio
	.sockets
		.on('connection', function (socket) {
			sio.log.info('-> user connected', socket.id);						
						
			socket.get('userdata', function (err, data) {
				var userdata = { id: socket.id, socketid: socket.id };				
				if (err || !data) {
					socket.set('userdata', userdata);
					data = userdata;
				}
				socket.emit('user.welcome', data);
			});			
			
			socket
				.on('user.profile.update', function (userdata) {
					socket.set('userdata', userdata);
				})
				.on('user.profile', function (callback) {
					if (!callback) {
						return;
					}
					socket.get('userdata', function (err, data) {
						if (err || !data) {
							return callback(err, false);
						}
						return callback(null, true, data);
					});
				})
				.on('user.whois', function (data, callback) {
					if (!callback) {
						return;
					}
					var tSocket = sio.sockets.socket(data.socketid);
					if (!tSocket) {
						return callback('User not found', false, data.socketid);
					}
					tSocket.get('userdata', function (err, data) {
						if (err || !data) {
							return callback('Error while parsing data:' + err, false, data.socketid);
						}
						callback(null, true, data);
					});
				})
				.on('user.subscribe', function (data) {
					socket.join(data.room);
				})
				.on('user.unsubscribe', function (data) {
					socket.leave(data.room);
				})		
				.on('user.list', function (callback) {
					if (!callback) {
						return;
					}
					var sockets = sio.sockets.clients().map(function (clSocket) {
						return clSocket.id;
					});
					sio.log.info('-> user.list ack', sockets);
					return callback(sockets);
				})
				.on('user.count', function (data, cb) {
					sio.log.info('-> user.count', data);
					var room, response;
					if (typeof data === 'function') {
						cb = data;
						room = "";
					} else if (typeof data === 'object') {
						room = data.room || "";
					}
					if (!cb) {
						return;
					}

					response = {
						'open': Object.keys(sio.sockets.clients(room)).length, 
						'connected': Object.keys(sio.sockets.clients(room)).length
					};
					sio.log.info('<- user.count', response);
					return cb(response);
				})
				.on('user.broadcast', function (data, cb) {
					sio.log.info('-> user.broadcast', data);
					var send;
					
					data.room || (data.room = "");
					cb || (cb = function () {});

					if (!data.messagemessage) {
						return cb('No message', false);
					}
				
					send = function (data) {
						socket.broadcast.emit('user.broadcast', data);
						cb(null, true);
					}
				
					if (!data.from) {
						socket.get('userdata', function (err, udata) {
							if (err) {
								sio.log.warn('Could not read userdata for socket', socket, err);
								return cb(err, false);
							}
							data.from = udata;
							send(data);
						});
					} else {
						send(data);
					}
				})
				.on('user.message', function (data, cb) {
					sio.log.info('-> user.message', data);
					var send;
					
					cb || (cb = function () {});
					
					if ( typeof data.to === 'object') {
						// ?
					} else if ( data.to[0] === '/' ) {
						data.isRoom = true;
					} else {
						return cb('Unrecognized "to"', false);
					}
				
					if (!data.message) {
						return cb('No message', false);
					}
				
					send = function (data) {
						if (data.isRoom) {
							sio.sockets.in(data.to).emit('user.message', data);
						} else {
							sio.sockets.socket(data.to.id).emit('user.message', data);
						}
						cb(null, true);
					}					
				
					if (!data.from) {
						socket.get('userdata', function (err, udata) {
							if (err) {
								sio.log.warn('Could not read userdata for socket', socket, err);
								return cb(err, false);
							}
							data.from = udata;
							send(data);
						});
					} else {
						send(data);
					}				
				
				})
				;
		})
		.on('disconnect', function (socket) {
			sio.log.info('-> user.disconnect, clearing events');	
			sio.sockets.emit('user.disconnect', socket.id);
			if (socket.$events) {
				socket.$events = {};
			}
		})	
		;

	
// route config, start
require(config.routes)(app);
    
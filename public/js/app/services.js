'use strict';

/* Services */


angular.module('myApp.services', [])
	.value('version', '0.1')
	.value('config',{
			'socketio': {
				'port': 8080,
				'host': 'localhost',
				'uri': 'http://localhost:8080'
			}
	})
	.factory('socket', ['$rootScope', 'config', function($rootScope, config) {	
		var socket = io.connect(config.socketio.uri);
		return {
			on: function(eventName, callback) {
				socket.on(eventName, function() {
					var args = arguments;
					$rootScope.$apply(function() {
						callback.apply(socket, args);
					});
				});
			},
			emit: function(eventName, data, callback) {
				socket.emit(eventName, data, function() {
					var args = arguments;
					$rootScope.$apply(function() {
						if (callback) {
							callback.apply(socket, args);
						}
					});
				})
			}
		};
	}])
	;

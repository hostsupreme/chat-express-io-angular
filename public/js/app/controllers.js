'use strict';

/* Controllers */
angular.module('myApp.controllers', [])
	.controller('IndexCtrl', [
		'$scope', 'socket', function ($scope, socket) {	
			socket.on('connect', function () {
				
			});
		}
	]);

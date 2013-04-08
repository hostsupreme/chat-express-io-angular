'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.controllers', 'myApp.filters', 'myApp.services', 'myApp.directives'])
	.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$routeProvider.when(
				'/', 
				{ templateUrl:'tpls/index.html', controller: 'IndexCtrl' });
		
		$routeProvider.otherwise({ redirectTo: '/' });
		$locationProvider.html5Mode(true).hashPrefix('');
	}])

	;

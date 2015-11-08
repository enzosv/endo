"use strict";
angular.module('endo')
	.controller('MainController', function ($scope, DateService, Todoist) {
		console.log("loaded controller");
		$scope.loggedIn = true;

		$scope.sync = function () {
			$scope.$broadcast("sync");
		};

		$scope.reset = function () {
			$scope.$broadcast("reset");
			chrome.storage.sync.clear();
			chrome.storage.local.clear();
			$scope.loggedIn = false;
		};

		$scope.login = function(){
			$scope.$broadcast("login");
		};

		$scope.add = function(){
			$scope.$broadcast("add");
		};

		$scope.$on("loggedIn", function(){
			$scope.loggedIn = true;
		});

		$scope.$on("emitReset", function(){
			$scope.reset();
		});
	});

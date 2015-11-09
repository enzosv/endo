"use strict";
angular.module('endo')
	.controller('MainController', function ($scope) {
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

		$scope.mainLogin = function () {
			$scope.$broadcast("login");
		};

		$scope.add = function () {
			if ($scope.search.indexOf("/task") > -1) {
				$scope.search = $scope.search.replace("/task", "");
				$scope.$broadcast("addTask");
			} else {
				console.log($scope.search);
				$scope.search = $scope.search.replace("/task", "");
				var dateString = chrono.parse($scope.search)[0];
				if (dateString) {
					$scope.$broadcast("addEvent");
				} else {
					$scope.$broadcast("addTask");
				}
			}
		};

		$scope.$on("loggedIn", function () {
			$scope.loggedIn = true;
		});

		$scope.$on("emitReset", function () {
			$scope.reset();
		});
	});

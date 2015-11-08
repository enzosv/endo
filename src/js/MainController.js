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
			var dateString = chrono.parse($scope.search)[0];
			if(dateString){
				// console.log(dateString);
				$scope.$broadcast("addEvent");
			} else{
				$scope.$broadcast("addTask");
				// console.log("no date specified");
			}
			// if (dateString) {
			// 	dateString = dateString.text;
			// 	content = $scope.search.replace(dateString, "");
			// 	$scope.items.unshift({
			// 		content: content,
			// 		parsedDate: dateString.charAt(0)
			// 			.toUpperCase() + dateString.slice(1),
			// 		id: temp_id,
			// 		project_name: projectName,
			// 		due_date: true,
			// 		project_id: project_id,
			// 		color: $scope.projects[project_id].color,
			// 		searchKey: (content + " " + dateString + " #" + projectName)
			// 			.toLowerCase()
			// 	});
			// }
		};

		$scope.$on("loggedIn", function () {
			$scope.loggedIn = true;
		});

		$scope.$on("emitReset", function () {
			$scope.reset();
		});
	});

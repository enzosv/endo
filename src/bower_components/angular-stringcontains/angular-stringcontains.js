"use strict";
angular.module('angular-stringcontains', [])
	.filter('stringContainsAllOfString', function () {
		return function (arrayToSearch, searchTerm, stringToCheck) {
			return arrayToSearch.filter(function (objectToSearch) {
				if (!objectToSearch[stringToCheck]) {
					console.error("object does not contain the"+ stringToCheck +" property, please create it. See https://github.com/enzosv/angular-stringcontains");
					return false;
				}
				if (searchTerm) {
					var s = searchTerm.toLowerCase()
						.split(" ");

					for (var i = 0; i < s.length; i++) {
						//immediately return false if word is not in searchKey otherwise, continue checking other words

						if (objectToSearch[stringToCheck].indexOf(s[i]) < 0) {
							return false;
						}
					}
				}
				return true;
			});
		};
	})
	.filter('stringContainsAnyOfString', function () {
		return function (arrayToSearch, searchTerm, stringToCheck) {
			return arrayToSearch.filter(function (objectToSearch) {
				if (!objectToSearch[stringToCheck]) {
					console.error("object does not contain the"+ stringToCheck +" property, please create it. See https://github.com/enzosv/angular-stringcontains");
					return false;
				}
				if (searchTerm) {
					var s = searchTerm.toLowerCase()
						.split(" ");
					for (var i = 0; i < s.length; i++) {
						//immediately return true if word is not in searchKey otherwise, continue checking other words
						if (objectToSearch[stringToCheck].indexOf(s[i]) > -1) {
							return true;
						}
					}
					return false;
				}
				return true;
			});
		};
	});

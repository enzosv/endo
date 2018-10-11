"use strict";
angular.module('endo')
	.factory('Todoist', function TodoistFactory($http) {
		return {
			login: function (email, password) {
				return $http.get("https://todoist.com/API/v7/login", {
					params: {
						email: email,
						password: password
					}
				});
			},
			get: function (token) {
				return $http.get("https://todoist.com/API/v7/sync",{
					params: {
						token: token,
						seq_no: 0,
						seq_no_global: 0,
						resource_types: '["items", "projects"]'
					}
				});
			},
			post: function(token, commands){
				return $http.get("https://todoist.com/API/v7/sync", {
					params: {
						token: token,
						commands: commands
					}
				});
			}
		};
	});

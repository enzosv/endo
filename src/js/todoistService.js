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
						sync_token: "*",
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

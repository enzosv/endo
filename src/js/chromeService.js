"use strict";
angular.module('endo')
	.factory('Chrome', function ChromeFactory() {
			return {
				save: function (location, object) {
					chrome.storage[location].set(object);
				},
				get: function (location, keys) {
					chrome.storage[location].get(keys, function (local) {
						return local;
					});
				},
				getToken: function (callback) {
					chrome.identity.getAuthToken({
						'interactive': true
					}, callback);
				}
			};
	});

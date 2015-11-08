"use strict";
angular.module('endo')
	.factory('DateService', function DateFactory($filter) {
		var now = new Date()
			.getTime();
		var isTimeless = function (date) {
			date = new Date(date);
			if ((date.getHours() === 0 && date.getMinutes() === 0) || (date.getHours() === 23 && date.getMinutes() === 59)) {
				return true;
			}

			return false;
		};
		return {
			parse: function (date) {
				var parsedDate = new Date(date)
					.getTime();
				if (parsedDate > now) {
					var format;
					if (parsedDate < now + 86400000) {
						if (isTimeless(parsedDate)) {
							format = "'Today'";
						} else {
							format = "h:mm a";
						}
					} else if (parsedDate < now + 172800000) {
						if (isTimeless(parsedDate)) {
							format = "'Tomorrow'";
						} else {
							format = "'Tomorrow' h:mm a";
						}
					} else if (parsedDate < now + 604800000) {
						format = "EEE, MMM d";
					} else if (parsedDate < now + 2592000000) {
						format = "MMM d";
					} else {
						format = "MMM yyyy";
					}
					return $filter('date')(parsedDate, format);
				} else {
					return $filter('timeAgo')(date);
				}
			},
			getFullDate: function(date){
				return $filter('date')(date, "yyyy MMMM EEEE d");
			}
		}
	});
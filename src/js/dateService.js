"use strict";
angular.module('endo')
	.factory('DateService', function DateFactory($filter) {
		var now = new Date()
			.getTime();
		var isTimeless = function (date) {
			date = new Date(date);
			console.log(date.getHours());
			console.log(date.getMinutes());
			if ((date.getHours() === 0 && date.getMinutes() === 0) || (date.getHours() === 23 && date.getMinutes() === 59)) {
				return true;
			}

			return false;
		};
		return {
			parse: function (date, isEvent, isTimed) {
				var parsedDate = new Date(date)
					.getTime();
				if (parsedDate > now) {
					var format;
					var tomorrow = new Date(now+86400000);
					tomorrow.setHours(0);
					tomorrow.setMinutes(0);
					tomorrow = tomorrow.getTime();
					if (parsedDate < tomorrow) {
						if (isTimeless(parsedDate) || (isEvent && !isTimed)) {
							format = "'Today'";
						} else {
							format = "h:mm a";
						}
					} else if (parsedDate < now + 172800000) {
						if (isTimeless(parsedDate) || (isEvent && !isTimed)) {
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
					if(isTimed){
						return false;
					}
					if(isEvent){
						return "All Day";
					}
					return $filter('timeAgo')(date);
				}
			},
			getFullDate: function(date){
				return $filter('date')(date, "yyyy MMMM EEEE d");
			}
		}
	});
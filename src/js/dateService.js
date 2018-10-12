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
			parse: function (date, isEvent, isTimed) {
				var parsedDate = new Date(date)
					.getTime();
				if (parsedDate > now) {
					var format;

					var endOfDay = new Date();
					endOfDay.setHours(23,59,59,999);

					var endOfTomorrow = new Date();
					endOfTomorrow.setDate(endOfTomorrow.getDate()+1);
					endOfTomorrow.setHours(23,59,59,999);


					if (parsedDate < endOfDay.getTime()) {
						if (isTimeless(parsedDate) || (isEvent && !isTimed)) {
							format = "'Today'";
						} else {
							format = "h:mm a";
						}
					} else if (parsedDate < endOfTomorrow.getTime()) {
						if (isTimeless(parsedDate) || (isEvent && !isTimed)) {
							format = "'Tomorrow'";
						} else {
							format = "'Tomorrow' h:mm a";
						}
					} else {
						format = "EEE, MMM d";
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
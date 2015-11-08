"use strict";
angular.module('endo')
	.factory('Calendar', function CalendarFactory($http) {
			return {
				listCalendars: function (options) {
					return $http.get("https://www.googleapis.com/calendar/v3/users/me/calendarList", options);
				},
				listEvents: function(options, id, startTime, endTime){
					return $http.get("https://www.googleapis.com/calendar/v3/calendars/" + id + "/events?timeMin=" + startTime + "&timeMax=" + endTime + "&singleEvents=true&orderBy=startTime&maxAtendees=0", options)
				}
			};
	});

"use strict";
angular.module('endo')
	.directive("calendar", function () {
		return {
			templateUrl: "../html/calendar.html",
			controller: function ($scope, Calendar, DateService) {
				$scope.calendars = [];
				$scope.events = [];
				var calendarCount = 0;
				var calendarsLoaded = 0;
				var tempEvents = [];
				var tempCalendars = [];
				var googleRequestOptions;

				// refreshCalendar();

				chrome.storage.local.get(['calendars', 'calLastSync'], function (local) {
					if (local) {
						if (local.calendars) {
							$scope.calendars = local.calendars;
							for (var i = 0; i < local.calendars.length; i++) {
								processEvents(local.calendars[i].items, local.calendars[i].color, local.calendars[i].summary);
								$scope.events = $scope.events.concat(local.calendars[i].items);
							}
							$scope.$apply();
						}
						if (local.calLastSync) {
							if (local.calLastSync < new Date()
								.getTime() - 300000) {
								refreshCalendar();
							} else{
								console.log(local.calLastSync - new Date().getTime()-300000);
							} 
						} else{
							refreshCalendar();
						}
					}
				});

				function refreshCalendar() {
					chrome.identity.getAuthToken({
						'interactive': true
					}, function (token) {
						googleRequestOptions = {
							headers: {
								'Authorization': 'OAuth ' + token,
								'Content-Type': 'application/json'
							}
						};
						Calendar.listCalendars(googleRequestOptions)
							.then(function (response) {

								var calendars = response.data.items;
								var startTime = new Date()
									.toISOString();
								var endTime = new Date();
								endTime.setDate(endTime.getDate() + 14);
								endTime = endTime.toISOString();
								calendarCount = calendars.length;
								calendarsLoaded = 0;
								for (var i = 0; i < calendars.length; i++) {
									getEventsForId(calendars[i].id, calendars[i].backgroundColor, startTime, endTime);

								}
							}, function (error) {
								console.error(error);
							});
					});
				}

				function processEvents(items, color, summary) {
					for (var i = 0; i < items.length; i++) {
						var item = items[i];
						item.color = color;
						var epochTime;
						if (item.start.date) {
							epochTime = Date.parse(item.start.date);
							item.epochTime = epochTime;
							item.parsedStart = DateService.parse(epochTime);
						} else {
							epochTime = Date.parse(item.start.dateTime);
							item.epochTime = epochTime;
							item.parsedStart = DateService.parse(epochTime);
						}
						item.fullParsedDate = DateService.getFullDate(epochTime);
						item.searchKey = (item.parsedStart + " " + item.fullParsedDate + " " + item.summary + " " + summary)
							.toLowerCase();

					}
				}

				function getEventsForId(id, color, startTime, endTime) {
					Calendar.listEvents(googleRequestOptions, id, startTime, endTime)
						.then(function (response) {
							if (response.data.items.length > 0) {
								processEvents(response.data.items, color, response.data.summary);
								response.data.color = color;
								tempCalendars.push(response.data);
								tempEvents = tempEvents.concat(response.data.items);
							}
							calendarsLoaded++;
							if (calendarsLoaded === calendarCount) {
								if ($scope.events !== tempEvents) {
									$scope.calendars = tempCalendars;
									$scope.events = tempEvents;
									console.log($scope.events);
									chrome.storage.local.set({
										'calendars': $scope.calendars,
										'calLastSync': new Date().getTime()
									});
								}
							}
						}, function (error) {
							calendarsLoaded++;
							if (calendarsLoaded === calendarCount) {
								if ($scope.events !== tempEvents) {
									$scope.calendars = tempCalendars;
									$scope.events = tempEvents;
									chrome.storage.local.set({
										'calendars': $scope.calendars,
										'calLastSync': new Date().getTime()
									});
								}
							}
							console.error(error);
						});
				}
			}
		};
	});

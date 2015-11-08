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
				var oAuthToken;

				$scope.$on("sync", function () {
					console.log("CALENDAR RECEIVED SYNC REQUEST");
					refreshCalendar();
				});

				$scope.$on("reset", function () {
					console.log("CALENDAR RECEIVED RESET REQUEST");
					reset();
				});

				$scope.$on("login", function () {
					console.log("CALENDAR RECEIVED LOGIN REQUEST");
					refreshCalendar();
				});

				$scope.$on("addEvent", function () {
					console.log("CALENDAR RECEIVED ADD REQUEST");

					var calendarName = $scope.search.split("#");
					var query;
					if (calendarName.length > 1) {
						calendarName = calendarName[1].split(" ")[0];
						query = $scope.search.replace("#" + calendarName, "");
						Calendar.addEvent(oAuthToken, getCalendarIdWithName(calendarName), query)
							.then(function (response) {
								refreshCalendar();
							}, function (error) {
								console.error(error);
							});
					} else {
						Calendar.addEvent(oAuthToken, getCalendarIdWithName(calendarName), $scope.search)
							.then(function (response) {
								refreshCalendar();
							}, function (error) {
								console.error(error);
							});
					}
					$scope.search = "";
				});

				function reset() {
					$scope.calendars = [];
					$scope.events = [];
					calendarCount = 0;
					calendarsLoaded = 0;
					tempEvents = [];
					tempCalendars = [];
					oAuthToken = "";
				}

				chrome.storage.local.get(['calendars', 'calLastSync'], function (local) {
					if (local) {
						if (local.calendars) {
							if (local.calendars.length === 0) {
								refreshCalendar();
							} else {
								$scope.calendars = local.calendars;
								for (var i = 0; i < local.calendars.length; i++) {
									processEvents(local.calendars[i].items, local.calendars[i].color, local.calendars[i].summary, local.calendars[i].visible);
									$scope.events = $scope.events.concat(local.calendars[i].items);
								}
								$scope.$apply();
								if (local.calLastSync) {
									if (local.calLastSync < new Date()
										.getTime() - 300000) {
										refreshCalendar();
									} else {
										console.log(local.calLastSync - new Date()
											.getTime() - 300000);
										chrome.identity.getAuthToken({
											'interactive': true
										}, function (token) {
											oAuthToken = token;
										});
									}
								} else {
									refreshCalendar();
								}
							}
						} else {
							refreshCalendar();
						}
					}
				});

				function refreshCalendar() {
					console.log("GETTING CALENDAR");
					chrome.identity.getAuthToken({
						'interactive': true
					}, function (token) {
						oAuthToken = token;
						Calendar.listCalendars(token)
							.then(function (response) {

								var calendars = response.data.items;
								var startTime = new Date()
									.toISOString();
								var endTime = new Date();
								endTime.setDate(endTime.getDate() + 14);
								endTime = endTime.toISOString();
								calendarCount = calendars.length;
								calendarsLoaded = 0;
								tempEvents = [];
								tempCalendars = [];
								for (var i = 0; i < calendars.length; i++) {
									getEventsForId(calendars[i].id, calendars[i].backgroundColor, startTime, endTime);
								}
							}, function (error) {
								console.error(error);
							});
					});
				}

				function getEventsForId(id, color, startTime, endTime) {
					Calendar.listEvents(oAuthToken, id, startTime, endTime)
						.then(function (response) {
							if (response.data.items.length > 0) {
								response.data.color = color;
								var matchedOld = false;
								for (var i = 0; i < $scope.calendars.length; i++) {
									if ($scope.calendars[i].id === id) {
										response.data.visible = $scope.calendars[i].visible;
										matchedOld = true;
										break;
									}
								}
								if (!matchedOld) {
									response.data.visible = true;
								}
								response.data.id = id;
								processEvents(response.data.items, color, response.data.summary, response.data.visible);
								tempCalendars.push(response.data);
								tempEvents = tempEvents.concat(response.data.items);
							}
							saveCalendars();
						}, function (error) {
							saveCalendars();
							console.error(error);
						});
				}

				function processEvents(items, color, summary, visible) {
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
						item.visible = visible;
						item.fullParsedDate = DateService.getFullDate(epochTime);
						item.searchKey = (item.parsedStart + " " + item.fullParsedDate + " " + item.summary + " " + summary)
							.toLowerCase();
					}
				}

				$scope.saveVisibility = function (calendar) {
					for (var i = 0; i < calendar.items.length; i++) {
						calendar.items[i].visible = calendar.visible;
					}
					chrome.storage.local.set({
						'calendars': $scope.calendars
					});
				};

				function saveCalendars() {
					calendarsLoaded++;
					if (calendarsLoaded === calendarCount) {
						// if ($scope.events !== tempEvents) {
						$scope.calendars = tempCalendars.slice();
						$scope.events = tempEvents.slice();
						chrome.storage.local.set({
							'calendars': $scope.calendars,
							'calLastSync': new Date()
								.getTime()
						});
						// }
					}
				}

				function getCalendarIdWithName(name) {
					for (var i = 0; i < $scope.calendars.length; i++) {
						if ($scope.calendars[i].summary === name) {
							console.log($scope.calendars[i].id);
							return $scope.calendars[i].id;
						}
					}
				}
			}


		};
	});

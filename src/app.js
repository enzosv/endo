"use strict";
angular.module('endo', ['angular-stringcontains', 'yaru22.angular-timeago'])
	.controller('MainController', function ($http, $scope, $filter) {

		var isTimeless = function (date) {
			date = new Date(date);
			if ((date.getHours() === 0 && date.getMinutes() === 0) || (date.getHours() === 23 && date.getMinutes() === 59)) {
				return true;
			}

			return false;
		};

		var now = new Date()
			.getTime();
		var parseDate = function (date) {
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
		};

		$scope.calendars = [];
		$scope.events = [];
		var googleRequestOptions;

		$scope.token = true;
		$scope.items = [];
		$scope.loginError = false;
		var commands = [];
		var seq = 0;
		var seq_g = 0;
		$scope.projects = {};
		$scope.last_sync = 0;
		var scheduledUpdate = false;
		var calendarCount = 0;
		var calendarsLoaded = 0;
		var tempEvents = [];
		var tempCalendars = [];

		Mousetrap.bind(['option+s'], function (e) {
			if (e.preventDefault) {
				e.preventDefault();
			}
			document.getElementById("searchField")
				.focus();
			return false;
		});
		Mousetrap.bind(['option+enter'], function (e) {
			if (e.preventDefault) {
				e.preventDefault();
			}
			if ($scope.search.length > 0) {
				console.log("adding");
				$scope.add();
			}
			return false;
		});

		document.getElementById("searchField")
			.addEventListener("focus", function () {
				this.placeholder = "Taskname tomorrow 5pm #Projectname";
			});
		document.getElementById("searchField")
			.addEventListener("blur", function () {
				this.placeholder = "Search";
			});

		$scope.resetAll = function () {
			$scope.items = [];
			$scope.token = false;
			commands = [];
			seq_g = 0;
			seq = 0;
			$scope.projects = {};
			chrome.storage.sync.clear();
			chrome.storage.local.clear();
		};

		chrome.storage.sync.get(['token', 'email'], function (sync) {
			console.log("refresh");
			if (sync) {
				$scope.token = sync.token;
				$scope.email = sync.email;
				chrome.storage.local.get(['commands', 'items', 'projects', 'last_sync', 'calendars', 'events'], function (local) {
					if (local) {
						commands = local.commands;
						if (!commands) {
							commands = [];
						}
						if (local.items) {

							for (var i = 0; i < local.items.length; i++) {
								if (local.items[i].due_date) {
									var newParsedDate = parseDate(Date.parse(local.items[i].due_date));
									var newFullParsedDate = $filter('date')(local.items[i].due_date, "yyyy MMMM EEEE d");
									local.items[i].searchKey.replace(local.items[i].parsedDate, newParsedDate)
										.replace(local.items[i].fullParsedDate, newFullParsedDate);
									local.items[i].parseDate = newParsedDate;
									local.items[i].fullParsedDate = newFullParsedDate;
								}
							}
							$scope.items = local.items;
						} else {
							$scope.items = [];
						}
						$scope.projects = local.projects;
						if (!$scope.projects) {
							$scope.projects = {};
						}
						$scope.last_sync = local.last_sync;
						if (!$scope.last_sync) {
							$scope.last_sync = 0;
						}
						// if (local.calendars) {
						// $scope.calendars = local.calendars;
						if (local.events) {
							$scope.events = local.events;
						} else {
							refreshCalendar();
						}
						// } else{
						// refreshCalendar();
						// }

						$scope.$apply();
						if ($scope.last_sync === 0 || $scope.last_sync < new Date()
							.getTime() - 300000) {
							console.log("last synced: " + $filter('timeAgo')($scope.last_sync) + ". Performing sync");
							$scope.todoistGet();
							refreshCalendar();
						}
						// else {
						// 	$scope.$apply();
						// }

					} else {
						$scope.resetAll();
					}
				});
			} else {
				$scope.resetAll();
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
				$http.get("https://www.googleapis.com/calendar/v3/users/me/calendarList", googleRequestOptions)
					.then(function (response) {
						
						var calendars = response.data.items;
						var startTime = new Date()
							.toISOString();
						var endTime = new Date();
						endTime.setDate(endTime.getDate() + 14);
						endTime = endTime.toISOString();
						calendarCount = calendars.length;
						for (var i = 0; i < calendars.length; i++) {
							getEventsForId(calendars[i].id, calendars[i].backgroundColor, startTime, endTime);
						}
					}, function (error) {
						console.error(error);
					});
			});
		}


		function getEventsForId(id, color, startTime, endTime) {
			$http.get("https://www.googleapis.com/calendar/v3/calendars/" + id + "/events?timeMin=" + startTime + "&timeMax=" + endTime + "&singleEvents=true&orderBy=startTime&maxAtendees=0", googleRequestOptions)
				.then(function (response) {
					if (response.data.items.length > 0) {
						for (var i = 0; i < response.data.items.length; i++) {
							var item = response.data.items[i];
							item.color = color;
							var epochTime;
							if (item.start.date) {
								epochTime = Date.parse(item.start.date);
								item.epochTime = epochTime;
								item.parsedStart = parseDate(epochTime);
							} else {
								epochTime = Date.parse(item.start.dateTime);
								item.epochTime = epochTime;
								item.parsedStart = parseDate(epochTime);
							}
							item.fullParsedDate = $filter('date')(epochTime, 'yyyy MMMM EEEE d');
							item.searchKey = (item.parsedStart + " " + item.fullParsedDate + " " + item.summary + " " + response.data.summary)
								.toLowerCase();

						}
						response.data.color = color;
						tempCalendars.push(response.data);
						tempEvents = tempEvents.concat(response.data.items);
					}
					calendarsLoaded++;
					if (calendarsLoaded === calendarCount) {
						if ($scope.events !== tempEvents) {
							$scope.calendars = tempCalendars;
							$scope.events = tempEvents;
							chrome.storage.local.set({
								'events': $scope.events,
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
								'events': $scope.events,
							});
						}
					}
					console.error(error);
				});
		}

		$scope.login = function () {
			$scope.resetAll();
			$http.get("https://todoist.com/API/v6/login", {
					params: {
						email: $scope.email,
						password: $scope.psswd
					}
				})
				.then(function (response) {
					var nil;
					$scope.psswd = nil;
					$scope.loginError = false;
					$scope.token = response.data.token;
					$scope.todoistGet();
					chrome.storage.sync.set({
						'token': $scope.token,
						'email': $scope.email
					});
					refreshCalendar();
				}, function (error) {
					var nil;
					// $scope.email = nil;
					$scope.loginError = true;
					$scope.psswd = nil;
					switch (error.status) {
					case -1:
						$scope.loginError = "Unable to connect to server. Please try again";
						break;
					case 400, 401:
						$scope.loginError = "Invalid email/password combination. Please try again";
						break;
					default:
						$scope.loginError = "Error: " + error.status + " occured. Please try again";
					}
					console.error("login error:");
					console.error(error);
				});
		};

		$scope.saveProjects = function () {
			chrome.storage.local.set({
				'projects': $scope.projects
			});
		};

		var getOrCreateProjectIdWithName = function (name) {
			for (var key in $scope.projects) {
				if ($scope.projects[key].name.toLowerCase() === name.toLowerCase()) {
					return key;
				}
			}
			var temp_id = uuid.v1();
			$scope.projects[temp_id] = {
				"name": name,
				"visible": true,
				"color": "#95ef63"
			};
			commands.push({
				type: "project_add",
				temp_id: temp_id,
				uuid: uuid.v1(),
				args: {
					name: name
				}
			});
			chrome.storage.local.set({
				'commands': commands,
				'projects': $scope.projects,
			});
			return temp_id;
		};

		$scope.todoistGet = function () {
			// $http.get("https://todoist.com/API/v6/sync"), {
			// 	params: {
			// 		token: $scope.token,
			// 		seq_no: 0,
			// 		seq_no_global: 0,
			// 		resource_types: '["all"]'
			// 	}
			// }
			$http({
					method: "GET",
					url: "https://todoist.com/API/v6/sync",
					params: {
						token: $scope.token,
						seq_no: 0,
						seq_no_global: 0,
						resource_types: '["items", "projects"]'
					}
				})
				.success(function (data) {
					// console.log(data);
					var projectColors = ["#95ef63", "#ff8581", "#ffc471", "#f9ec75", "#a8c8e4", "#d2b8a3", "#e2a8e4", "#cccccc", "#fb886e", "#ffcc00", "#74e8d3", "#3bd5fb"];
					var projectClone = {};
					// if(!seq && !seq_g){
					projectClone = JSON.parse(JSON.stringify($scope.projects));
					$scope.projects = {};
					// }

					for (var i = 0; i < data.Projects.length; i++) {
						var visible;
						if (!(data.Projects[i].id in projectClone)) {
							visible = true;
						} else {
							visible = projectClone[data.Projects[i].id].visible;
						}

						if (data.Projects[i].name === "Inbox") {
							$scope.projects[data.Projects[i].id] = {
								"name": data.Projects[i].name,
								"visible": visible,
								"color": "#b58900"
							};
						} else {
							$scope.projects[data.Projects[i].id] = {
								"name": data.Projects[i].name,
								"visible": visible,
								"color": projectColors[data.Projects[i].color]
							};
						}

					}
					$scope.last_sync = now;

					for (var j = 0; j < data.Items.length; j++) {
						var item = data.Items[j];
						item.project_name = $scope.projects[item.project_id].name;
						item.color = $scope.projects[item.project_id].color;
						if (item.due_date) {
							item.parsedDate = parseDate(Date.parse(item.due_date));
							item.fullParsedDate = $filter('date')(Date.parse(item.due_date), 'yyyy MMMM EEEE d');
						} else {
							item.parsedDate = "";
							item.fullParsedDate = "";
						}

						item.searchKey = (item.parsedDate + " " + item.fullParsedDate + " " + item.content + " #" + item.project_name)
							.toLowerCase();
					}
					// if (!seq && !seq_g) {
					$scope.items = data.Items;
					// } else {
					// $scope.items.push.apply($scope.items, data.Items);
					// }
					seq = data.seq_no;
					seq_g = data.seq_no_global;
					chrome.storage.local.set({
						'items': $scope.items,
						'projects': $scope.projects,
						'last_sync': $scope.last_sync
					});

					$scope.todoistUpdate();
					console.log("get success");
				})
				.error(function (error) {
					console.error("sync error: " + error);
				});
		};

		$scope.add = function () {
			var dateString = chrono.parse($scope.search)[0];
			var content;
			var temp_id = uuid.v1();
			var projectName = $scope.search.split("#");
			if (projectName.length > 1) {
				projectName = projectName[1].split(" ")[0];
				$scope.search = $scope.search.replace("#" + projectName, "");
			} else {
				projectName = "Inbox";
			}
			var project_id = getOrCreateProjectIdWithName(projectName);
			if (dateString) {
				dateString = dateString.text;
				content = $scope.search.replace(dateString, "");
				$scope.items.unshift({
					content: content,
					parsedDate: dateString.charAt(0)
						.toUpperCase() + dateString.slice(1),
					id: temp_id,
					project_name: projectName,
					due_date: true,
					project_id: project_id,
					color: $scope.projects[project_id].color,
					searchKey: (content + " " + dateString + " #" + projectName)
						.toLowerCase()
				});
			} else {
				dateString = "";
				content = $scope.search;
				$scope.items.unshift({
					id: temp_id,
					content: content,
					project_name: projectName,
					project_id: project_id,
					color: $scope.projects[project_id].color,
					searchKey: (content + " #" + projectName)
						.toLowerCase()
				});
			}

			commands.push({
				type: "item_add",
				temp_id: temp_id,
				uuid: uuid.v1(),
				args: {
					content: content,
					date_string: dateString,
					project_id: project_id
				}
			});
			chrome.storage.local.set({
				'commands': commands,
				'items': $scope.items,
			});
			$scope.todoistUpdate();
			$scope.search = "";
		};

		$scope.completeItem = function (item) {
			var index = $scope.items.indexOf(item);
			if (index > -1) {
				// $scope.items.splice(index, 1);
				item.completed = true;
				item.opacity = 0.5;
				commands.push({
					type: "item_complete",
					uuid: uuid.v1(),
					args: {
						project_id: item.project_id,
						ids: [item.id]
					}
				});
				chrome.storage.local.set({
					'commands': commands
						// 'items': $scope.items,
				});
				$scope.todoistUpdate();
			}

		};

		$scope.uncompleteItem = function (item) {
			item.completed = false;
			item.opacity = 1;
			commands.push({
				type: "item_uncomplete",
				uuid: uuid.v1(),
				args: {
					project_id: item.project_id,
					ids: [item.id]
				}
			});
			chrome.storage.local.set({
				'commands': commands
					// 'items': $scope.items,
			});
			$scope.todoistUpdate();
		}

		$scope.removeItem = function (item) {
			var index = $scope.items.indexOf(item);
			if (index > -1) {
				$scope.items.splice(index, 1);
				commands.push({
					type: "item_delete",
					uuid: uuid.v1(),
					args: {
						ids: [item.id]
					}
				});
				chrome.storage.local.set({
					'commands': commands,
					'items': $scope.items,
				});
				$scope.todoistUpdate();
			}
		};

		function performUpdate() {
			$http({
					method: "GET",
					url: "https://todoist.com/API/v6/sync",
					params: {
						token: $scope.token,
						commands: JSON.stringify(commands)
					}
				})
				.success(function (data) {
					scheduledUpdate = false;
					// for (var key in data.TempIdMapping) {
					// 	for (var i = $scope.items.length - 1; i >= 0; i--) {
					// 		if ($scope.items[i].id === key) {
					// 			$scope.items[i].id = data.TempIdMapping[key];
					// 		}
					// if ($scope.items[i].project_id === key) {
					// 	$scope.items[i].project_id = data.TempIdMapping[key];
					// }
					// }
					// for (var proj in $scope.projects) {
					// 	if (proj === key) {
					// 		$scope.projects[key] = {
					// 			name: $scope.projects[proj].name,
					// 			visible: $scope.projects[proj].visible,
					// 			color: $scope.projects[proj].color
					// 		};
					// 		delete $scope.projects[proj];
					// 	}
					// }
					// }

					console.log(data);
					commands = [];
					// seq = data.seq_no;
					// seq_g = data.seq_no_global;
					seq = 0;
					seq_g = 0;
					chrome.storage.local.set({
						'commands': commands,
						'items': $scope.items
							// 'projects': $scope.projects
					});
					$scope.todoistGet();
					console.log("update success");
				})
				.error(function (error) {
					scheduledUpdate = false;
					console.error("update error: ");
					console.error(error);
				});
		}

		$scope.todoistUpdate = function () {
			if (!seq) {
				$scope.todoistGet();
			}
			if (commands.length > 0) {
				console.log(JSON.stringify(commands));
				if (!scheduledUpdate) {
					setTimeout(performUpdate(), 60000);
					scheduledUpdate = true;
				}
			}
		};

	})
	.directive("row", function () {
		return {
			templateUrl: "row.html",
			controller: function ($scope) {
				$scope.hover = false;
				$scope.complete = function () {
					$scope.$parent.completeItem($scope.item);
				};

				$scope.uncomplete = function () {
					$scope.$parent.uncompleteItem($scope.item);
				};

				$scope.remove = function () {
					$scope.$parent.removeItem($scope.item);
				};

				$scope.mouseenter = function () {
					$scope.hover = true;
				};

				$scope.mouseleave = function () {
					$scope.hover = false;
				};
			}
		}
	})
	.directive("event", function () {
		return {
			templateUrl: "event.html",
			controller: function ($scope) {}
		}
	});

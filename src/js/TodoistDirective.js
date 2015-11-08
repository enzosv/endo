"use strict";
angular.module('endo')
	.directive("todoist", function () {
		return {
			templateUrl: "../html/todoist.html",
			controller: function ($scope, Todoist, DateService) {
				$scope.token = true;
				$scope.items = [];
				$scope.loginError = false;
				var commands = [];
				var seq = 0;
				var seq_g = 0;
				$scope.projects = {};
				$scope.last_sync = 0;
				var scheduledUpdate = false;

				$scope.$on("sync", function () {
					console.log("TODOIST RECEIVED SYNC REQUEST");
					get();
				});

				$scope.$on("reset", function () {
					console.log("TODOIST RECEIVED RESET REQUEST");
					reset();
				});

				$scope.$on("login", function () {
					console.log("TODOIST RECEIVED LOGIN REQUEST");
					login();
				});

				$scope.$on("add", function () {
					console.log("TODOIST RECEIVED ADD REQUEST");
					add();
				});

				function reset() {
					$scope.items = [];
					$scope.token = false;
					commands = [];
					seq_g = 0;
					seq = 0;
					$scope.projects = {};
				}

				chrome.storage.sync.get(['token', 'email'], function (sync) {
					console.log("refresh");
					if (sync) {
						if (sync.token && sync.email) {
							$scope.token = sync.token;
							$scope.email = sync.email;
							chrome.storage.local.get(['commands', 'items', 'projects', 'last_sync'], function (local) {
								if (local) {
									commands = local.commands;
									if (!commands) {
										commands = [];
									}
									if (local.items) {

										for (var i = 0; i < local.items.length; i++) {
											if (local.items[i].due_date) {
												var newParsedDate = DateService.parse(local.items[i].due_date);
												// var newParsedDate = parseDate(Date.parse(local.items[i].due_date));
												var newFullParsedDate = DateService.getFullDate(local.items[i].due_date);
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

									$scope.$apply();
									if ($scope.last_sync === 0 || $scope.last_sync < new Date()
										.getTime() - 300000) {
										get();
									}
								} else {
									$scope.$emit("emitReset");
								}
							});
						} else {
							$scope.$emit("emitReset");
						}
					} else {
						$scope.$emit("emitReset");
					}
				});

				function login() {
					$scope.$emit("emitReset");
					Todoist.login($scope.email, $scope.psswd)
						.then(function (response) {
							var nil;
							$scope.psswd = nil;
							$scope.loginError = false;
							$scope.token = response.data.token;
							get();
							chrome.storage.sync.set({
								'token': $scope.token,
								'email': $scope.email
							});
							$scope.$emit("loggedIn");
							// $scope.$parent.loggedIn = true;

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
								$scope.loginError = "Error " + error.status + " occured. Please try again";
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

				function get() {
					console.log("GETTING TODOIST");
					Todoist.get($scope.token)
						.then(function (response) {
							// console.log(data);
							var data = response.data;
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
							$scope.last_sync = new Date()
								.getTime();

							for (var j = 0; j < data.Items.length; j++) {
								var item = data.Items[j];
								item.project_name = $scope.projects[item.project_id].name;
								item.color = $scope.projects[item.project_id].color;
								if (item.due_date) {
									item.parsedDate = DateService.parse(Date.parse(item.due_date));
									item.fullParsedDate = DateService.getFullDate(item.due_date);
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

							update();
						}, function (error) {
							console.error("Todoist get error: " + error);
						});
				};

				function add() {
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
					update();
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
						update();
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
					update();
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
						update();
					}
				};

				function performUpdate() {
					Todoist.post($scope.token, JSON.stringify(commands))
						.then(
							function (response) {
								var data = response.data;
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
								get();
								console.log("update success");
							},
							function (error) {
								scheduledUpdate = false;
								console.error("update error: ");
								console.error(error);
							});
				}

				function update() {
					if (!seq) {
						get();
					}
					if (commands.length > 0) {
						console.log(JSON.stringify(commands));
						if (!scheduledUpdate) {
							setTimeout(performUpdate(), 60000);
							scheduledUpdate = true;
						}
					}
				};
			}
		}
	});

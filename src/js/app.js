"use strict";
angular.module('endo', ['angular-stringcontains', 'yaru22.angular-timeago'])
	.config(function () {
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
			var scope = angular.element(document.getElementById('MainController')).scope();
			if (scope.search.length > 0) {
				console.log("adding");
				scope.add();
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
	});

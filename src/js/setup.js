"use strict";
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

angular.module('endo')
	.directive("event", function () {
		return {
			templateUrl: "../html/event.html",
			controller: function ($scope) {
				$scope.mouseenter = function () {
					$scope.hover = true;
				};

				$scope.mouseleave = function () {
					$scope.hover = false;
				};
			}
		}
	});

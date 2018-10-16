angular.module('endo')
  .directive('task', function () {
    return {
      templateUrl: '../html/task.html',
      controller: function ($scope) {
        $scope.hover = false
        $scope.complete = function () {
          $scope.$parent.completeItem($scope.item)
        }

        $scope.uncomplete = function () {
          $scope.$parent.uncompleteItem($scope.item)
        }

        $scope.remove = function () {
          $scope.$parent.removeItem($scope.item)
        }

        $scope.mouseenter = function () {
          $scope.hover = true
        }

        $scope.mouseleave = function () {
          $scope.hover = false
        }
      }
    }
  })

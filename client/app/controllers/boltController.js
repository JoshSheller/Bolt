

angular.module('bolt.controller', [])

.controller('BoltController', function ($scope, $location, $window) {
  $scope.session = $window.localStorage;
  $scope.friendRequests = $window.localStorage.getItem('friendRequests').split(",");
  console.log($scope.friendRequests);

  $scope.startRun = function () {
    // Check which radio button is selected
    if (document.getElementById("switch_3_left").checked) {
      // Solo run
      $location.path('/run');
    } else if (document.getElementById("switch_3_center").checked) {
      $location.path('/friendList');
      // Running with friends has not been implemented yet, this is a
      // placeholder for when this functionality has been developed.
      // For now redirect runners to solo run.
      // $location.path('/run');
    } else {
      // Public run
      $location.path('/multiLoad');
    }
  };

  //when you click on the friends icon, trigger the dropdown menu dropdown
  $scope.dropDown = function () {
    $( document ).ready(function () {
      $(".dropdown-button").dropdown();
    });
  };
});


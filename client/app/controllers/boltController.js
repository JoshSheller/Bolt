

angular.module('bolt.controller', [])

.controller('BoltController', function ($scope, $location, $window, $interval, Profile) {
  $scope.session = $window.localStorage;
  $scope.friendRequests = $window.localStorage.getItem('friendRequests').split(",");

  // checks every 5 seconds to see if a user has any friend requests
  var checkForFriendRequests = function () {
    if ($scope.friendRequests.length > 0) {
      document.getElementsByClassName("friendIcon")[0].classList.add("activeFriendIcon");
    }
  };
  checkForFriendRequests();
  $interval(function () {
    checkForFriendRequests();
  }, 5000);

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

  // when you click on the friends icon, trigger the dropdown menu dropdown
  $scope.dropDown = function () {
    $( document ).ready(function () {
      $(".dropdown-button").dropdown();
    });
  };

  $scope.handleFriendRequest = function (action, newFriend) {
    Profile.handleFriendRequest(action, this.session.username, newFriend)
    .then(function(data) {
      console.log('data', data);
    });
  };


  // send a PR to the server, using func on profile factory
});


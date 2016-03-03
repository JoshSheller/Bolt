// This controller is tied to profile.html
angular.module('bolt.profile', ['bolt.auth'])

.controller('ProfileController', function ($scope, $location, $rootScope, $window, Auth, Profile) {
  $scope.newInfo = {};
  $scope.session = window.localStorage;
  $scope.showFriendInputForm = false;

  var getUserInfo = function () {
    Profile.getUser()
    .catch(function (err) {
      console.error(err);
    });
  };

  $scope.navigate = function (path) {
    $location.path(path);
  };

  $scope.signout = function () {
    Auth.signout();
  };

  $scope.toggleFriendInputForm = function () {
    $scope.inputFriendUsername = '';
    $scope.showFriendInputForm = !$scope.showFriendInputForm;
  };

  $scope.friendRequest = function (inputFriendUsername) {
    $scope.toggleFriendInputForm();
    // use the profile service to send a POST request
    Profile.sendFriendRequest(inputFriendUsername);
  };

  getUserInfo();
});
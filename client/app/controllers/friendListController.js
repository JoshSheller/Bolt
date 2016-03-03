angular.module('bolt.friendList', [])

.controller('friendListController', function ($scope, Profile) {
  $scope.friends = [];

  Profile.getUser()
  .then(function (user) {
    $scope.friends = user.friends;
  });

});
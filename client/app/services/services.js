angular.module('bolt.services', [])

// Handle all location-based features
.factory('Geo', function ($window) {
  var session = $window.localStorage;
  var mainMap;
  var currentLocMarker;
  var destinationMarker;
  var directionsService = new google.maps.DirectionsService();
  var directionsRenderer = new google.maps.DirectionsRenderer();
  var route;
  var initialLat;
  var initialLng;


  // Math functions
  var sqrt = Math.sqrt;
  var floor = Math.floor;
  var random = Math.random;
  var pow2 = function (num) {
    return Math.pow(num, 2);
  };

  // Create map around the users current location and their destination
  var makeInitialMap = function ($scope, destination) {
    navigator.geolocation.getCurrentPosition(function (position) {
      console.log("latpositionis:", position.coords.latitude);
      $scope.initialLoc = {
        longitude: position.coords.latitude,
        latitude : position.coords.longitude
      };
      console.log($scope.initialLoc);

        makeMap({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }, $scope);

      }, function (err) {
        console.error(err);
      });
    var makeMap = function (currentLatLngObj, $scope) {
      //find random destination coordinates, an obj with {lat:latval, lng: lngval}
      var destinationCoordinates = destination ||
          randomCoordsAlongCircumference(currentLatLngObj, session.preferredDistance);
          //create a map within the div with the id 'map'
      mainMap = new google.maps.Map(document.getElementById('map'), {
        center: new google.maps.LatLng(currentLatLngObj.lat, currentLatLngObj.lng),
        zoom: 13,
        disableDefaultUI: true
      });
      //get the directions
      directionsRenderer.setMap(mainMap);
      //put down marker
      currentLocMarker = new google.maps.Marker({
        position: new google.maps.LatLng(currentLatLngObj.lat, currentLatLngObj.lng),
        map: mainMap,
        animation: google.maps.Animation.DROP,
        icon: '/assets/bolt.png'
      });
      //set the start/end routes, based on the current location and the destination
      var startOfRoute = new google.maps.LatLng(currentLocMarker.position.lat(), currentLocMarker.position.lng());
      var endOfRoute = new google.maps.LatLng(destinationCoordinates.lat, destinationCoordinates.lng);
      $scope.destination = {
        lat: endOfRoute.lat(),
        lng: endOfRoute.lng()
      };
      route = directionsService.route({
        origin: startOfRoute,
        destination: endOfRoute,
        travelMode: google.maps.TravelMode.WALKING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        provideRouteAlternatives: false
      }, function (response, status) {
        directionsRenderer.setDirections(response);
        var totalDistance = 0;
        // Add up distance for all legs of the journey
        for (var i = 0; i < response.routes[0].legs.length; i++) {
          //distance is a human-readable string.
          var distance = response.routes[0].legs[i].distance.text;
          if (distance.substring(distance.length - 2) === "ft") {
            //convert the distance from feet to miles
            distance = (distance.substring(0, distance.length - 3) / 5280).toString().substring(0, 3) + " mi";
          }
          totalDistance += distance;
        }
        console.log('tot distance .... ', totalDistance);
        totalDistance = parseFloat(totalDistance) || 0.1; // If run distance is small display 0.1 miles
        $scope.totalDistance = totalDistance;

        // Change this to pull the users speed from their profile
          // silver is the time matching the users average mile speed
        var userAverageMile = 10;
        var totalSilverMinutes = userAverageMile * totalDistance;
        var totalBronzeMinutes = totalSilverMinutes * 1.1;
        var totalGoldMinutes = totalSilverMinutes * 0.9;

        var bronzeHours = Math.floor(totalBronzeMinutes / 60);
        var bronzeMinutes = Math.floor(totalBronzeMinutes % 60);
        var bronzeSeconds = ((totalBronzeMinutes % 60) - bronzeMinutes) * 60;

        var silverHours = Math.floor(totalSilverMinutes / 60);
        var silverMinutes = Math.floor(totalSilverMinutes % 60);
        var silverSeconds = ((totalSilverMinutes % 60) - silverMinutes) * 60;

        var goldHours = Math.floor(totalGoldMinutes / 60);
        var goldMinutes = Math.floor(totalGoldMinutes % 60);
        var goldSeconds = ((totalGoldMinutes % 60) - goldMinutes) * 60;

        // Display projected time in a friendly format
        $scope.goldHasHours = goldHours > 0;
        $scope.silverHasHours = silverHours > 0;
        $scope.bronzeHasHours = bronzeHours > 0;

        $scope.goldTime = moment().second(goldSeconds).minute(goldMinutes).hour(goldHours);
        $scope.silverTime = moment().second(silverSeconds).minute(silverMinutes).hour(silverHours);
        $scope.bronzeTime = moment().second(bronzeSeconds).minute(bronzeMinutes).hour(bronzeHours);

        $scope.$digest();
      });
    };
  };

  // Calculate distance between two coordinates
  var distBetween = function (loc1, loc2) {
    return sqrt(pow2(loc1.lat - loc2.lat) + pow2(loc1.lng - loc2.lng));
  };

  // Calculate the percentage of the total route distance that the user has run
  var calculatePercentageRouteRun = function ($scope, loc1, loc2) {
    $scope.distanceRun += distBetween(loc1, loc2);
    var percentageRun = Math.ceil(($scope.distanceRun / $scope.totalDistance) * 100);
    return percentageRun;
  };

  // Updates the current user position, and calculates the percentage of the total route completed.
  var updateCurrentPosition = function ($scope) {
    if ($scope.userLocation) {
      var prevLocation = {
        lat: $scope.userLocation.lat,
        lng: $scope.userLocation.lng
      };
    }
    navigator.geolocation.getCurrentPosition(function (position) {
      currentLocMarker.setPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
      if ($scope) {
        $scope.userLocation = {
          lat: currentLocMarker.position.lat(),
          lng: currentLocMarker.position.lng()
        };
        if (prevLocation) {
          $scope.percentComplete = calculatePercentageRouteRun($scope, prevLocation, $scope.userLocation);
          console.log('prevPosition: ', prevLocation);
          console.log('userLocation: ', $scope.userLocation);
        }
      }
    }, function (err) {
      console.error(err);
    });
  };

  var randomCoordsAlongCircumference = function (originObj, radius) {
    var randomTheta = Math.random() * 2 * Math.PI;
    return {
      lat: originObj.lat + (radius / 69 * Math.cos(randomTheta)),
      lng: originObj.lng + (radius / 69 * Math.sin(randomTheta))
    };
  };

  return {
    makeInitialMap: makeInitialMap,
    updateCurrentPosition: updateCurrentPosition,
    distBetween: distBetween
  };

})

// Handle all tracking and rewards during the run
.factory('Run', function ($http) {

  var pointsInTime = {
    'Gold': '',
    'Silver': '',
    'Bronze': ''
  };

  var updateTimeUntilMedal = function (secondsToMedal) {
    return moment().second(secondsToMedal).minute(secondsToMedal / 60);
  };

  // Could refactor to handle a {gold, silver, bronze} object
  var setPointsInTime = function ($scope) {
    pointsInTime['Gold'] = moment().add($scope.goldTime.second(), 'seconds').add($scope.goldTime.minute(), 'minutes');
    pointsInTime['Silver'] = moment().add($scope.silverTime.second(), 'seconds').add($scope.silverTime.minute(), 'minutes');
    pointsInTime['Bronze'] = moment().add($scope.bronzeTime.second(), 'seconds').add($scope.bronzeTime.minute(), 'minutes');
  };

  // Initialize medal countdown to gold
  var setInitialMedalGoal = function ($scope) {
    $scope.currentMedal = 'Gold';
    var secondsToGold = pointsInTime['Gold'].diff(moment(), 'seconds');
    $scope.timeUntilCurrentMedal = updateTimeUntilMedal(secondsToGold);
  };

  // Make sure the next best medal is displayed with the correct time
  // Could refactor to handle a {gold, silver, bronze} object
  var updateGoalTimes = function ($scope) {
    if ($scope.currentMedal === 'Gold') {
      var secondsToGold = pointsInTime['Gold'].diff(moment(), 'seconds');
      if (secondsToGold === 0) {
        var secondsToSilver = pointsInTime['Silver'].diff(moment(), 'seconds');
        $scope.timeUntilCurrentMedal = updateTimeUntilMedal(secondsToSilver);
        $scope.currentMedal = 'Silver';
      } else {
        $scope.timeUntilCurrentMedal = updateTimeUntilMedal(secondsToGold);
      }
    } else if ($scope.currentMedal === 'Silver') {
      var secondsToSilver = pointsInTime['Silver'].diff(moment(), 'seconds');
      if (secondsToSilver === 0) {
        var secondsToBronze = pointsInTime['Bronze'].diff(moment(), 'seconds');
        $scope.timeUntilCurrentMedal = updateTimeUntilMedal(secondsToBronze);
        $scope.currentMedal = 'Bronze';
      } else {
        $scope.timeUntilCurrentMedal = updateTimeUntilMedal(secondsToSilver);
      }
    } else if ($scope.currentMedal === 'Bronze') {
      var secondsToBronze = pointsInTime['Bronze'].diff(moment(), 'seconds');
      if (secondsToBronze === 0) {
        $scope.currentMedal = 'High Five';
        $scope.timeUntilCurrentMedal = '';
      } else {
        $scope.timeUntilCurrentMedal = updateTimeUntilMedal(secondsToBronze);
      }
    }
  };

  return {
    setPointsInTime: setPointsInTime,
    setInitialMedalGoal: setInitialMedalGoal,
    updateGoalTimes: updateGoalTimes
  };
})

// Update and retrieve user information
.factory('Profile', function ($http) {
    var updateUser = function (newInfo, user) {
      return $http({
        method: 'PUT',
        url: '/api/users/profile',
        data: {
          newInfo: newInfo,
          //The above 'newInfo' object needs to contain the same keys as
          //the DB, or else it will fail to PUT. E.g. newInfo needs to have
          //a 'firstName' key in the incoming object in order to update the
          //'firstName' key in the User DB. If it's named something else
          //('first', 'firstname', 'firstN', etc.), it won't work
          user: user
        }
      }).then(function (res) {
        return res;
      });
    };

    var getUser = function () {
      return $http({
        method: 'GET',
        url: '/api/users/profile'
      }).then(function (user) {
        return user.data;
      });
    };

    var sendFriendRequest = function (username, friendUsername) {
      return $http({
        method: 'POST',
        url: '/api/users/friendRequest',
        data: {
          username: username,
          friendUsername: friendUsername
        }
      }).then(function (res) {
        if ( res.data === 'User does not exist' || res.data === 'You have already sent this user a friend request') {
          return res.data;
        } else {
          console.log( 'Friend request made' );
          return res;
        }
      });
    };

    var handleFriendRequest = function (action, self, newFriend) {
      return $http({
        method: 'POST',
        url: '/api/users/handleFriendRequestAction',
        data: {
          action: action,
          self: self,
          newFriend: newFriend
        }
      }).then(function (res) {
        console.log('res');
        return res;
      });
    };

  return {
    updateUser: updateUser,
    getUser: getUser,
    sendFriendRequest: sendFriendRequest,
    handleFriendRequest: handleFriendRequest
  };
})

// Handle multiplayer sessions to db
.factory('MultiGame', function ($http) {
  return {
    makeGame : function (id, user1, user2) {
      return $http({
        method: 'POST',
        url: '/api/games',
        data: {
          id: id
        }
      }).then(function (res) {
        return res;
      });
    },

    // Optional progess argument, hardcoded for handling multiRun progress bar updating
    updateGame : function (id, field, progress) {
      //field is equal to either user1 or user2
      return $http({
        method: 'POST',
        url: '/api/games/update',
        data: {
          id: id,
          field: field,
          progress: progress
        }
      }).then(function (res) {
        return res;
      });
    },

    getGame : function (id) {
      return $http({
        method: 'GET',
        url: '/api/games/' + id
      }).then(function (res) {
        return res.data;
      });
    },

    removeGame: function (id) {
      console.log(id);
      return $http({
        method: 'POST',
        url: '/api/games/remove',
        data: {
          id: id
        }
      }).then(function (res) {
        return res;
      });
    }
  };
})

// Handle Authentication
.factory('Auth', function ($http, $location, $window) {
  // it is responsible for authenticating our user
  // by exchanging the user's username and password
  // for a JWT from the server
  // that JWT is then stored in localStorage as 'com.bolt'
  // after you signin/signup open devtools, click resources,
  // then localStorage and you'll see your token from the server
  var signin = function (user) {
    return $http({
      method: 'POST',
      url: '/api/users/signin',
      data: user
    })
    .then(function (resp) {
      return resp.data;
    });
  };

  var signup = function (user) {
    return $http({
      method: 'POST',
      url: '/api/users/signup',
      data: user
    })
    .then(function (resp) {
      return resp.data.token;
    });
  };

  // Checks token and ensures leftover tokens without usernames don't fly
  var isAuth = function () {
    return (!!$window.localStorage.getItem('com.bolt'))
        && (!!$window.localStorage.getItem('username'));
  };

  var signout = function () {
    $window.localStorage.removeItem('username');
    $window.localStorage.removeItem('first');
    $window.localStorage.removeItem('last');
    $window.localStorage.removeItem('firstName');
    $window.localStorage.removeItem('lastName');
    $window.localStorage.removeItem('phone');
    $window.localStorage.removeItem('email');
    $window.localStorage.removeItem('competitor');
    $window.localStorage.removeItem('preferredDistance');
    $window.localStorage.removeItem('runs');
    $window.localStorage.removeItem('achievements');
    $window.localStorage.removeItem('com.bolt');
    $location.path('/signin');
  };


  return {
    signin: signin,
    signup: signup,
    isAuth: isAuth,
    signout: signout
  };
});

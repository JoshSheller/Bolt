angular.module('run.controller', [])

.controller('RunController',
  function ($scope, $timeout, $interval, $window,
            $location, $route, Geo, Run, Profile) {
  $scope.initialLocation;
  $scope.userLocation;
  $scope.destination;
  $scope.goldHasHours = true;
  $scope.silverHasHours = true;
  $scope.bronzeHasHours = true;
  $scope.distanceRun = 0;
  $scope.percentComplete = 0;

  var startTime;
  var runTime;
  var statusUpdateLoop;
  var startLat;
  var startLong;
  var FINISH_RADIUS = 0.0002; // miles?

  // Update run timer
  var updateTotalRunTime = function () {
    var secondsRan = moment().diff(startTime, 'seconds');
    runTime = moment().minute(0).second(secondsRan);
  };

  // Define waiting messages for the user while Google maps loads...
  var messages = [
    "Finding the best route for you",
    "Scanning the streets",
    "Charging runtime engine",
    "Looking into the eye of the tiger"
  ];

  var setRunMessage = function () {
    $scope.runMessage = messages[Math.floor(Math.random() * messages.length)] + "...";
  };

  // Display random waiting message
  $interval(setRunMessage, Math.random() * 1000, messages.length);

  $scope.startRun = function () {
    // Simulate finishing run for manual testing
    // setTimeout(finishRun, 4000); // simulate finishing run for manual testing
    startTime = moment();
    $scope.raceStarted = true;
    statusUpdateLoop = $interval(updateStatus, 300);
    Run.setPointsInTime($scope);
    Run.setInitialMedalGoal($scope);
    document.getElementById('map').style.height = "80vh";
    document.getElementById('botNav').style.height = "20vh";
  };

  // Generate a new map or route after initial map has been loaded
  $scope.regenRace = function () {
    $route.reload();
  };

  // Generates google map with current location marker and run route details
  var makeInitialMap = function () {
    Geo.makeInitialMap($scope);


  };

  makeInitialMap();



  // Handle end run conditions. Update user profile to reflect latest run.
  var finishRun = function () {
    $scope.$parent.runTime = runTime.format('mm:ss');
    var medal = $scope.$parent.achievement = $scope.currentMedal;

    var date = new Date();
    console.log("initial loc", $scope.initialLoc);
    var endLocation = {
      latitude: $scope.destination.lat,
      longitude: $scope.destination.long
    };
    var googleExpectedTime = null;
    var actualTime = runTime;

    var currentRunObject = {
      date: date,
      startLocation: $scope.initialLoc,
      endLocation: {
        longitude: $scope.destination.long,
        latitude: $scope.destination.lat
      },
      googleExpectedTime: null,
      actualTime: runTime,
      medalReceived: medal,
      racedAgainst: null
    };

    // Update current user's profile
    Profile.getUser()
    .then(function (user) {
      var achievements = user.achievements;
      var previousRuns = user.runs;
      //update achievments object
      achievements[medal] = achievements[medal] + 1;
      $window.localStorage.setItem('achievements', JSON.stringify(achievements));
      //update runs object
      previousRuns.push(currentRunObject);
      updatedAchievementsData = {
        achievements: achievements,
        runs: previousRuns
      };
      Profile.updateUser(updatedAchievementsData, user)
      .then(function (updatedProfile) {
        return updatedProfile;
      })
      .catch(function (err) {
        console.error(err);
      });
    });

    $interval.cancel(statusUpdateLoop);
    $location.path('/finish');
  };

  // Check if user is in close proximity to destination
  var checkIfFinished = function () {
    if ($scope.destination && $scope.userLocation) {
      var distRemaining = Geo.distBetween($scope.userLocation, $scope.destination);
      if (distRemaining < FINISH_RADIUS) {

        finishRun();
      }
    }
  };

  // Update geographical location and timers. Update progress bar via calculating percentage total route completed.
  var updateStatus = function () {
    Geo.updateCurrentPosition($scope);
    updateTotalRunTime();
    Run.updateGoalTimes($scope);
    checkIfFinished();
  };

  // Stop geotracker upon canceling run
  // Does this make sure to stop tracking if they close the window? --> all scripts die when the browser is no longer interpreting them
  $scope.$on('$destroy', function () {
    $interval.cancel(statusUpdateLoop);
  });
});

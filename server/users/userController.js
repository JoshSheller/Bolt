var User = require('./userModel.js');
var Q = require('q');
var jwt = require('jwt-simple');
var helpers = require('../config/helpers');

// Promisify a few mongoose methods with the `q` promise library
var findUser = Q.nbind(User.findOne, User);
var createUser = Q.nbind(User.create, User);
var updateUserDB = Q.nbind(User.update, User);
var saveUser = Q.nbind(User.save, User);

module.exports = {

  // Sign a user in
  signin: function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;

    // see if they exist...
    findUser({username: username})
    .then(function (user) {
      if (!user) {
        // ...if we can't find them, throw error
        next(new Error('User does not exist'));
      } else {
        // ...if we can, check the password
        return user.comparePasswords(password)
        .then(function (foundUser) {
          if (foundUser) {
            var token = jwt.encode(user, 'secret');
            res.json({
              token: token,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              preferredDistance: user.preferredDistance,
              runs: JSON.stringify(user.runs),
              achievements: JSON.stringify(user.achievements),
              friendRequests: user.friendRequests
            });
          } else {
            return next(new Error('No user'));
          }
        });
      }
    })
    .fail(function (error) {
      next(error);
    });
  },

  signup: function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;

    // check to see if user already exists
    findUser({username: username})
    .then(function (user) {
      if (user) {
        next(new Error('User already exist!'));
      } else {
        // make a new user if not one
        return createUser({
          username: username,
          password: password
        });
      }
    })
    .then(function (user) {
      // create token to send back for auth
      var token = jwt.encode(user, 'secret');
      res.json({token: token});
    })
    .fail(function (error) {
      next(error);
    });
  },

  updateUser: function (req, res, next) {
    // This is tied to createProfile on the frontend, so users can update
    // their info
    var newData = req.body.newInfo;
    var username = req.body.user.username;
    var user = {
      username: username
    };

    // search the DB for the specific user
    var queryCondition = {username: username};

    findUser(user)
    .then(function (user) {
      if (user) {
        return updateUserDB(queryCondition, newData);
      } else {
        next(new Error('No user found!'));
      }
    })
    .fail(function (error) {
      next(error);
    });
  },

  getUser: function (req, res, next) {
    var token = req.headers['x-access-token'];
    if (!token) {
      next(new Error('No token'));
    } else {
      var user = jwt.decode(token, 'secret');
      findUser({username: user.username})
      .then(function (user) {
        res.json(user);
      })
      .catch(function (err) {
        console.error(err);
        res.send(404);
      });
    }
  },

  checkAuth: function (req, res, next) {
    // checking to see if the user is authenticated
    // grab the token in the header is any
    // then decode the token, which we end up being the user object
    // check to see if that user exists in the database
    var token = req.headers['x-access-token'];
    if (!token) {
      next(new Error('No token'));
    } else {
      var user = jwt.decode(token, 'secret');
      findUser({username: user.username})
      .then(function (foundUser) {
        if (foundUser) {
          res.send(200);
        } else {
          res.send(401);
        }
      })
      .fail(function (error) {
        next(error);
      });
    }
  },

  submitFriendRequest: function (req, res, next) {
    var username = req.body.username;
    var friendUsername = req.body.friendUsername;
    // find the user with the given username.
    findUser({username: friendUsername})
    .then(function (foundUser) {
      // if the username does not exist, respond with a message
      if ( !foundUser ) {
        console.log('user does not exist');
        res.send('User does not exist');
      }
      // if the friend already has a friend request from the user, then respond with a message
      else if ( foundUser.friendRequests.indexOf(username) > -1 ) {
        res.send('You have already sent this user a friend request');
      }
      // if you are already friends with the person, then respond with a message
      else if ( foundUser.friends.indexOf(username) > -1 ) {
        res.send('You are already friends with this person');
      }
      // if username exists, add the person's username to the friend request list
      else {
        foundUser.friendRequests.push(username);
        foundUser.save(function (err) {
          if (err) {
            next(new Error('Error saving friend request'));
          } else {
            res.send('Friend request made');
          }
        });
      };
    });
  },

  handleFriendRequestAction: function (req, res, next) {
    var action = req.body.action;
    var newFriend = req.body.newFriend;
    var self = req.body.self;

    // if action === accept, do a query for both users, and add both into friends array.
     // search the DB for the specific user
    var queryCondition = {username: newFriend};
    findUser({username: self})
    .then(function (foundSelfUser) {
      if ( action === 'reject' ) {
        // delete the friend request from self
        var index = foundSelfUser.friendRequests.indexOf(newFriend);
        foundSelfUser.friendRequests.splice(index, 1);
        foundSelUser.save(function (err) {
          if ( err ) {
            next(err);
          } else {
            res.send(foundSelfUser);
          }
        });
      } else {
        // this check is technically unnecessary, since it's also done when
        // the user submits a friend request in the first place.
        if (foundSelfUser.friends.indexOf(newFriend) > -1) {
          res.send('You are already friends with this user');
        } else {
          foundSelfUser.friends.push(newFriend);
          // delete the friend request from self
          var index = foundSelfUser.friendRequests.indexOf(newFriend);
          foundSelfUser.friendRequests.splice(index, 1);
          foundSelfUser.save(function (err) {
            if ( err ) {
              console.log( 'err' );
              next(err);
            }
          })
          // add self to newFriend
          .then(function () {
            findUser({username: newFriend})
            .then(function (foundNewFriendUser) {
              foundNewFriendUser.friends.push(self);

              foundNewFriendUser.save(function (err) {
                if ( err ) {
                  next(err);
                } else {
                  user = foundNewFriendUser;
                  res.send('user successfully added');
                }
              });
            })
            .fail(function (error) {
              next(error);
            });
          });
        };
      };
    });
  }








};















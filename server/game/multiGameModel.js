var mongoose = require('mongoose');
// Define mongo schema
var MultiGameSchema = new mongoose.Schema({
  //why are user1/user2 defined twice?
  user1: Object,
  user2: Object,
  active: Boolean,
  user1Progress: {
    type: Number,
    default: 0
  },
  user2Progress: {
    type: Number,
    default: 0
  },
  id: {
    type: String,
    required: true
  },
  // user1 and user2 are booleans that state whether user is ready
  // to start multiplayer race
  user1: {
    type: Boolean,
    default: false
  },
  user2: {
    type: Boolean,
    default: false
  },
  // cancelled is a boolean that states whether one of the users has
  // cancled during a multiplayer match. The current application does not
  // consider this boolean and needs to be implemented.
  cancelled: {
    type: Boolean,
    default: false
  },
  won: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('multiGame', MultiGameSchema);

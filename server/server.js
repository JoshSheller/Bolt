var express = require('express');
var mongoose = require('mongoose');

var app = express();
// ========================================
// Connect to local mongodb named "bolt"
// Uncomment line 9 to use a local database
// Be sure to re-comment line 9 when submitting PR
// mongoose.connect('mongodb://localhost/bolt');
// ========================================

// ========================================
// Connect to mongolab database
// Please replace this line with your own
//  mongolab link
mongoose.connect('mongodb://heroku_2s3bpfqk:Thomas13@ds019638.mongolab.com:19638/heroku_2s3bpfqk');
// ========================================

require('./config/middleware.js')(app, express);
require('./config/routes.js')(app, express);

// start listening to requests on port 8000
var port = Number(process.env.PORT || 8000);
app.listen(port, function () {
  console.log(`server listening on port ${port}`);
});


// export our app for testing and flexibility, required by index.js
module.exports = app;

const mongoose = require('mongoose');

// Use native promises
mongoose.Promise = global.Promise;

module.exports = mongoose;

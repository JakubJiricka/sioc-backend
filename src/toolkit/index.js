const winston = require('winston');
const pkg = require('../../package.json');

// Extensions
global.app = {name: pkg.name, version: pkg.version, description: pkg.description};
global.app.config = require('../../config.json');

global.app.data = require('./data');
global.app.server = require('./server');
global.app.security = require('./security');

global.app.start = () => {
    winston.info('Starting application...');
    // Setting environment flag.
    process.env.NODE_ENV = global.app.config.mode;
    global.app.data.moongose.connect(global.app.config.connectionStrings.app).then(
        () => {
            global.app.model = require('../model');
            return global.app.server.start();
        }
    ).catch(
        err => winston.error('Error starting app: %s', err)
    );
};

module.exports = global.app;

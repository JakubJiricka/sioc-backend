const {Router} = require('express');
const winston = require('winston');

module.exports = router => {
    winston.info('Loading public-api...');
    router.use('/', require('cors')(), require('./public-api')(Router()));

    router.use('/api', require('cors')(), require('./api')(Router()));

    router.use('/auth', require('cors')(), require('./auth')(Router()));
};


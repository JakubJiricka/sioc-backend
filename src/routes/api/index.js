const fs = require('fs');
const winston = require('winston');
const express = require('express');
const {forEach, reject, includes} = require('lodash');

const loadModules = (folder, router) => {
    forEach(
        reject(
            fs.readdirSync(folder),
            file => includes(file, '.')
        ),
        module => {
            winston.info('Loading %s api...', module);
            router.use(`/${module}`, require(`./${module}`)(express.Router()));
        }
    );
};

module.exports = router => {
    loadModules('src/routes/api', router);
    return router;
};

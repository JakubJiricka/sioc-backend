/**
 * Returns a middleware that checks that the user is authorized.
 * @returns {Function} A middleware that checks the user's authorization.
 */
const sessionSecret = global.app.config.auth.sessionSecret;
const {split} = require('lodash');
const jwt = require('jsonwebtoken');

module.exports = () =>
    (req, res, next) => {
        const header = req.get('Authorization');
        const token = split(header, /\s+/).pop();
        const decoded = jwt.verify(token, sessionSecret);
        if (decoded.authorized) {
            return next();
        }
    };

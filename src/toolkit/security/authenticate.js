/**
 * Returns a middleware that checks that the user has a session.
 * @param loginPage
 * @returns {Function} A middleware that checks the user's session.
 */
module.exports = loginPage =>
    (req, res, next) => {
        if (req.session.user) {
            req.user = req.session.user;
            return next();
        }

        if (req.xhr) {
            // If ajax.
            return res.json(403, {message: 'You don\'t have a session opened'});
        }
        res.redirect(loginPage || global.app.config.auth.loginPage);
    };

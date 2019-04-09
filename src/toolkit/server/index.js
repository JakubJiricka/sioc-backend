const winston = require('winston'),
    express = require('express'),
    bodyParser = require('body-parser');

const server = module.exports;

server.start = () => {
    const api = global.app.api = express();
    api.set('port', process.env.PORT || global.app.config.server.port);
    api.disable('x-powered-by');


    api.use(require('morgan')(global.app.config.logger || (api.get('env') === 'development' ? 'dev' : 'combined')));

    api.use(bodyParser.json(global.app.config.server.request.bodyParser));
    api.use(bodyParser.urlencoded(global.app.config.server.request.bodyParser));
    api.use(require('cookie-parser')(global.app.config.auth.sessionSecret));
    api.use(require('cookie-session')({secret: global.app.config.auth.sessionSecret}));

    require('../../routes/')(api);

    api.listen(api.get('port'), () => winston.info('%s started at port %s', global.app.name, api.get('port')));
};

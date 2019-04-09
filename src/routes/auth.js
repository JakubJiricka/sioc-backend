const model = global.app.model;
const sessionSecret = global.app.config.auth.sessionSecret;
const hash = global.app.security.hash;
const jwt = require('jsonwebtoken');

const createJWT = user => jwt.sign({id: user._id, authorized: true, role: user.role}, sessionSecret, {subject: user.email, expiresIn: '14d'});

module.exports = router => {
    router.post('/login', (req, res, next) => {
        model.User.findOne({
            email: req.body.email,
            password: hash(req.body.password)
        }).lean().exec().then(
            user => {
                if (!user) {
                    return res.status(401).send({message: 'Invalid email and/or password'});
                }
                req.session = user;
                return res.send({token: createJWT(user)});
            }
        ).catch(next);
    });

    router.post('/signUp', (req, res, next) => {
        model.User.count({email: req.body.email}).exec().then(
            existingUser => {
                if (existingUser) {
                    return res.status(409).send({message: 'Email is already taken'});
                }
                const user = new model.User({
                    name: req.body.user.name,
                    surname: req.body.user.surname,
                    email: req.body.user.email,
                    password: hash(req.body.user.password),
                    whatsapp: req.body.user.whatsapp,
                    birthdate: new Date(req.body.user.birthdate),
                    sex: '',
                    role: model.enums.roles.USUARIO
                });
                return user.save();
            }
        ).then(
            user => res.send({token: createJWT(user)})
        ).catch(next);
    });


    return router;
};

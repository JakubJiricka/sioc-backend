const model = global.app.model;
const {hash} = global.app.security;
const sessionSecret = global.app.config.auth.sessionSecret;
const {split, map} = require('lodash');
const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = router => {

    router.post('/', async (req, res, next) => {
        try {
            const count = await model.User.count({email: req.body.user.email}).exec();
            if (count) {
                return res.status(409).send({message: 'User Name or email is already taken'});
            }
            const user = new model.User(req.body.user);
            user.role = model.enums.roles.USUARIO;
            user.password = hash(user.password);
            await user.save();
            res.send({success: true});

        } catch (err) {
            next(err);
        }
    });

    router.get('/profile', async (req, res, next) => {
        const header = req.get('Authorization');
        if (header === 'Bearer null') {
            return res.send({user: 'anonymous'});
        }
        const token = split(header, /\s+/).pop();
        if (!token) {
            return res.sendStatus(401);
        }
        let agency = null;
        let client = null;
        try {
            const decoded = jwt.verify(token, sessionSecret);

            const user = await model.User.findOne({email: decoded.sub}, {password: 0}).lean().exec();
            if (user.role === model.enums.roles.MARTILLERO) {
                agency = await model.Agency.findOne({'auctioneers.value': new ObjectId(user._id)}).exec();
            }
            if (user.role === model.enums.roles.VENDEDOR) {
                agency = await model.Agency.findOne({'sellers.value': new ObjectId(user._id)}).exec();
            }
            if (user.role === model.enums.roles.CLIENTE) {
                client = await model.Client.findOne({'user': new ObjectId(user._id)}).exec();
            }

            if (agency)
                user['agency'] = agency.name;

            if (client)
                user['client'] = client._id;

            res.send({user});

        } catch (err) {
            next(err);
        }
    });

    router.get('/byRole', async (req, res, next) => {
        if (req.query.role === 'captain') {
            try {
                const users = await model.User.aggregate([
                    {
                        $lookup: {
                            from: 'agency',
                            localField: '_id',
                            foreignField: 'captain.value',
                            as: 'agencies'
                        }
                    },
                    {
                        $match: {
                            captain: true
                        }
                    }
                ]);
                res.send({users});
            } catch (err) {
                next(err);
            }
        } else {
            try {
                const header = req.get('Authorization');
                const token = split(header, /\s+/).pop();
                const data = jwt.verify(token, sessionSecret);
                if (data.role === model.enums.roles.MARTILLERO) {
                    const {sellers} = await model.Agency.findOne({'auctioneers.value': new ObjectId(data.id)}, 'sellers').sort('-createdAt').populate('sellers.value', '-password').exec();
                    const users = map(sellers, seller => seller.value);
                    return res.send({users});
                } else {
                    const users = await model.User.find({role: req.query.role}).populate('agency').exec();
                    res.send({users});
                }
            } catch (err) {
                next(err);
            }
        }
    });

    router.get('/search', async (req, res, next) => {
        const query = {};
        //query['name'] = {$regex: '.*' + req.query.q + '.*', $options: 'i'};
        if (req.query.userType === model.enums.roles.MARTILLERO) {
            query['role'] = req.query.userType;
        } else if (req.query.userType === model.enums.roles.CAPITAN) {
            query['captain'] = true;
        } else if (req.query.userType === model.enums.roles.USUARIO) {
            query['role'] = req.query.userType;
        } else if (req.query.userType === model.enums.roles.VENDEDOR) {
            query['role'] = req.query.userType;
        }
        try {
            const users = await model.User.find({
                '$and': [query]
            }).exec();
            res.send({users});
        } catch (err) {
            next(err);
        }
    });

    router.get('/:id', async (req, res, next) => {
        try {
            const user = await model.User.findById(req.params.id).exec();
            res.send({user});
        } catch (err) {
            next(err);
        }
    });

    router.put('/:id', async (req, res, next) => {
        try {
            const old_user = await model.User.findById(req.params.id).exec();

            const email_count = req.body.user.email == old_user.email ? 0 : await model.User.count({email: req.body.user.email}).exec();
            if (email_count) {
                return res.status(409).send({message: 'Email is already taken'});
            }
            await model.User.findByIdAndUpdate(req.params.id, req.body.user).exec();
            res.send({success: true});
        } catch (err) {
            next(err);
        }
    });

    router.post('/loadmore/', async (req, res, next) => {
        const options = req.body.searchParams.page;
        const query = {};
        try {
            const users = await model.User.find(query).sort({'createdAt': -1}) // sort by date
                .limit(options.perPage)
                .skip(options.perPage * options.pageNumber)
                .lean()
                .exec();
            res.send({users});
        } catch (err) {
            next(err);
        }
    });

    router.get('/', async (req, res, next) => {
        try {
            const users = await model.User.find().sort('-createdAt').lean().exec();
            res.send({users});
        } catch (err) {
            next(err);
        }
    });

    router.put('/delete/:id', (req, res, next) =>
        model.User.findByIdAndRemove(req.params.id).exec().then(
            () => res.send({success: true})
        ).catch(next)
    );

    router.put('/changeRole/:id', async (req, res, next) => {
        if (typeof req.body.captain != 'undefined') {
            try {
                await model.User.findByIdAndUpdate(req.params.id, {$set: {captain: req.body.captain}}).exec();
                const users = await model.User.find({captain: true}).exec();
                res.send({users});
            } catch (err) {
                next(err);
            }
        } else {
            const header = req.get('Authorization');
            const token = split(header, /\s+/).pop();
            const data = jwt.verify(token, sessionSecret);
            let users;
            try {

                if (data.role === model.enums.roles.MARTILLERO) {
                    const userAgency = await model.Agency.findOne({'auctioneers.value': new ObjectId(data.id)}, '_id').exec();
                    await model.Agency.findByIdAndUpdate({_id: userAgency._id}, {
                        $push: {
                            sellers: {
                                value: new ObjectId(req.body.id),
                                label: req.body.label
                            }
                        }
                    }).exec();
                    await model.User.findByIdAndUpdate(req.body.id, {$set: {agency: userAgency._id, role: req.body.newRole}}).exec();
                    users = await model.User.find({role: req.body.oldRole ? req.body.oldRole : req.body.newRole, agency: userAgency._id}).exec();
                }
                if (data.role === model.enums.roles.ADMIN) {
                    await model.User.findByIdAndUpdate(req.body.id, {$set: {role: req.body.newRole}}).exec();
                    users = await model.User.find({role: req.body.oldRole ? req.body.oldRole : req.body.newRole}).exec();
                }
                res.send({users});
            } catch (err) {
                next(err);
            }
        }
    });

    // Added For Favorite Method
    router.post('/add_favorite/:id', async (req, res, next) => {
        try {
            const data = req.body.user_with_favorite;
            const user = await model.User.findById(data._id).exec();
            const index = user.favorite.indexOf(data.dwelling_id);
            if (index > -1) {
                user.favorite.splice(index, 1);
            } else {
                user.favorite.push(data.dwelling_id);
            }
            await user.save();
            res.send({success: true});
        } catch (err) {
            next(err);
        }
    });

    router.post('/remove_favorite/:id', async (req, res, next) => {
        try {
            const data = req.body.user_with_favorite;
            const user = await model.User.findById(data._id).exec();
            const index = user.favorite.indexOf(data.dwelling_id);
            if (index > -1) {
                user.favorite.splice(index, 1);
                await user.save();
            }
            res.send({success: true});
        } catch (err) {
            next(err);
        }
    });
    router.post('/is_exists_favorite/:id', async (req, res, next) => {
        try {
            const data = req.body.user_with_favorite;
            const user = await model.User.findById(data._id).exec();
            const index = user.favorite.indexOf(data.dwelling_id);
            let ret_value = false;
            if (index > -1) {
                ret_value = true;
            }
            res.send({exists: ret_value});
        } catch (err) {
            next(err);
        }
    });
    return router;
};

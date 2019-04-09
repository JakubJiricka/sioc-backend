const model = global.app.model;
const {random, forEach, map, assign} = require('lodash');
const sessionSecret = global.app.config.auth.sessionSecret;
const {split, isEmpty} = require('lodash');
const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = router => {
    router.get('/', async (req, res, next) => {
        try {
            const dwellings = await model.Dwelling.find({ occupationStatus: { $ne: 'Eliminada' } }).sort('-updatedAt').limit(9).lean().exec();
            res.send({dwellings});
        } catch (err) {
            next(err);
        }
    });
    router.get('/favorite/:id', async (req, res, next) => {
        try {
            const user = await model.User.findById(req.params.id).exec();
            const dwellings = [];
            const data_arr = user.favorite;
            for (let i = 0; i < data_arr.length; i++) {
                const dwelling = await model.Dwelling.findOne({'_id': data_arr[i]}).exec();
                dwellings.push(dwelling);
            }
            res.send({dwellings});
        } catch (err) {
            next(err);
        }

        // try {
        //     const dwellings = await model.Dwelling.find({}).sort('-updatedAt').limit(9).lean().exec();
        //     res.send({dwellings});
        // } catch (err) {
        //     next(err);
        // }
    });

    router.post('/loadmore/', async (req, res, next) => {
        const header = req.get('Authorization');
        const token = split(header, /\s+/).pop();
        const data = jwt.verify(token, sessionSecret);
        let userAgency = null;
        if (req.body.searchParams.client === undefined && req.body.searchParams.admin) {
            try {
                if (data.role === model.enums.roles.MARTILLERO) {
                    userAgency = await model.Agency.findOne({'auctioneers.value': new ObjectId(data.id)}).exec();
                }
                if (data.role === model.enums.roles.VENDEDOR) {
                    userAgency = await model.Agency.findOne({'sellers.value': new ObjectId(data.id)}).exec();
                }
            } catch (err) {
                next(err);
            }

        }
        const options = req.body.searchParams.page;
        const query = {};
        if (userAgency !== null) {
            query['agency'] = new ObjectId(userAgency._id);
        }
        query['occupationStatus'] = {'$ne': 'Eliminada'};
        if (req.body.searchParams.subtype !== undefined) {
            query['occupationStatus'] = req.body.searchParams.subtype;
        }
        if (req.body.searchParams.client !== undefined) {
            query['client.value'] = req.body.searchParams.client;
        }
        try {
            if (!isEmpty(query)) {
                const dwellings = await model.Dwelling.find({
                    '$and': [
                        query
                    ]

                }).sort({'updatedAt': -1})
                    .limit(options.perPage)
                    .skip(options.perPage * options.pageNumber)
                    .lean()
                    .exec();

                res.send({dwellings});
            } else {
                const dwellings = await model.Dwelling.find({ occupationStatus: { $ne: 'Eliminada' } }).sort({'updatedAt': -1}) // sort by date
                    .limit(options.perPage)
                    .skip(options.perPage * options.pageNumber)
                    .lean()
                    .exec();
                res.send({dwellings});
            }
        } catch (err) {
            next(err);
        }
    });

    router.post('/', async (req, res, next) => {
        let userAgency = null;
        const dwelling = new model.Dwelling(req.body.dwelling);
        try {
            const header = req.get('Authorization');
            const token = split(header, /\s+/).pop();
            const data = jwt.verify(token, sessionSecret);
            if (data.role === model.enums.roles.MARTILLERO) {
                userAgency = await model.Agency.findOne({'auctioneers.value': new ObjectId(data.id)}, '_id').exec();
                dwelling.agency = userAgency._id;
            }
            if (data.role === model.enums.roles.VENDEDOR) {
                userAgency = await model.Agency.findOne({'sellers.value': new ObjectId(data.id)}, '_id').exec();
                dwelling.agency = userAgency._id;
            }
            dwelling.siocId = random(0, 999999);
            dwelling.createdBy = new ObjectId(data.id);
            await dwelling.save();
            await model.Client.findOneAndUpdate({_id: dwelling.client.value, 'agencies.agency': dwelling.agency}, {
                $push: {
                    agencies: {
                        dwellings: new ObjectId(dwelling._id),
                    }
                }
            }).exec();
            res.send({success: true});
        } catch (err) {
            next(err);
        }
    });

    router.get('/:id', async (req, res, next) => {
        try {
            const dwelling = await model.Dwelling.findById(req.params.id)
                .populate('agency')
                .populate('occupationStatusHistory.user', '-password')
                .populate('createdBy', '-password')
                .populate({path: 'createdBy', populate: {path: 'agency'}})
                .exec();
            res.send({dwelling});
        } catch (err) {
            next(err);
        }
    });

    router.put('/:id', (req, res, next) =>
        model.Dwelling.findByIdAndUpdate(req.params.id, req.body.dwelling).exec().then(
            () => res.send({success: true})
        ).catch(next)
    );

    router.get('/search/:id', async (req, res, next) => {
        try {
            const dwelling = await model.Dwelling.findOne({siocId: req.params.id}).exec();
            if (dwelling)
                res.send(dwelling._id);
            else
                res.send('null');
        } catch (err) {
            next(err);
        }
    });

    router.post('/search', async (req, res, next) => {
        let userAgency = null;
        if (isEmpty(req.body.searchParams)) {
            const dwellings = await model.Dwelling.find({ occupationStatus: { $ne: 'Eliminada' } }).lean().exec();
            res.send({dwellings});
        } else {
            if (req.body.searchParams.agencyDwellings) {
                try {
                    const header = req.get('Authorization');
                    const token = split(header, /\s+/).pop();
                    const data = jwt.verify(token, sessionSecret);
                    if (data.role === model.enums.roles.MARTILLERO) {
                        userAgency = await model.Agency.findOne({'auctioneers.value': new ObjectId(data.id)}, '_id').exec();
                    }
                    if (data.role === model.enums.roles.VENDEDOR) {
                        userAgency = await model.Agency.findOne({'sellers.value': new ObjectId(data.id)}, '_id').exec();
                    }
                } catch (err) {
                    next(err);
                }
            }
            const {searchParams} = req.body;
            const query = {};
            if (userAgency !== null) {
                query['agency'] = new ObjectId(userAgency._id);
            }
            if (searchParams.publicationType !== undefined) {
                query['publicationType'] = searchParams.publicationType;
            }
            if (searchParams.subtype !== undefined) {
                query['subtype'] = searchParams.subtype;
            }
            //query['occupationStatus'] = {'$ne': 'Eliminada'};
            query['occupationStatus'] = 'Disponible';
            if (searchParams.spaces) {
                const {spaces} = searchParams;
                forEach(spaces, (value, key) => {
                    query[`spaces.${key}`] = value;
                });
            }
            if (searchParams.features) {
                const {features} = searchParams;
                forEach(features, (value, key) => {
                    query[`features.${key}`] = value;
                });
            }
            if (searchParams.services) {
                const {services} = searchParams;
                forEach(services, (value, key) => {
                    query[`services.${key}`] = value;
                });
            }
            if (searchParams.legal) {
                const {legal} = searchParams;
                forEach(legal, (value, key) => {
                    query[`legal.${key}`] = value;
                });
            }
            if (searchParams.price) {
                if (searchParams.price.min !== undefined && searchParams.price.max === undefined) {
                    query['price'] = {$gte: req.body.searchParams.price.min};
                }
                if (searchParams.price.max !== undefined && searchParams.price.max === undefined) {
                    query['price'] = {$lte: req.body.searchParams.price.max};
                }
                if (searchParams.price.min !== undefined && searchParams.price.max !== undefined) {
                    query['price'] = {
                        $gte: req.body.searchParams.price.min,
                        $lte: req.body.searchParams.price.max
                    };
                }
            }
            try {

                let dwellings = [];

                if (searchParams.address) {

                    let addressCombined = {};
                    if (searchParams.address.length > 0) {
                        addressCombined = map(searchParams.address, addr => {
                            const q = assign({}, query);
                            forEach(addr, (value, key) => {
                                q[`address.${key}`] = value;
                            });
                            return {$and: [q]};
                        });

                        dwellings = await model.Dwelling.find({
                            '$or': addressCombined
                        }).lean().exec();
                    }
                }
                else {
                    dwellings = await model.Dwelling.find({
                        '$and': [
                            query
                        ]

                    }).lean().exec();
                }
                res.send({dwellings});
            } catch (err) {
                next(err);
            }
        }
    });


    return router;
};

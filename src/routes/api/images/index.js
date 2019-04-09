const model = global.app.model;
const {random, forEach} = require('lodash');
const request = require('request');
const querystring = require('querystring');

module.exports = router => {

    router.post('/delete/', async (req, res, next) => {
        const options = req.body.imageData;
        const data = querystring.stringify({
            'token': options.token
        });
        try {
            request({
                method: 'post',
                uri: options.url,
                headers: {'X-Requested-With': 'XMLHttpRequest'},
                body: data
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    res.json(body);
                }
                else {
                    res.json(error);
                }
            });
        } catch (err) {
            next(err);
        }

    });

    router.get('/', (req, res, next) =>
        model.Dwelling.find({ occupationStatus: { $ne: 'Eliminada' } }).sort('-createdAt').lean().exec().then(
            dwellings => res.send({dwellings})
        ).catch(next)
    );

    router.post('/loadmore/', async (req, res, next) => {
        const options = req.body.pageNumber;
        try {
            const dwellings = await model.Dwelling.find({ occupationStatus: { $ne: 'Eliminada' } }).sort({'createdAt': -1}) // sort by date
                .limit(options.perPage)
                .skip(options.perPage * options.pageNumber)
                .lean()
                .exec();
            res.send({dwellings});
        } catch (err) {
            next(err);
        }
    });

    router.post('/', (req, res, next) => {
        const dwelling = new model.Dwelling(req.body.dwelling);
        dwelling.siocId = random(0, 999999);
        dwelling.save().then(
            () => res.send({success: true})
        ).catch(next);
    });

    router.get('/:id', (req, res, next) => {
        model.Dwelling.findById(req.params.id).exec().then(
            dwelling => res.send({dwelling})
        ).catch(next);
    });

    router.put('/:id', (req, res, next) =>
        model.Dwelling.findByIdAndUpdate(req.params.id, req.body.dwelling).exec().then(
            () => res.send({success: true})
        ).catch(next)
    );

    router.get('/search/:id', (req, res, next) => {
        model.Dwelling.findOne({siocId: req.params.id}).exec().then(
            dwelling => res.send(dwelling._id)
        ).catch(next);
    });

    router.post('/search', async (req, res, next) => {
        const {searchParams} = req.body;
        const query = {};
        if (searchParams.publicationType !== undefined) {
            query['publicationType'] = searchParams.publicationType;
        }
        if (searchParams.subtype !== undefined) {
            query['subtype'] = searchParams.subtype;
        }
        query['occupationStatus'] = {'$ne': 'Eliminada'};
        if (searchParams.address) {
            const {address} = searchParams;
            forEach(address, (value, key) => {
                query[`address.${key}`] = value;
            });
        }
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
            if (searchParams.price.min !== undefined) {
                query['price'] = {$gte: req.body.searchParams.price.min};
            }
            if (searchParams.price.max !== undefined) {
                query['price'] = {$lte: req.body.searchParams.price.max};
            }
        }
        try {
            const dwellings = await model.Dwelling.find({
                '$and': [
                    query
                ]
            }).lean().exec();
            res.send({dwellings});
        } catch (err) {
            next(err);
        }
    });


    return router;
};

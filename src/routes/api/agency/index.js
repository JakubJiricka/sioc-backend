const model = global.app.model;
const {map} = require('lodash');

module.exports = router => {
    router.post('/', async (req, res, next) => {
        try {
            const agency = new model.Agency(req.body.agency);
            await agency.save();
            const auctioneers = await map(req.body.agency.auctioneers, async auctioneer => {
                return await model.User.findByIdAndUpdate(auctioneer.value, {agency: agency._id}).exec();
            });
            const sellers = await map(req.body.agency.sellers, async seller => {
                return await model.User.findByIdAndUpdate(seller.value, {agency: agency._id}).exec();
            });
            if (auctioneers && sellers) {
                res.send({success: true});
            } else {
                res.send({success: false});
            }
        } catch (err) {
            next(err);
        }
    });

    router.get('/', async (req, res, next) => {
        try {
            const agencies = await model.Agency.find({}).sort('-createdAt').populate('auctioneers.value', '-password').populate('captain.value', '-password').populate('sellers.value', '-password').lean().exec();
            res.send({agencies});
        } catch (err) {
            next(err);
        }
    });

    router.put('/:id', async (req, res, next) => {
        try {
            await model.Agency.findByIdAndUpdate(req.params.id, req.body.agency).exec();
            res.send({success: true});
            const auctioneers = await map(req.body.agency.auctioneers, async auctioneer => {
                return await model.User.findByIdAndUpdate(auctioneer.value, {agency: req.params.id}).exec();
            });
            const sellers = await map(req.body.agency.sellers, async seller => {
                return await model.User.findByIdAndUpdate(seller.value, {agency: req.params.id}).exec();
            });
            if (auctioneers && sellers) {
                res.send({success: true});
            } else {
                res.send({success: false});
            }
        } catch (err) {
            next(err);
        }
    });

    router.put('/delete/:id', async (req, res, next) => {
        try {
            await model.Agency.findByIdAndUpdate(req.params.id, {deleted: true}).exec();
            const auctioneers = await map(req.body.agency.auctioneers, async auctioneer => {
                return await model.User.findByIdAndUpdate(auctioneer.value, { $unset: { agency: ''}}).exec();
            });
            const sellers = await map(req.body.agency.sellers, async seller => {
                return await model.User.findByIdAndUpdate(seller.value, { $unset: { agency: ''}}).exec();
            });
            if (auctioneers && sellers) {
                res.send({success: true});
            } else {
                res.send({success: false});
            }
        } catch (err) {
            next(err);
        }
    });
    return router;
};

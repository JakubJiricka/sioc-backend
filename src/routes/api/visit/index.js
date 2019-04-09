const model = global.app.model;
const sessionSecret = global.app.config.auth.sessionSecret;
const {split, map} = require('lodash');
const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = router => {
    router.post('/search', async (req, res, next) => {
        try {
            let userAgency = null;
            const header = req.get('Authorization');
            const token = split(header, /\s+/).pop();
            const data = jwt.verify(token, sessionSecret);
            if (data.role === model.enums.roles.MARTILLERO) {
                userAgency = await model.Agency.findOne({'auctioneers.value': new ObjectId(data.id)}, '_id').exec();
            }
            if (data.role === model.enums.roles.VENDEDOR) {
                userAgency = await model.Agency.findOne({'sellers.value': new ObjectId(data.id)}, '_id').exec();
            }
            const options = req.body.searchParams;
            const allVisits = await model.Visit.find(
                {
                    $and: [
                        {
                            $or: [{'agency.requested': new ObjectId(userAgency._id)},
                                {'agency.received': new ObjectId(userAgency._id)}]
                        },
                        {'status': req.body.searchParams.status}
                    ]
                }).sort('-createdAt')
                .limit(options.perPage)
                .skip(options.perPage * options.pageNumber)
                .populate({path: 'dwelling', populate: {path: 'agency'}})
                .populate({path: 'dwelling', populate: {path: 'createdBy'}})
                .populate('createdBy', '-password')
                .populate('agency.received')
                .populate('agency.requested')
                .exec();


            const visits = map(allVisits, visit => {
                if (!userAgency._id.equals(visit.agency.requested._id)) {
                    visit.client = undefined;
                    return visit;
                } else {
                    return visit;
                }
            });
            res.send({visits});
        } catch (err) {
            next(err);
        }
    });

    router.post('/', async (req, res, next) => {
        try {
            let userAgency = null;
            const header = req.get('Authorization');
            const token = split(header, /\s+/).pop();
            const data = jwt.verify(token, sessionSecret);
            if (data.role === model.enums.roles.MARTILLERO) {
                userAgency = await model.Agency.findOne({'auctioneers.value': new ObjectId(data.id)}, '_id').exec();
            }
            if (data.role === model.enums.roles.VENDEDOR) {
                userAgency = await model.Agency.findOne({'sellers.value': new ObjectId(data.id)}, '_id').exec();
            }
            const visit = new model.Visit(req.body.visit);
            visit.createdBy = data.id;
            if(!visit.status)
            {
                visit.status = model.enums.visit.NEW;    
            }
            visit.agency.requested = userAgency._id;
            await visit.save();
            res.send({success: true});
        } catch (err) {
            next(err);
        }
    });

    router.get('/:id', (req, res, next) => {
        model.Visit.findById(req.params.id).exec().then(
            visit => res.send({visit})
        ).catch(next);
    });

    router.put('/:id', (req, res, next) =>{
       model.Visit.findByIdAndUpdate(req.params.id, req.body.visit,function(err,result){
            if(err)
                console.log(err);
            res.send(result);
        })
        // .exec().then(
        //     () => res.send({success: true})
        // ).catch(next)
    });

    router.put('/:id/status', async (req, res, next) => {
        try {
            await model.Visit.findByIdAndUpdate(req.params.id, { $set: { status: req.body.visit.status }}).exec();
            res.send({success: true});
        } catch (err) {
            next(err);
        }
    });

    return router;
};

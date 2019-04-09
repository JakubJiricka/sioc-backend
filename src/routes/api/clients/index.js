/* eslint-disable lodash/collection-method-value,lodash/collection-return */
const model = global.app.model;
const sessionSecret = global.app.config.auth.sessionSecret;
const {split, map, isEmpty, some, isUndefined} = require('lodash');
const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;
module.exports = router => {

    router.post('/', async (req, res, next) => {
        try {
            let userAgency = null;
            const header = req.get('Authorization');
            const token = split(header, /\s+/).pop();
            const data = jwt.verify(token, sessionSecret);
            let isClient = '';
            if (req.body.client.email !== '') {
                isClient = await model.Client.findOne({email: req.body.client.email}).exec();
            }
            if (data.role === model.enums.roles.MARTILLERO) {
                userAgency = await model.Agency.findOne({'auctioneers.value': new ObjectId(data.id)}, '_id').exec();
            }
            if (data.role === model.enums.roles.VENDEDOR) {
                userAgency = await model.Agency.findOne({'sellers.value': new ObjectId(data.id)}, '_id').exec();
            }
            if (!isEmpty(isClient)) {
                if (some(isClient.agencies, e => e.agency.toString() === userAgency._id.toString())) {
                    return res.status(409).send({message: 'Client Already Exists'});
                }
                await model.Client.findByIdAndUpdate({_id: isClient._id}, {
                    $push: {
                        agencies: {
                            agency: new ObjectId(userAgency._id),
                        }
                    }
                }).exec();
                await model.Agency.findByIdAndUpdate({_id: userAgency._id}, {
                    $push: {
                        clients: {
                            value: new ObjectId(isClient._id),
                        }
                    }
                }).exec();
                return res.send({success: true});
            }
            const client = new model.Client(req.body.client);
            client.agencies.push({agency: new ObjectId(userAgency._id)});
            await client.save();
            await model.Agency.findByIdAndUpdate({_id: userAgency._id}, {
                $push: {
                    clients: {
                        value: new ObjectId(client._id),
                    }
                }
            }).exec();
            if(!isUndefined(req.body.client.user)) {
                await model.User.findByIdAndUpdate(req.body.client.user, {role: model.enums.roles.CLIENTE}).exec();
            }
            res.send({success: true});
        } catch (err) {
            next(err);
        }
    });

    router.put('/:id', async (req, res, next) => {
        try {
            const old_client = await model.Client.findById(req.params.id).exec();

            const email_count = req.body.client.email == old_client.email ? 0 : await model.Client.count({email: req.body.client.email}).exec();
            if (email_count) {
                return res.status(409).send({message: 'Email is already taken'});
            }
            await model.Client.findByIdAndUpdate(req.params.id, req.body.client).exec();
            if (isUndefined(req.body.client.user)) {
                await model.Client.findByIdAndUpdate(req.params.id, { $unset: { user: ''} }).exec();
            } else {
                await model.User.findByIdAndUpdate(req.body.client.user, {role: model.enums.roles.CLIENTE}).exec();
            }
            res.send({success: true});
        } catch (err) {
            next(err);
        }
    });

    router.get('/', async (req, res, next) => {
        let clients = null;
        try {
            const header = req.get('Authorization');
            const token = split(header, /\s+/).pop();
            const data = jwt.verify(token, sessionSecret);
            if (data.role === model.enums.roles.MARTILLERO) {
                clients = await model.Agency.findOne({'auctioneers.value': new ObjectId(data.id)}, 'clients').sort('-createdAt').populate('clients.value', '-password').exec();
            }
            if (data.role === model.enums.roles.VENDEDOR) {
                clients = await model.Agency.findOne({'sellers.value': new ObjectId(data.id)}, 'clients').sort('-createdAt').populate('clients.value', '-password').exec();
            }
            if (data.role === model.enums.roles.CLIENTE) {
                clients = await model.Client.findOne({'user': new ObjectId(data.id)}).sort('-createdAt').exec();
            }
            if (data.role === model.enums.roles.ADMIN) {
                const clients = [];
                const allClients = await model.Agency.find({}, 'clients name').sort('-createdAt').populate('clients.value', '-password').exec();
                map(allClients, aClients => {
                    map(aClients.clients, bClients => {
                        clients.push(bClients);
                    });
                });
                return res.send({clients});
            }
            res.send(clients);
        } catch (err) {
            next(err);
        }
    });

    router.put('/delete/:id', (req, res, next) =>
        model.Client.findByIdAndUpdate(req.params.id, {deleted: true}).exec().then(
            () => res.send({success: true})
        ).catch(next)
    );

    router.get('/search', async (req, res, next) => {
        const query = {};
        query['clients.value.name'] = {$regex: '.*' + req.query.q + '.*', $options: 'i'};
        query['value.deleted'] = false;
        let clients = null;
        try {
            const header = req.get('Authorization');
            const token = split(header, /\s+/).pop();
            const data = jwt.verify(token, sessionSecret);
            if (data.role === model.enums.roles.MARTILLERO) {
                clients = await model.Agency.findOne({'auctioneers.value': new ObjectId(data.id)}, 'clients').sort('-createdAt').populate('clients.value', '-password').exec();
            }
            if (data.role === model.enums.roles.VENDEDOR) {
                clients = await model.Agency.findOne({'sellers.value': new ObjectId(data.id)}, 'clients').sort('-createdAt').populate('clients.value', '-password').exec();
            }
            res.send(clients);
        } catch (err) {
            next(err);
        }
    });
    return router;
}
;

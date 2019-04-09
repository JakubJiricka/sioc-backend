/* eslint-disable lodash/prefer-lodash-method */
const model = global.app.model;
const ObjectId = require('mongoose').Types.ObjectId;

module.exports = router => {
    router.post('/', async (req, res, next) => {
        try {
            const viewOptions = req.body.viewOptions;
            let beginDate = req.body.beginDate;
            let endDate = req.body.endDate;

            beginDate = new Date(beginDate);
            endDate = new Date(endDate);
            // beginDate = beginDate.substring(0, 10) + "T00:00:00:00Z";
            // endDate = endDate.substring(0, 10) + "T23:59:59:00Z";

            const dwellings = {};
            dwellings.properties = await model.Dwelling.find(
                {
                    occupationStatus: 'Disponible', createdAt: {$lte: endDate}
                }).count();
            dwellings.onsale = await model.Dwelling.find(
                {
                    publicationType: 'Venta', occupationStatus: 'Disponible', createdAt: {$lte: endDate}
                }).count(); // publicationType     :  "Venta" // sale
            dwellings.forrent = await model.Dwelling.find(
                {
                    publicationType: 'Alquiler', occupationStatus: 'Disponible', createdAt: {$lte: endDate}
                }).count(); // publicationType     :  "Alquiler" //  rent
            dwellings.forsaleandrent = dwellings.onsale + dwellings.forrent; // sale + forrent
            switch (viewOptions) {
                case '0':
                    dwellings.notpublished = await model.Dwelling.find(
                        {
                            'occupationStatus': {$in: ['Alquilada', 'Vendida', 'Reservada', 'Suspendida', 'Tasaciones']},
                            'createdAt': {$lte: endDate}
                        }).count();// occupationStatus  !=  "Disponible" // disabled dwellings
                    dwellings.sold = await model.Dwelling.find(
                        {
                            'occupationStatus': 'Vendida',
                            'createdAt': {$lte: endDate}
                        }).count();// occupationStatus     =  "Vendida" // sold
                    dwellings.rented = await model.Dwelling.find(
                        {
                            'occupationStatus': 'Alquilada',
                            'createdAt': {$lte: endDate}
                        }).count();// occupationStatus     =  "Alquilada" // rented
                    dwellings.unsubscribed = await model.Dwelling.find(
                        {
                            'occupationStatus': 'Suspendida',
                            'createdAt': {$lte: endDate}
                        }).count();// occupationStatus     =  "Suspendida" // suspended
                    dwellings.reserved = await model.Dwelling.find(
                        {
                            'occupationStatus': 'Reservada',
                            'createdAt': {$lte: endDate},
                        }).count();// occupationStatus     =  "Reservada" // reserved
                    dwellings.appraisals = await model.Dwelling.find(
                        {
                            'occupationStatus': 'Tasaciones',
                            'createdAt': {$lte: endDate}
                        }).count();// occupationStatus     =  "Tasaciones" // appraisals
                    dwellings.deleted = await model.Dwelling.find(
                        {
                            'occupationStatus': 'Eliminada',
                            'createdAt': {$lte: endDate}
                        }).count();// occupationStatus     =  "Eliminada" // deleted
                    dwellings.agencyData = await model.Agency.aggregate(
                        [{
                            $lookup: {
                                from: 'dwelling',
                                let: {id: '$_id'},
                                pipeline: [
                                    {
                                        $match:
                                            {
                                                $expr:
                                                    {
                                                        $and:
                                                            [
                                                                {$eq: ['$agency', '$$id']},
                                                                {$lte: ['$createdAt', endDate]}
                                                            ]
                                                    }
                                            }
                                    },
                                    {
                                        $project: {
                                            'publicationType': 1,
                                            'type': 1,
                                            'subtype': 1,
                                            'occupationStatus': 1,
                                            'occupationStatusHistory': 1,
                                            'createdAt': 1
                                        }
                                    }
                                ],
                                as: 'agency_data'
                            }
                        }
                        ]);
                    break;
                default:
                    dwellings.notpublished = await model.Dwelling.find(
                        {
                            // "occupationStatus": { $ne: "Disponible" },
                            'createdAt': {$lte: endDate},
                            'occupationStatusHistory.status': {$in: ['Alquilada', 'Vendida', 'Reservada', 'Suspendida', 'Tasaciones']},
                            'occupationStatusHistory.modified': {$gte: beginDate, $lte: endDate}
                        }).count();// occupationStatus  !=  "Disponible" // disabled dwellings
                    dwellings.sold = await model.Dwelling.find(
                        {
                            // "occupationStatus": "Vendida",
                            'createdAt': {$lte: endDate},
                            'occupationStatusHistory.status': 'Vendida',
                            'occupationStatusHistory.modified': {$gte: beginDate, $lte: endDate}
                        }).count();// occupationStatus     =  "Vendida" // sold
                    dwellings.rented = await model.Dwelling.find(
                        {
                            // "occupationStatus": "Alquilada",
                            'createdAt': {$lte: endDate},
                            'occupationStatusHistory.status': 'Alquilada',
                            'occupationStatusHistory.modified': {$gte: beginDate, $lte: endDate}
                        }).count();// occupationStatus     =  "Alquilada" // rented
                    dwellings.unsubscribed = await model.Dwelling.find(
                        {
                            // occupationStatus: "Suspendida",
                            'createdAt': {$lte: endDate},
                            'occupationStatusHistory.status': 'Suspendida',
                            'occupationStatusHistory.modified': {$gte: beginDate, $lte: endDate}
                        }).count();// occupationStatus     =  "Suspendida" // suspended
                    dwellings.reserved = await model.Dwelling.find(
                        {
                            // occupationStatus: "Reservada",
                            'createdAt': {$lte: endDate},
                            'occupationStatusHistory.status': 'Reservada',
                            'occupationStatusHistory.modified': {$gte: beginDate, $lte: endDate}
                        }).count();// occupationStatus     =  "Reservada" // reserved
                    dwellings.appraisals = await model.Dwelling.find(
                        {
                            // occupationStatus: "Tasaciones",
                            'createdAt': {$lte: endDate},
                            'occupationStatusHistory.status': 'Tasaciones',
                            'occupationStatusHistory.modified': {$gte: beginDate, $lte: endDate}
                        }).count();// occupationStatus     =  "Tasaciones" // appraisals
                    dwellings.deleted = await model.Dwelling.find(
                        {
                            // occupationStatus: "Eliminada",
                            'createdAt': {$lte: endDate},
                            'occupationStatusHistory.status': 'Eliminada',
                            'occupationStatusHistory.modified': {$gte: beginDate, $lte: endDate}
                        }).count();// occupationStatus     =  "Eliminada" // deleted
                    dwellings.agencyData = await model.Agency.aggregate([
                        {
                            $lookup:
                                {
                                    from: 'dwelling',
                                    let: {id: '$_id'},
                                    pipeline: [
                                        {
                                            $match:
                                                {
                                                    $expr:
                                                        {
                                                            $and:
                                                                [
                                                                    {$eq: ['$agency', '$$id']},
                                                                    {$gte: ['$createdAt', beginDate]},
                                                                    {$lte: ['$createdAt', endDate]}
                                                                ]
                                                        }
                                                }
                                        },
                                        {
                                            $project: {
                                                'publicationType': 1,
                                                'type': 1,
                                                'subtype': 1,
                                                'occupationStatus': 1,
                                                'occupationStatusHistory': 1,
                                                'createdAt': 1
                                            }
                                        }
                                    ],
                                    as: 'agency_data'
                                }
                        }
                    ]);
                    break;
            }
            res.send({success: true, viewType: viewOptions, res: dwellings});
        } catch (err) {
            next(err);
        }
    });

    router.post('/detailed/', async (req, res, next) => {
        try {
            const options = req.body.page;
            const viewOptions = req.body.viewOptions;
            const filterBy = req.body.filterBy;
            const agency = req.body.agency;
            let beginDate = req.body.beginDate;
            let endDate = req.body.endDate;

            beginDate = new Date(beginDate);
            endDate = new Date(endDate);
            // beginDate = beginDate.substring(0, 10) + "T00:00:00:00Z";
            // endDate = endDate.substring(0, 10) + "T23:59:59:00Z";

            const occupationStatuses = {
                available: 'Disponible',
                sold: 'Vendida',
                rented: 'Alquilada',
                unsubscribed: 'Suspendida',
                reserved: 'Reservada',
                appraisals: 'Tasaciones',
                deleted: 'Eliminada'
            };

            const query = {};

            let dwellings = [];

            switch (viewOptions) {
                case '0':
                    if (agency !== '') {
                        query['agency'] = new ObjectId(agency);
                    }
                    query['createdAt'] = {$lte: endDate};
                    if (['onsale', 'forrent'].includes(filterBy)) {
                        switch (filterBy) {
                            case 'onsale':
                                query['publicationType'] = 'Venta';
                                query['occupationStatus'] = 'Disponible';
                                break;
                            case 'forrent':
                                query['publicationType'] = 'Alquiler';
                                query['occupationStatus'] = 'Disponible';
                                break;
                        }
                    } else {
                        query['occupationStatus'] = occupationStatuses[filterBy];
                    }
                    dwellings = await model.Dwelling.find({
                        '$and': [
                            query
                        ]
                    })
                        .sort({'updatedAt': -1})
                        .limit(options.perPage)
                        .skip(options.perPage * options.pageNumber)
                        .lean()
                        .exec();
                    break;
                default:
                    if (agency !== '') {
                        query['agency'] = new ObjectId(agency);
                        query['createdAt'] = {$gte: beginDate, $lte: endDate};
                    } else {
                        query['createdAt'] = {$lte: endDate};
                    }
                    if (['onsale', 'forrent'].includes(filterBy)) {
                        switch (filterBy) {
                            case 'onsale':
                                query['publicationType'] = 'Venta';
                                query['occupationStatus'] = 'Disponible';
                                break;
                            case 'forrent':
                                query['publicationType'] = 'Alquiler';
                                query['occupationStatus'] = 'Disponible';
                                break;
                        }
                    } else {
                        query['occupationStatusHistory.status'] = occupationStatuses[filterBy];
                        query['occupationStatusHistory.modified'] = {$gte: beginDate, $lte: endDate};
                    }
                    dwellings = await model.Dwelling.find({
                        '$and': [
                            query
                        ]
                    })
                        .sort({'updatedAt': -1})
                        .limit(options.perPage)
                        .skip(options.perPage * options.pageNumber)
                        .lean()
                        .exec();
                    break;
            }
            res.send({success: true, viewType: viewOptions, res: dwellings});
        } catch (err) {
            next(err);
        }
    });

    return router;
};

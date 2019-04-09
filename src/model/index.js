const mongoose = require('mongoose').set('debug', true);
const {values} = require('lodash');

const Schema = mongoose.Schema;
const {ObjectId} = mongoose.Schema;
const model = module.exports;

model.enums = {
    roles: {
        ADMIN: 'admin',
        MARTILLERO: 'martillero',
        VENDEDOR: 'vendedor',
        USUARIO: 'usuario',
        CAPITAN: 'capitan',
        CLIENTE: 'cliente'
    },
    visit: {
        NEW: 'nuevo',
        CONFIRMED: 'confirmado',
        FINALIZED: 'finalizado',
        CANCELLED: 'cancelado',
        FRIENDSHARE:'friendShare'
    }
};

model.User = mongoose.model('User', new Schema({
    password: {type: String},
    email: {type: String},
    name: {type: String},
    surname: {type: String},
    whatsapp: {type: Number},
    birthdate: {type: Date},
    sex: {type: String},
    role: {type: String, enum: values(model.enums.roles)},
    agency: {type: ObjectId, ref: 'Agency'},
    favorite: {type: Array},
    captain: {type: Boolean}
}, {collection: 'users', timestamps: true}));

model.Dwelling = mongoose.model('Dwelling', new Schema({
    siocId: {type: Number, index: true, unique: true},
    publicationType: {type: String},
    address: {},
    type: {type: String},
    subtype: {type: String},
    currency: {type: String},
    price: {type: Number},
    occupationStatus: {type: String},
    spaces: {},
    features: {},
    services: {},
    legal: {},
    images: {},
    client: {
        value: {type: ObjectId, ref: 'Client'},
        label: {type: String}
    },
    generalDescription: {type: String},
    privateDescription: {type: String},
    agency: {type: ObjectId, ref: 'Agency'},
    createdBy: {type: ObjectId, ref: 'User'},
    occupationStatusHistory: [
        new Schema({
            user: {type: ObjectId, ref: 'User'},
            status: {type: String},
            modified: {type: Date, default: Date.now}
        }, {_id: false})
    ]
}, {collection: 'dwelling', timestamps: true}));

model.Agency = mongoose.model('Agency', new Schema({
    auctioneers: [
        new Schema({
            value: {type: ObjectId, ref: 'User'},
            label: {type: String}
        }, {_id: false})
    ],
    captain: {
        value: {type: ObjectId, ref: 'User'},
        label: {type: String}
    },
    sellers: [
        new Schema({
            value: {type: ObjectId, ref: 'User'},
            label: {type: String}
        }, {_id: false})
    ],
    clients: [
        new Schema({
            value: {type: ObjectId, ref: 'Client'},
        }, {_id: false})
    ],
    address: {},
    name: {type: String},
    email: {type: String},
    whatsapp: {type: Number},
    phone: {type: Number},
    deleted: {type: Boolean},

}, {collection: 'agency', timestamps: true}));

model.Client = mongoose.model('Client', new Schema({
    address: {},
    name: {type: String},
    surname: {type: String},
    email: {type: String},
    contactSchedule: {type: String},
    agencies: [
        new Schema({
            agency: {type: ObjectId, ref: 'Agency'},
            dwellings: [
                new Schema({
                    dwelling: {type: ObjectId, ref: 'Dwelling'},
                }, {_id: false})]
        }, {_id: false})
    ],
    user: {type: ObjectId, ref: 'User'},
    documentId: {type: Number},
    cuit: {type: Number},
    phone: {type: Number},
    birthdate: {type: Date},
    workPhone: {type: Number},
    cellPhone: {type: Number},
    observations: {type: String},
    category: {type: String},
    deleted: {type: Boolean},

}, {collection: 'clients', timestamps: true}));

model.Visit = mongoose.model('Visit', new Schema({
    client: {
        value: {type: ObjectId, ref: 'Client'},
        label: {type: String}
    },
    dwelling: {type: ObjectId, ref: 'Dwelling'},
    dateVisit: {type: Date},
    timeVisit: {type: String},
    createdBy: {type: ObjectId, ref: 'User'},
    agency: {
        requested: {type: ObjectId, ref: 'Agency'},
        received: {type: ObjectId, ref: 'Agency'}
    },
    comment: {type: String},
    status: {type: String, enum: values(model.enums.visit)},
}, {collection: 'visit', timestamps: true}));

model.Error = mongoose.model('Error', new Schema({}, {collection: 'logs.errors'}));

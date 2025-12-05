// models/Vehicle.js
import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    modelo: {
        type: String,
        required: true,
    },
    placa: {
        type: String,
        required: true,
        unique: true,
    },
    ano: {
        type: Number,
        required: true,
    },
    cor: {
        type: String,
    },
    nomeProprietario: {
        type: String,
        required: true,
    },
    ID_Usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isPublic: {
        type: Boolean,
        default: false,
    },
    valorFIPE: {
        type: String,
    },
    recallPendente: {
        type: Boolean,
        default: false,
    },
    proximaRevisaoKm: {
        type: Number,
    },
}, { timestamps: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;

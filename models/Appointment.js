// models/Appointment.js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    data: {
        type: Date,
        required: true,
    },
    hora: {
        type: String,
        required: true,
    },
    descricao: {
        type: String,
        required: true,
    },
    ID_Usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;

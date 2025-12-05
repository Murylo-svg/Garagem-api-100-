// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    Nome_Usuario: {
        type: String,
        required: true,
    },
    Email_login: {
        type: String,
        required: true,
        unique: true,
    },
    Senha_login: {
        type: String,
        required: true,
    },
    Idade: {
        type: Number,
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export default User;

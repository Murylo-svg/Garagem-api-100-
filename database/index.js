// database/index.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('ERRO: A variável de ambiente MONGO_URI deve ser definida no arquivo .env para MongoDB.');
    process.exit(1);
}

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
        });
        console.log('Conectado ao MongoDB com sucesso.');
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err);
        process.exit(1);
    }
};

export default connectDB;

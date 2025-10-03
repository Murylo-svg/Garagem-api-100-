// server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

// __filename e __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001; // Porta do servidor
const mongoURI = process.env.MONGODB_URI; // URI de conexão com o MongoDB

// ----- Conexão com o MongoDB -----
if (!mongoURI) {
    console.error('ERRO: A variável de ambiente MONGODB_URI deve ser definida no arquivo .env');
    // Para ambientes de produção, você pode querer sair do processo
    // process.exit(1); 
    console.warn('Continuando sem MongoDB. Verifique seu arquivo .env para MONGODB_URI.');
} else {
    mongoose.connect(mongoURI)
        .then(() => console.log('Conectado ao MongoDB com sucesso.'))
        .catch(err => {
            console.error('Erro ao conectar ao MongoDB:', err);
            // Em caso de falha crítica na conexão, pode ser útil sair
            // process.exit(1); 
            console.warn('Conexão com MongoDB falhou, o servidor iniciará sem suporte a banco de dados.');
        });
}


// =================================================================
// ===== SCHEMAS E MODELS (MONGOOSE) ===============================
// (Mantidos aqui para que a conexão Mongoose seja útil)
// =================================================================

// ----- Schema e Model do Usuário (Mantido para referência) -----
const usuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    senha: { type: String, required: true }
}, { timestamps: true });

export const Usuario = mongoose.model('Usuario', usuarioSchema); // Exportado para uso em outros arquivos

// ----- Schema e Model do Veículo (Já existente) -----
const veiculoSchema = new mongoose.Schema({
    placa: { type: String, required: true, unique: true, uppercase: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    marca: { type: String, required: true, trim: true },
    ano: { type: Number, required: true },
    cor: { type: String, trim: true },
    nomeProprietario: { type: String, required: true, trim: true }
}, { timestamps: true });

export const Veiculo = mongoose.model('Veiculo', veiculoSchema); // Exportado para uso em outros arquivos


// ----- Middlewares (para servir arquivos estáticos) -----
// Permite que o servidor sirva arquivos estáticos da pasta 'public'
// Certifique-se de ter uma pasta 'public' no mesmo nível do seu 'server.js'
// e coloque seu 'index.html', 'styles.css', 'script.js' lá.
app.use(express.static(path.join(__dirname, "public")));

// Rota raiz - Serve o arquivo index.html da pasta 'public'
// Se você navegar para http://localhost:PORT, ele irá mostrar o seu site.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor de site estático rodando em http://localhost:${port}`);
    console.log(`Servindo arquivos de: ${path.join(__dirname, "public")}`);
    console.log("A conexão com o MongoDB está configurada, e os Models estão disponíveis para uso futuro em rotas de API.");
});
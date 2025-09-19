// server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Importado para hashear senhas
import jwt from 'jsonwebtoken'; // Importado para criar tokens

// __filename e __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001;
const mongoURI = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET; // Carrega o segredo do JWT

// ----- Conexão com o MongoDB -----
if (!mongoURI || !jwtSecret) {
    console.error('ERRO: As variáveis de ambiente MONGODB_URI e JWT_SECRET devem ser definidas no arquivo .env');
    process.exit(1);
}

mongoose.connect(mongoURI)
    .then(() => console.log('Conectado ao MongoDB com sucesso.'))
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err);
        process.exit(1);
    });

// =================================================================
// ===== SCHEMAS E MODELS (MONGOOSE) ===============================
// =================================================================

// ----- Schema e Model do Usuário -----
const usuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    senha: { type: String, required: true }
}, { timestamps: true });

const Usuario = mongoose.model('Usuario', usuarioSchema);

// ----- Schema e Model do Veículo (Já existente) -----
const veiculoSchema = new mongoose.Schema({
    placa: { type: String, required: true, unique: true, uppercase: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    marca: { type: String, required: true, trim: true },
    ano: { type: Number, required: true },
    cor: { type: String, trim: true },
    nomeProprietario: { type: String, required: true, trim: true }
}, { timestamps: true });

const Veiculo = mongoose.model('Veiculo', veiculoSchema);

// ----- Middlewares -----
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'); // Adicionado 'Authorization'
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// =================================================================
// ===== ENDPOINTS DE AUTENTICAÇÃO (CADASTRO E LOGIN) ==============
// =================================================================

// ----- ROTA: Registrar um novo usuário -----
// Rota: POST /api/auth/registrar
app.post('/api/auth/registrar', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        // Verifica se o email já existe no banco
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(409).json({ error: 'Este email já está cadastrado.' });
        }

        // Gera o "sal" e cria o hash da senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        // Cria o novo usuário com a senha hasheada
        const novoUsuario = new Usuario({ nome, email, senha: senhaHash });
        await novoUsuario.save();

        console.log(`[Servidor] Usuário registrado com sucesso: ${email}`);
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });

    } catch (error) {
        console.error('[Servidor] Erro ao registrar usuário:', error.message);
        res.status(500).json({ error: 'Erro interno ao registrar o usuário.' });
    }
});


// ----- ROTA: Fazer login de um usuário -----
// Rota: POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        // Busca o usuário pelo email
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // Mensagem genérica por segurança
        }

        // Compara a senha enviada com o hash salvo no banco
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // Mensagem genérica por segurança
        }

        // Se a senha estiver correta, gera um token JWT
        const payload = { id: usuario.id, nome: usuario.nome };
        const token = jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '8h' } // Token expira em 8 horas
        );

        console.log(`[Servidor] Login bem-sucedido para: ${email}`);
        res.status(200).json({ token: token, nomeUsuario: usuario.nome });

    } catch (error) {
        console.error('[Servidor] Erro ao fazer login:', error.message);
        res.status(500).json({ error: 'Erro interno ao tentar fazer login.' });
    }
});


// =================================================================
// ===== ENDPOINTS PARA GERENCIAMENTO DE VEÍCULOS (CRUD) =========
// =================================================================

// (As rotas de veículos que você já tem continuam aqui)
// POST /api/veiculos, GET /api/veiculos, PUT /api/veiculos/:id, DELETE /api/veiculos/:id
// ... (código das rotas de veículos omitido por brevidade, mas deve permanecer no seu arquivo)

// ----- ROTA: Adicionar um novo veículo (CREATE) -----
app.post('/api/veiculos', async (req, res) => {
    try {
        const { placa, modelo, marca, ano, cor, nomeProprietario } = req.body;
        if (!placa || !modelo || !marca || !ano || !nomeProprietario) {
            return res.status(400).json({ error: 'Campos obrigatórios: placa, modelo, marca, ano e nome do proprietário.' });
        }
        const novoVeiculo = new Veiculo({ placa, modelo, marca, ano, cor, nomeProprietario });
        await novoVeiculo.save();
        console.log(`[Servidor] Veículo inserido com sucesso: ${placa}`);
        res.status(201).json(novoVeiculo);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Placa já cadastrada.' });
        }
        res.status(500).json({ error: 'Erro interno ao salvar o veículo.' });
    }
});

// ----- ROTA: Listar todos os veículos (READ) -----
app.get('/api/veiculos', async (req, res) => {
    try {
        const veiculos = await Veiculo.find();
        res.json(veiculos);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao buscar os veículos.' });
    }
});

// ----- ROTA: Atualizar um veículo (UPDATE) -----
app.put('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID do veículo inválido.' });
        }
        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!veiculoAtualizado) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }
        res.json(veiculoAtualizado);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'A placa informada já pertence a outro veículo.' });
        }
        res.status(500).json({ error: 'Erro interno ao atualizar o veículo.' });
    }
});

// ----- ROTA: Retirar (deletar) um veículo (DELETE) -----
app.delete('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID do veículo inválido.' });
        }
        const veiculoDeletado = await Veiculo.findByIdAndDelete(id);
        if (!veiculoDeletado) {
            return res.status(404).json({ error: 'Veículo não encontrado.' });
        }
        res.status(200).json({ message: `Veículo com placa ${veiculoDeletado.placa} removido com sucesso.` });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao deletar o veículo.' });
    }
});


// Rota raiz apenas para teste
app.get('/', (req, res) => {
    res.send('Servidor Backend da Garagem Inteligente está no ar!');
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
});
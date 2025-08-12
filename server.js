// server.js

// --- 1. IMPORTAÇÕES ---
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose'; // ORM para MongoDB

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// --- 2. CONFIGURAÇÕES INICIAIS ---
const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY;

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// --- 3. CONEXÃO COM O BANCO DE DADOS MONGODB ---
// A conexão será iniciada na função startServer() no final do arquivo.

// --- 4. DEFINIÇÃO DOS MODELS (SCHEMAS) DO MONGOOSE ---

// Schema para Usuários
const usuarioSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // 'unique' cria um índice para garantir que o email não se repita
    senha: { type: String, required: true },
    data_criacao: { type: Date, default: Date.now }
});
const Usuario = mongoose.model('Usuario', usuarioSchema);

// Schema para Veículos
const veiculoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    tipo: { type: String, required: true, enum: ['Carro', 'Moto', 'Caminhão', 'Outro'] }, // enum para tipos pré-definidos
    placa: { type: String, unique: true, sparse: true }, // Permite múltiplas placas nulas, mas placas preenchidas devem ser únicas
    imagem_url: { type: String },
    // Referência ao usuário proprietário do veículo
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
});
const Veiculo = mongoose.model('Veiculo', veiculoSchema);

// Schema para Manutenções
const manutencaoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descricao: { type: String },
    data_manutencao: { type: Date, required: true },
    custo: { type: Number, default: 0 },
    veiculo: { type: String }, // Mantido como String simples, mas poderia ser uma referência a um Veiculo
    status: { type: String, default: 'Pendente' },
    // Referência ao usuário que registrou a manutenção
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
});
const Manutencao = mongoose.model('Manutencao', manutencaoSchema);


// ----- ENDPOINTS DA API OPENWEATHERMAP (Extras, permanecem iguais) -----
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
    if (!apiKey) {
        return res.status(500).json({ message: 'Chave da API não configurada.' });
    }
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar previsão do tempo.' });
    }
});


// ----- ENDPOINTS DA APLICAÇÃO (USUÁRIOS E MANUTENÇÕES) -----

// --- ROTAS DE USUÁRIOS ---

// GET: Retornar todos os usuários (sem a senha)
app.get('/api/usuarios', async (req, res) => {
  try {
    // Usamos .select('-senha') para excluir o campo da senha do retorno
    const usuarios = await Usuario.find().select('-senha');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuários.', error: error.message });
  }
});

// POST: Criar um novo usuário (ex: registro)
app.post('/api/usuarios', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios.' });
    }
    try {
        // !! AVISO DE SEGURANÇA: Continue usando bcrypt para hashear a senha!
        const novoUsuario = new Usuario({ nome, email, senha });
        const usuarioSalvo = await novoUsuario.save();
        
        // Remove a senha do objeto de resposta
        const resposta = usuarioSalvo.toObject();
        delete resposta.senha;

        res.status(201).json(resposta);
    } catch (error) {
        // Código 11000 é o erro do MongoDB para chave duplicada
        if (error.code === 11000) {
            return res.status(409).json({ mensagem: 'Este email já está cadastrado.' });
        }
        res.status(500).json({ mensagem: 'Erro ao criar usuário.', error: error.message });
    }
});


// ----- ROTAS DE VEÍCULOS -----

// GET: Retornar todos os veículos de um usuário específico
app.get('/api/usuarios/:usuarioId/veiculos', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const veiculos = await Veiculo.find({ usuario_id: usuarioId });
        res.json(veiculos);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar veículos.', error: error.message });
    }
});

// POST: Criar um novo veículo para um usuário
app.post('/api/veiculos', async (req, res) => {
    const { nome, tipo, placa, imagem_url, usuario_id } = req.body;
    if (!nome || !tipo || !usuario_id) {
        return res.status(400).json({ mensagem: 'Nome, tipo e ID do usuário são obrigatórios.' });
    }
    try {
        const novoVeiculo = new Veiculo({ nome, tipo, placa, imagem_url, usuario_id });
        const veiculoSalvo = await novoVeiculo.save();
        res.status(201).json(veiculoSalvo);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ mensagem: 'Já existe um veículo com esta placa.' });
        }
        res.status(500).json({ mensagem: 'Erro ao cadastrar veículo.', error: error.message });
    }
});


// --- ROTAS DE MANUTENÇÕES ---

// GET: Retornar todas as manutenções com o nome do usuário
app.get('/api/manutencoes', async (req, res) => {
  try {
    // Usamos .populate() para buscar dados de outra coleção (similar ao JOIN)
    // Aqui, buscamos o 'nome' do usuário referenciado pelo campo 'usuario_id'
    const manutencoes = await Manutencao.find()
        .populate('usuario_id', 'nome') // O segundo argumento seleciona quais campos trazer
        .sort({ data_manutencao: -1 }); // -1 para ordem decrescente

    // Renomeia o campo para manter a consistência com o frontend, se necessário
    const resposta = manutencoes.map(m => ({
        ...m.toObject(),
        nome_usuario: m.usuario_id ? m.usuario_id.nome : 'Usuário não encontrado'
    }));

    res.json(resposta);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar manutenções.', error: error.message });
  }
});

// POST: Criar uma nova manutenção
app.post('/api/manutencoes', async (req, res) => {
    const { titulo, descricao, data_manutencao, custo, veiculo, status, usuario_id } = req.body;
    if (!titulo || !data_manutencao || !usuario_id) {
        return res.status(400).json({ mensagem: 'Título, data da manutenção e ID do usuário são obrigatórios.' });
    }
    try {
        const novaManutencao = new Manutencao({ titulo, descricao, data_manutencao, custo, veiculo, status, usuario_id });
        const manutencaoSalva = await novaManutencao.save();
        res.status(201).json(manutencaoSalva);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao registrar manutenção.', error: error.message });
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
async function startServer() {
    try {
        // Conecta ao MongoDB usando a URI do .env
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado com sucesso ao banco de dados MongoDB!');

        // Inicia o servidor Express
        app.listen(port, () => {
            console.log(`🚀 Servidor backend rodando em http://localhost:${port}`);
        });
    } catch (error) {
        console.error('❌ Falha ao conectar ao MongoDB ou iniciar o servidor:', error);
        process.exit(1); // Encerra se não conseguir conectar ao BD
    }
}

// Inicia todo o processo
startServer();
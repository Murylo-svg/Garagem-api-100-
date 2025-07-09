// server.js

// --- 1. IMPORTAÇÕES ---
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
// --- NOVO: Importações do MongoDB ---
import { MongoClient, ObjectId } from 'mongodb'; // ObjectId é crucial para buscar por ID

// __filename e __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// --- 2. CONFIGURAÇÕES INICIAIS ---
const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY;
// --- NOVO: Pega a URI de conexão do MongoDB do arquivo .env ---
const mongoUri = process.env.MONGO_URI;

// --- NOVO: Variáveis para guardar a conexão com o banco e as coleções ---
let db;
let produtosCollection, usuariosCollection, pedidosCollection, chamadosCollection;

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Middleware para parsear JSON
app.use(express.json());

// --- 3. FUNÇÃO PRINCIPAL PARA INICIAR O SERVIDOR ---
async function startServer() {
    if (!mongoUri) {
        console.error('ERRO FATAL: A variável de ambiente MONGO_URI não está definida no arquivo .env');
        process.exit(1); // Encerra o processo se não houver URI do banco
    }

    try {
        // --- Conexão com o MongoDB ---
        const client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Conectado com sucesso ao MongoDB!');

        // Seleciona o banco de dados (troque 'garagem_inteligente_db' pelo nome do seu banco)
        db = client.db('garagem_inteligente_db');

        // Pega as coleções que vamos usar
        produtosCollection = db.collection('produtos');
        usuariosCollection = db.collection('usuarios');
        pedidosCollection = db.collection('pedidos');
        chamadosCollection = db.collection('chamadosSuporte');

        // Inicia o servidor Express APÓS a conexão com o banco ter sido estabelecida
        app.listen(port, () => {
            console.log(`🚀 Servidor backend rodando em http://localhost:${port}`);
            if (!apiKey) {
                console.warn('ATENÇÃO: A variável de ambiente OPENWEATHER_API_KEY não foi encontrada.');
            } else {
                console.log('Chave da API OpenWeatherMap carregada com sucesso.');
            }
        });

    } catch (error) {
        console.error('❌ Falha ao conectar ao MongoDB ou iniciar o servidor:', error);
        process.exit(1);
    }
}


// ----- OS DADOS FALSOS (MOCK DATA) FORAM REMOVIDOS DAQUI -----
// Agora os dados virão diretamente do MongoDB


// ----- ENDPOINTS DA API OPENWEATHERMAP (permanecem iguais) -----
// ... (seu código de previsão, tempoatual e geocoding continua aqui, sem alterações)
app.get('/api/previsao/:cidade', async (req, res) => {
    // seu código aqui...
});

app.get('/api/tempoatual/:cidade', async (req, res) => {
    // seu código aqui...
});

app.get('/api/geocoding/:query', async (req, res) => {
    // seu código aqui...
});


// ----- ENDPOINTS DA APLICAÇÃO (AGORA USANDO MONGODB) -----

// ENDPOINT 1: Retornar todos os produtos
app.get('/api/produtos', async (req, res) => {
  console.log('[Servidor] Requisição recebida em /api/produtos');
  try {
    const produtos = await produtosCollection.find({}).toArray();
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar produtos no banco de dados.' });
  }
});

// ENDPOINT 2: Retornar um produto específico pelo ID
app.get('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[Servidor] Buscando produto com ID: ${id}`);
  
  // Validação para evitar que um ID inválido quebre o servidor
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ mensagem: 'Formato de ID inválido.' });
  }
  
  try {
    const produtoEncontrado = await produtosCollection.findOne({ _id: new ObjectId(id) });
    if (produtoEncontrado) {
      res.json(produtoEncontrado);
    } else {
      res.status(404).json({ mensagem: 'Produto não encontrado!' });
    }
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar produto no banco de dados.' });
  }
});

// ENDPOINT 3: Retornar todos os usuários
app.get('/api/usuarios', async (req, res) => {
  console.log('[Servidor] Requisição recebida em /api/usuarios');
  try {
    const usuarios = await usuariosCollection.find({}).toArray();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuários.' });
  }
});

// ENDPOINT 4: Retornar todos os pedidos
app.get('/api/pedidos', async (req, res) => {
    console.log('[Servidor] Requisição recebida em /api/pedidos');
    try {
        const pedidos = await pedidosCollection.find({}).toArray();
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar pedidos.' });
    }
});

// ENDPOINT 5: Retornar os pedidos de um usuário específico
app.get('/api/usuarios/:id/pedidos', async (req, res) => {
    const usuarioId = parseInt(req.params.id); // Mantendo o ID numérico como no seu exemplo
    console.log(`[Servidor] Buscando pedidos para o usuário ID: ${usuarioId}`);

    if (isNaN(usuarioId)) {
        return res.status(400).json({ mensagem: 'ID de usuário deve ser um número.' });
    }

    try {
        // Aqui buscamos na coleção de pedidos por um campo 'usuarioId' que corresponda
        const pedidosDoUsuario = await pedidosCollection.find({ usuarioId: usuarioId }).toArray();
        res.json(pedidosDoUsuario); // Retorna array vazio se não encontrar, o que é correto
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar pedidos do usuário.' });
    }
});

// ENDPOINT 6: Retornar todos os chamados de suporte
app.get('/api/chamados', async (req, res) => {
    console.log('[Servidor] Requisição recebida em /api/chamados');
    try {
        const chamados = await chamadosCollection.find({}).toArray();
        res.json(chamados);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar chamados de suporte.' });
    }
});


// Rota raiz apenas para teste
app.get('/', (req, res) => {
    res.send('Servidor Backend da Garagem Inteligente está no ar e conectado ao MongoDB!');
});

// --- Inicia todo o processo ---
startServer();